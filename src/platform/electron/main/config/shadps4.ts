import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { access, chmod, copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

import type { Shadps4UpdateChangelog, Shadps4UpdateCommit } from '$lib/contracts/commands';
import type { EmulatorChannel, LauncherConfig } from '$lib/contracts/launcherConfig';
import appDefinition from '$platform/app';

import {
    readLauncherConfig,
    resolveLauncherEmuPath,
    resolveLauncherVersionsPath,
    writeLauncherConfig
} from './launcherConfig';
import { setSplashStatusKey, setSplashStatusProgress } from './splashStatus';

const SHADPS4_GITHUB_REPO_API_URL = 'https://api.github.com/repos/shadps4-emu/shadPS4';
const SHADPS4_RELEASES_API_URL = `${SHADPS4_GITHUB_REPO_API_URL}/releases`;
const SHADPS4_PULL_REQUEST_URL_PREFIX = 'https://github.com/shadps4-emu/shadPS4/pull';
const SHADPS4_CACHE_SCHEMA_VERSION = 1 as const;
const SHADPS4_CACHE_FILE_NAME = 'cache.json';
const SHADPS4_DEFAULT_CHANNEL: EmulatorChannel = 'nightly';

type SupportedArchiveKind = 'zip' | 'tar.gz' | 'binary';

interface GitHubReleaseAsset {
    name: string;
    browser_download_url: string;
    size: number;
    state?: string;
}

interface GitHubRelease {
    tag_name: string;
    name: string | null;
    prerelease: boolean;
    draft: boolean;
    published_at: string | null;
    assets: GitHubReleaseAsset[];
}

interface GitHubCompareCommit {
    sha: string;
    html_url?: string | null;
    commit: {
        message: string;
    };
}

interface GitHubCompareResponse {
    html_url?: string | null;
    commits?: GitHubCompareCommit[];
}

interface CachedShadps4Build {
    channel: EmulatorChannel;
    releaseTag: string;
    releaseName: string | null;
    publishedAt: string | null;
    assetName: string;
    assetUrl: string;
    installDir: string;
    executablePath: string;
    downloadedAt: string;
}

interface Shadps4VersionsCache {
    schemaVersion: typeof SHADPS4_CACHE_SCHEMA_VERSION;
    downloads: CachedShadps4Build[];
}

interface ResolvedShadps4Asset {
    asset: GitHubReleaseAsset;
    archiveKind: SupportedArchiveKind;
}

interface EnsuredShadps4Build {
    version: string;
    executablePath: string;
}

interface CommandSpec {
    command: string;
    args: string[];
}

let setupPromise: Promise<LauncherConfig> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function resolveShadps4CachePath(): string {
    return path.join(resolveLauncherVersionsPath(), SHADPS4_CACHE_FILE_NAME);
}

function createDefaultShadps4Cache(): Shadps4VersionsCache {
    return {
        schemaVersion: SHADPS4_CACHE_SCHEMA_VERSION,
        downloads: []
    };
}

function sanitizePathSegment(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function normalizeOptionalString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
}

function parseContentLength(value: string | null): number | null {
    if (!value) {
        return null;
    }

    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function toNodeReadableStream(stream: ReadableStream<Uint8Array>): NodeReadableStream {
    return stream as unknown as NodeReadableStream;
}

function escapePowerShellLiteral(value: string): string {
    return value.replace(/'/g, "''");
}

async function runCommand({ command, args }: CommandSpec): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const processRef = spawn(command, args, {
            stdio: 'ignore',
            windowsHide: true
        });

        processRef.once('error', reject);
        processRef.once('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`${command} exited with code ${code}.`));
        });
    });
}

async function runCommandWithFallback(commands: CommandSpec[], failureMessage: string): Promise<void> {
    let lastError: unknown = null;

    for (const command of commands) {
        try {
            await runCommand(command);
            return;
        } catch (error) {
            lastError = error;
        }
    }

    const suffix = lastError instanceof Error ? ` ${lastError.message}` : '';
    throw new Error(`${failureMessage}${suffix}`);
}

function resolveZipExtractionCommands(archivePath: string, destinationPath: string): CommandSpec[] {
    if (process.platform === 'win32') {
        const archiveLiteral = escapePowerShellLiteral(archivePath);
        const destinationLiteral = escapePowerShellLiteral(destinationPath);
        const script = `Expand-Archive -LiteralPath '${archiveLiteral}' -DestinationPath '${destinationLiteral}' -Force`;

        return [
            { command: 'powershell.exe', args: ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script] },
            { command: 'pwsh.exe', args: ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script] }
        ];
    }

    if (process.platform === 'darwin') {
        return [
            { command: '/usr/bin/ditto', args: ['-x', '-k', archivePath, destinationPath] },
            { command: 'unzip', args: ['-oq', archivePath, '-d', destinationPath] }
        ];
    }

    return [
        { command: 'unzip', args: ['-oq', archivePath, '-d', destinationPath] },
        { command: 'python3', args: ['-m', 'zipfile', '-e', archivePath, destinationPath] },
        { command: 'python', args: ['-m', 'zipfile', '-e', archivePath, destinationPath] }
    ];
}

function createDownloadProgressTransform(totalBytes: number | null): Transform {
    let downloadedBytes = 0;
    let lastProgress = -1;

    if (totalBytes) {
        setSplashStatusProgress(0);
    }

    return new Transform({
        transform(chunk, _encoding, callback) {
            if (totalBytes) {
                downloadedBytes += chunk.length;
                const nextProgress = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));

                if (nextProgress !== lastProgress) {
                    lastProgress = nextProgress;
                    setSplashStatusProgress(nextProgress);
                }
            }

            callback(null, chunk);
        }
    });
}

function normalizeShadps4Cache(rawCache: unknown): Shadps4VersionsCache {
    if (!isRecord(rawCache) || !Array.isArray(rawCache.downloads)) {
        return createDefaultShadps4Cache();
    }

    const downloads = rawCache.downloads
        .filter(isRecord)
        .map((download): CachedShadps4Build | null => {
            const channel = download.channel === 'nightly' ? 'nightly' : download.channel === 'stable' ? 'stable' : null;
            const releaseTag = normalizeOptionalString(download.releaseTag);
            const assetName = normalizeOptionalString(download.assetName);
            const assetUrl = normalizeOptionalString(download.assetUrl);
            const installDir = normalizeOptionalString(download.installDir);
            const executablePath = normalizeOptionalString(download.executablePath);
            const downloadedAt = normalizeOptionalString(download.downloadedAt);

            if (!channel || !releaseTag || !assetName || !assetUrl || !installDir || !executablePath || !downloadedAt) {
                return null;
            }

            return {
                channel,
                releaseTag,
                releaseName: normalizeOptionalString(download.releaseName),
                publishedAt: normalizeOptionalString(download.publishedAt),
                assetName,
                assetUrl,
                installDir: path.resolve(installDir),
                executablePath: path.resolve(executablePath),
                downloadedAt
            };
        })
        .filter((download): download is CachedShadps4Build => download !== null);

    return {
        schemaVersion: SHADPS4_CACHE_SCHEMA_VERSION,
        downloads
    };
}

async function readShadps4Cache(): Promise<Shadps4VersionsCache> {
    try {
        const rawCache = await readFile(resolveShadps4CachePath(), 'utf8');
        return normalizeShadps4Cache(JSON.parse(rawCache));
    } catch (error) {
        if (error instanceof SyntaxError) {
            return createDefaultShadps4Cache();
        }

        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return createDefaultShadps4Cache();
        }

        throw error;
    }
}

async function writeShadps4Cache(cache: Shadps4VersionsCache): Promise<void> {
    const normalizedCache = normalizeShadps4Cache(cache);
    const cachePath = resolveShadps4CachePath();

    await mkdir(path.dirname(cachePath), { recursive: true });
    await writeFile(cachePath, `${JSON.stringify(normalizedCache, null, 4)}\n`, 'utf8');
}

async function pathExists(targetPath: string | null): Promise<boolean> {
    if (!targetPath) {
        return false;
    }

    try {
        await access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function fetchGitHubJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': `${appDefinition.appShortTitle}/${appDefinition.appVer}`
        }
    });

    if (!response.ok) {
        throw new Error(`GitHub request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
}

function resolveShadps4CommitRef(version: string | null): string | null {
    const matches = version?.match(/[a-f0-9]{7,40}/gi);
    return matches?.at(-1) ?? null;
}

function resolvePullRequestNumber(commitMessage: string): number | null {
    const mergeMatch = commitMessage.match(/merge pull request\s+#(\d+)/i);
    if (mergeMatch) {
        return Number.parseInt(mergeMatch[1], 10);
    }

    const squashMatch = commitMessage.match(/\(#(\d+)\)(?:\s*$|\n)/);
    if (squashMatch) {
        return Number.parseInt(squashMatch[1], 10);
    }

    return null;
}

function mapCompareCommitToChangelogEntry(commit: GitHubCompareCommit): Shadps4UpdateCommit {
    const [rawTitle, ...rawBody] = commit.commit.message.split('\n');
    const title = rawTitle.trim() || commit.sha.slice(0, 12);
    const bodyText = rawBody.join('\n').trim();
    const pullRequestNumber = resolvePullRequestNumber(commit.commit.message);

    return {
        sha: commit.sha,
        shortSha: commit.sha.slice(0, 12),
        title,
        body: bodyText.length > 0 ? bodyText : null,
        commitUrl: typeof commit.html_url === 'string' ? commit.html_url : null,
        pullRequestNumber,
        pullRequestUrl: pullRequestNumber ? `${SHADPS4_PULL_REQUEST_URL_PREFIX}/${pullRequestNumber}` : null
    };
}

function getPlatformAssetTokens() {
    if (process.platform === 'win32') {
        return ['windows', 'win64', 'win', 'msvc'];
    }

    if (process.platform === 'darwin') {
        return ['macos', 'mac', 'osx', 'darwin', 'universal'];
    }

    return ['linux', 'appimage', 'ubuntu', 'glibc'];
}

function getExecutablePatterns(): RegExp[] {
    if (process.platform === 'win32') {
        return [/^shadps4(?:-qt)?\.exe$/i, /^shadps4.*\.exe$/i];
    }

    if (process.platform === 'darwin') {
        return [/^shadps4(?:-qt)?$/i, /^shadps4\.app$/i];
    }

    return [/^shadps4(?:-qt)?\.AppImage$/i, /^shadps4(?:-qt)?$/i, /^shadps4.*$/i];
}

function detectArchiveKind(assetName: string): SupportedArchiveKind | null {
    const normalizedAssetName = assetName.toLowerCase();

    if (normalizedAssetName.endsWith('.zip')) {
        return 'zip';
    }

    if (normalizedAssetName.endsWith('.tar.gz') || normalizedAssetName.endsWith('.tgz')) {
        return 'tar.gz';
    }

    if (
        normalizedAssetName.endsWith('.exe') ||
        normalizedAssetName.endsWith('.appimage') ||
        normalizedAssetName.endsWith('.app')
    ) {
        return 'binary';
    }

    return null;
}

function isSourceAsset(assetName: string): boolean {
    const normalizedAssetName = assetName.toLowerCase();
    return (
        normalizedAssetName.includes('source code') ||
        normalizedAssetName.includes('src') ||
        normalizedAssetName.includes('symbols') ||
        normalizedAssetName.includes('debug')
    );
}

function scoreAssetMatch(asset: GitHubReleaseAsset): number {
    const normalizedAssetName = asset.name.toLowerCase();
    const archiveKind = detectArchiveKind(asset.name);

    if (!archiveKind || isSourceAsset(asset.name)) {
        return Number.NEGATIVE_INFINITY;
    }

    const platformTokens = getPlatformAssetTokens();
    const tokenScore = platformTokens.reduce((score, token) => score + (normalizedAssetName.includes(token) ? 20 : 0), 0);
    const archiveScore =
        archiveKind === 'zip' ? 40 : archiveKind === 'tar.gz' ? 30 : archiveKind === 'binary' ? 20 : 0;
    const shadps4Score = normalizedAssetName.includes('shadps4') ? 20 : 0;
    const stateScore = asset.state === 'uploaded' || !asset.state ? 5 : 0;

    return tokenScore + archiveScore + shadps4Score + stateScore;
}

function resolveReleaseAsset(release: GitHubRelease): ResolvedShadps4Asset {
    const scoredAssets = release.assets
        .map((asset) => ({
            asset,
            score: scoreAssetMatch(asset)
        }))
        .filter(({ score }) => Number.isFinite(score))
        .sort((left, right) => right.score - left.score);

    const selectedAsset = scoredAssets[0]?.asset;
    if (!selectedAsset) {
        throw new Error(`No compatible shadPS4 asset was found for ${process.platform} in release ${release.tag_name}.`);
    }

    const archiveKind = detectArchiveKind(selectedAsset.name);
    if (!archiveKind) {
        throw new Error(`Unsupported shadPS4 asset format for ${selectedAsset.name}.`);
    }

    return {
        asset: selectedAsset,
        archiveKind
    };
}

async function fetchShadps4Releases(): Promise<GitHubRelease[]> {
    setSplashStatusKey('splash.checkingShadps4Release');

    const releases = await fetchGitHubJson<GitHubRelease[]>(SHADPS4_RELEASES_API_URL);
    return Array.isArray(releases) ? releases : [];
}

async function fetchLatestRelease(channel: EmulatorChannel): Promise<GitHubRelease> {
    const releases = await fetchShadps4Releases();

    const selectedRelease = releases.find((release) => {
        if (release.draft) {
            return false;
        }

        if (channel === 'nightly') {
            return release.prerelease;
        }

        return !release.prerelease;
    });

    if (!selectedRelease) {
        throw new Error(`A ${channel} shadPS4 release could not be found on GitHub.`);
    }

    return selectedRelease;
}

async function fetchReleaseCompare(baseRef: string, headRef: string): Promise<GitHubCompareResponse> {
    const compareUrl = `${SHADPS4_GITHUB_REPO_API_URL}/compare/${encodeURIComponent(baseRef)}...${encodeURIComponent(headRef)}`;
    return fetchGitHubJson<GitHubCompareResponse>(compareUrl);
}

function resolveCompareRefCandidates(baseVersion: string, headVersion: string): Array<{ baseRef: string; headRef: string }> {
    const baseCommit = resolveShadps4CommitRef(baseVersion);
    const headCommit = resolveShadps4CommitRef(headVersion);
    const candidates: Array<{ baseRef: string; headRef: string }> = [];

    if (baseCommit && headCommit) {
        candidates.push({
            baseRef: baseCommit,
            headRef: headCommit
        });
    }

    candidates.push({
        baseRef: baseVersion,
        headRef: headVersion
    });

    const seen = new Set<string>();
    return candidates.filter(({ baseRef, headRef }) => {
        const key = `${baseRef}...${headRef}`;
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function resolveBuildDirectoryName(channel: EmulatorChannel): string {
    return channel === 'nightly' ? 'Pre-release' : 'Stable';
}

function resolveBuildInstallDir(channel: EmulatorChannel): string {
    return path.join(resolveLauncherVersionsPath(), channel, resolveBuildDirectoryName(channel));
}

function isBuildStoredInExpectedInstallDir(
    executablePath: string | null | undefined,
    channel: EmulatorChannel
): boolean {
    if (!executablePath) {
        return false;
    }

    const resolvedExecutablePath = path.resolve(executablePath);
    const expectedInstallDir = resolveBuildInstallDir(channel);
    return (
        resolvedExecutablePath === expectedInstallDir ||
        resolvedExecutablePath.startsWith(`${expectedInstallDir}${path.sep}`)
    );
}

async function downloadAssetToFile(downloadUrl: string, destinationPath: string): Promise<void> {
    setSplashStatusKey('splash.downloadingShadps4');

    const response = await fetch(downloadUrl, {
        headers: {
            Accept: 'application/octet-stream',
            'User-Agent': `${appDefinition.appShortTitle}/${appDefinition.appVer}`
        }
    });

    if (!response.ok || !response.body) {
        throw new Error(`shadPS4 asset download failed with status ${response.status}.`);
    }

    await mkdir(path.dirname(destinationPath), { recursive: true });
    const destinationStream = createWriteStream(destinationPath);
    const sourceStream = Readable.fromWeb(toNodeReadableStream(response.body));
    const totalBytes = parseContentLength(response.headers.get('content-length'));
    const progressStream = createDownloadProgressTransform(totalBytes);

    await pipeline(sourceStream, progressStream, destinationStream);

    if (totalBytes) {
        setSplashStatusProgress(100);
    }
}

async function extractTarArchive(archivePath: string, destinationPath: string): Promise<void> {
    await runCommand({
        command: 'tar',
        args: ['-xzf', archivePath, '-C', destinationPath]
    });
}

async function extractZipArchive(archivePath: string, destinationPath: string): Promise<void> {
    await runCommandWithFallback(
        resolveZipExtractionCommands(archivePath, destinationPath),
        `ZIP extraction failed for ${archivePath}.`
    );
}

async function unpackDownloadedAsset(
    archivePath: string,
    archiveKind: SupportedArchiveKind,
    destinationPath: string
): Promise<void> {
    setSplashStatusKey('splash.extractingShadps4');
    await mkdir(destinationPath, { recursive: true });

    if (archiveKind === 'zip') {
        await extractZipArchive(archivePath, destinationPath);
        return;
    }

    if (archiveKind === 'tar.gz') {
        await extractTarArchive(archivePath, destinationPath);
        return;
    }

    const outputPath = path.join(destinationPath, path.basename(archivePath));
    await copyFile(archivePath, outputPath);

    if (process.platform !== 'win32') {
        await chmod(outputPath, 0o755);
    }
}

async function listFilesRecursively(rootPath: string): Promise<string[]> {
    const results: string[] = [];
    const stack = [rootPath];

    while (stack.length > 0) {
        const currentPath = stack.pop();
        if (!currentPath) {
            continue;
        }

        const entries = await readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                stack.push(entryPath);
                continue;
            }

            results.push(entryPath);
        }
    }

    return results;
}

async function locateShadps4Executable(installDir: string): Promise<string | null> {
    const executablePatterns = getExecutablePatterns();
    const files = await listFilesRecursively(installDir);
    const normalizedFiles = files
        .map((filePath) => ({
            filePath,
            fileName: path.basename(filePath)
        }))
        .sort((left, right) => left.filePath.length - right.filePath.length);

    for (const pattern of executablePatterns) {
        const matchedFile = normalizedFiles.find(({ fileName }) => pattern.test(fileName));
        if (matchedFile) {
            if (process.platform !== 'win32') {
                await chmod(matchedFile.filePath, 0o755).catch(() => undefined);
            }

            return matchedFile.filePath;
        }
    }

    return null;
}

async function resolveCachedBuild(
    currentConfig: LauncherConfig,
    channel: EmulatorChannel
): Promise<EnsuredShadps4Build | null> {
    const configuredExecutablePath = currentConfig.emulator.shadps4.executablePath;
    const configuredVersion = currentConfig.emulator.shadps4.version;

    if (
        currentConfig.emulator.shadps4.channel === channel &&
        configuredVersion &&
        (await pathExists(configuredExecutablePath))
    ) {
        setSplashStatusKey('splash.usingCachedShadps4');
        return {
            version: configuredVersion,
            executablePath: configuredExecutablePath as string
        };
    }

    const cache = await readShadps4Cache();
    const cachedBuilds = cache.downloads
        .filter((download) => download.channel === channel)
        .sort((left, right) => right.downloadedAt.localeCompare(left.downloadedAt));

    for (const cachedBuild of cachedBuilds) {
        if (await pathExists(cachedBuild.executablePath)) {
            setSplashStatusKey('splash.usingCachedShadps4');
            return {
                version: cachedBuild.releaseTag,
                executablePath: cachedBuild.executablePath
            };
        }
    }

    return null;
}

async function ensureReleaseInstalled(
    channel: EmulatorChannel,
    release: GitHubRelease
): Promise<EnsuredShadps4Build> {
    setSplashStatusKey('splash.preparingShadps4');

    const { asset, archiveKind } = resolveReleaseAsset(release);
    const cache = await readShadps4Cache();
    const cachedBuild = cache.downloads.find(
        (download) =>
            download.channel === channel &&
            download.releaseTag === release.tag_name &&
            download.assetName === asset.name
    );

    if (
        cachedBuild &&
        isBuildStoredInExpectedInstallDir(cachedBuild.executablePath, channel) &&
        (await pathExists(cachedBuild.executablePath))
    ) {
        setSplashStatusKey('splash.usingCachedShadps4');
        return {
            version: cachedBuild.releaseTag,
            executablePath: cachedBuild.executablePath
        };
    }

    const installDir = resolveBuildInstallDir(channel);
    const tmpDir = path.join(resolveLauncherEmuPath(), '.tmp');
    const archivePath = path.join(
        tmpDir,
        `${sanitizePathSegment(release.tag_name)}-${sanitizePathSegment(asset.name)}`
    );

    await rm(installDir, { recursive: true, force: true });
    await downloadAssetToFile(asset.browser_download_url, archivePath);

    try {
        await unpackDownloadedAsset(archivePath, archiveKind, installDir);
        const executablePath = await locateShadps4Executable(installDir);

        if (!executablePath) {
            throw new Error(`A shadPS4 executable could not be located in ${installDir}.`);
        }

        const nextCache: Shadps4VersionsCache = {
            schemaVersion: SHADPS4_CACHE_SCHEMA_VERSION,
            downloads: [
                ...cache.downloads.filter(
                    (download) =>
                        !(
                            download.channel === channel &&
                            download.releaseTag === release.tag_name &&
                            download.assetName === asset.name
                        )
                ),
                {
                    channel,
                    releaseTag: release.tag_name,
                    releaseName: release.name,
                    publishedAt: release.published_at,
                    assetName: asset.name,
                    assetUrl: asset.browser_download_url,
                    installDir,
                    executablePath,
                    downloadedAt: new Date().toISOString()
                }
            ]
        };

        await writeShadps4Cache(nextCache);

        return {
            version: release.tag_name,
            executablePath
        };
    } finally {
        await rm(archivePath, { force: true }).catch(() => undefined);
    }
}

async function saveSelectedBuild(channel: EmulatorChannel, build: EnsuredShadps4Build): Promise<LauncherConfig> {
    setSplashStatusKey('splash.finalizingShadps4');

    const currentConfig = await readLauncherConfig();
    const nextConfig: LauncherConfig = {
        ...currentConfig,
        emulator: {
            ...currentConfig.emulator,
            shadps4: {
                channel,
                version: build.version,
                executablePath: build.executablePath
            }
        }
    };

    return writeLauncherConfig(nextConfig);
}

export async function readShadps4UpdateChangelog(): Promise<Shadps4UpdateChangelog> {
    const currentConfig = await readLauncherConfig();
    const channel = currentConfig.emulator.shadps4.channel || SHADPS4_DEFAULT_CHANNEL;
    const latestRelease = await fetchLatestRelease(channel);
    const currentVersion = currentConfig.emulator.shadps4.version;
    const currentCommit = resolveShadps4CommitRef(currentVersion);
    const targetCommit = resolveShadps4CommitRef(latestRelease.tag_name);

    if (!currentVersion || currentVersion === latestRelease.tag_name) {
        return {
            channel,
            currentVersion,
            targetVersion: latestRelease.tag_name,
            currentCommit,
            targetCommit,
            compareUrl: null,
            isUpToDate: currentVersion === latestRelease.tag_name,
            commits: []
        };
    }

    for (const { baseRef, headRef } of resolveCompareRefCandidates(currentVersion, latestRelease.tag_name)) {
        try {
            const comparison = await fetchReleaseCompare(baseRef, headRef);
            const commits = Array.isArray(comparison.commits)
                ? [...comparison.commits].reverse().map(mapCompareCommitToChangelogEntry)
                : [];

            return {
                channel,
                currentVersion,
                targetVersion: latestRelease.tag_name,
                currentCommit,
                targetCommit,
                compareUrl: typeof comparison.html_url === 'string' ? comparison.html_url : null,
                isUpToDate: false,
                commits
            };
        } catch (error) {
            console.warn(`shadPS4 changelog compare failed for ${baseRef}...${headRef}.`, error);
        }
    }

    return {
        channel,
        currentVersion,
        targetVersion: latestRelease.tag_name,
        currentCommit,
        targetCommit,
        compareUrl: null,
        isUpToDate: false,
        commits: []
    };
}

export async function ensureLatestShadps4Configured(): Promise<LauncherConfig> {
    if (setupPromise) {
        return setupPromise;
    }

    setupPromise = (async () => {
        const currentConfig = await readLauncherConfig();
        const channel = currentConfig.emulator.shadps4.channel || SHADPS4_DEFAULT_CHANNEL;

        try {
            const release = await fetchLatestRelease(channel);

            if (
                currentConfig.emulator.shadps4.channel === channel &&
                currentConfig.emulator.shadps4.version === release.tag_name &&
                isBuildStoredInExpectedInstallDir(currentConfig.emulator.shadps4.executablePath, channel) &&
                (await pathExists(currentConfig.emulator.shadps4.executablePath))
            ) {
                setSplashStatusKey('splash.usingCachedShadps4');
                return currentConfig;
            }

            const build = await ensureReleaseInstalled(channel, release);
            return saveSelectedBuild(channel, build);
        } catch (error) {
            const fallbackBuild = await resolveCachedBuild(currentConfig, channel);
            if (fallbackBuild) {
                return saveSelectedBuild(channel, fallbackBuild);
            }

            throw error;
        }
    })().finally(() => {
        setupPromise = null;
    });

    return setupPromise;
}
