import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { chmod, copyFile, mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import type { BuildResult } from 'electron-builder';

import appMeta from './app.meta';

type SupportedPlatform = 'win32' | 'linux' | 'darwin';
type SupportedArch = 'x64' | 'arm64';

const nativeHostProjectPath = path.resolve(process.cwd(), 'native', 'host', 'LanternLauncherHost.csproj');
const nativeHostBuildRoot = path.resolve(process.cwd(), '.build', 'dotnet', 'native-host');
const windowsLauncherIconFileName = 'app.ico';
const packageLifecycleScript = process.env.npm_lifecycle_event ?? '';

const sevenZipPlatformDirectory = {
    win32: 'win',
    linux: 'linux',
    darwin: 'mac'
} as const;

let nativeHostBuildPromises = new Map<string, Promise<string>>();

interface PackageAuthorObject {
    name?: string;
}

interface PackageMetadata {
    name?: string;
    productName?: string;
    description?: string;
    author?: string | PackageAuthorObject;
    copyright?: string;
    version?: string;
}

interface NativeHostMetadata {
    productName: string;
    description: string;
    company: string;
    version: string;
    copyright: string;
}

interface BeforePackHookContext {
    electronPlatformName: string;
}

function readPackageMetadata(): PackageMetadata {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = readFileSync(packageJsonPath, 'utf8');
    return JSON.parse(packageJson) as PackageMetadata;
}

function resolvePackageAuthor(author: PackageMetadata['author']): string {
    if (typeof author === 'string') {
        return author;
    }

    return author?.name?.trim() || 'Unknown author';
}

function sanitizeCopyright(text: string): string {
    return text
        .replace(/\u00c2\u00a9/g, '(c)')
        .replace(/\u00a9/g, '(c)');
}

function resolveTargetPlatform(): SupportedPlatform {
    const explicitPlatform = process.env.BUILD_TARGET_PLATFORM;

    if (explicitPlatform === 'win32' || explicitPlatform === 'linux' || explicitPlatform === 'darwin') {
        return explicitPlatform;
    }

    if (process.argv.includes('--win')) {
        return 'win32';
    }

    if (process.argv.includes('--linux')) {
        return 'linux';
    }

    if (process.argv.includes('--mac')) {
        return 'darwin';
    }

    if (process.platform === 'win32' || process.platform === 'linux' || process.platform === 'darwin') {
        return process.platform;
    }

    throw new Error(`Unsupported build platform: ${process.platform}`);
}

function resolveTargetArch(platform: SupportedPlatform): SupportedArch {
    const explicitArch = process.env.BUILD_TARGET_ARCH;

    if (explicitArch === 'x64' || explicitArch === 'arm64') {
        return explicitArch;
    }

    if (process.argv.includes('--arm64')) {
        return 'arm64';
    }

    if (process.argv.includes('--x64')) {
        return 'x64';
    }

    if (platform === 'win32') {
        return 'x64';
    }

    if (platform === 'linux') {
        return process.arch === 'arm64' ? 'arm64' : 'x64';
    }

    return process.arch === 'x64' ? 'x64' : 'arm64';
}

function resolveDotnetRuntime(platform: SupportedPlatform, arch: SupportedArch): string {
    if (platform === 'win32') {
        return `win-${arch}`;
    }

    if (platform === 'linux') {
        return `linux-${arch}`;
    }

    return `osx-${arch}`;
}

function resolveNativeHostExecutableName(platform: SupportedPlatform): string {
    return platform === 'win32' ? 'app.exe' : 'app';
}

function resolveNestedAppDirectoryName(platform: SupportedPlatform): string {
    return 'app0';
}

function resolveNativeHostPublishDir(runtime: string): string {
    return path.join(nativeHostBuildRoot, runtime, 'publish');
}

function resolveNativeHostObjDir(runtime: string): string {
    return path.join(nativeHostBuildRoot, runtime, 'obj');
}

function resolveNativeHostBinDir(runtime: string): string {
    return path.join(nativeHostBuildRoot, runtime, 'bin');
}

function withTrailingSeparator(directoryPath: string): string {
    return directoryPath.endsWith(path.sep) ? directoryPath : `${directoryPath}${path.sep}`;
}

function resolveNativeHostMetadata(): NativeHostMetadata {
    const packageMetadata = readPackageMetadata();
    const productName = packageMetadata.productName?.trim() || appMeta.productName;
    const description = packageMetadata.description?.trim() || appMeta.title;
    const company = resolvePackageAuthor(packageMetadata.author);
    const version = packageMetadata.version?.trim() || '0.0.1';
    const copyright = sanitizeCopyright(
        packageMetadata.copyright?.trim() || `Copyright (c) ${new Date().getFullYear()} ${company}`
    );

    return {
        productName,
        description,
        company,
        version,
        copyright
    };
}

function shouldBuildNativeHost(_platform: SupportedPlatform): boolean {
    return true;
}

function shouldCreateLayeredZip(): boolean {
    return packageLifecycleScript.includes(':ci');
}

function resolveBuildPlatformFromHook(platformName: string): SupportedPlatform | null {
    if (platformName === 'win32' || platformName === 'linux' || platformName === 'darwin') {
        return platformName;
    }

    return null;
}

function resolveSevenZipPath(platform: SupportedPlatform, arch: SupportedArch): string {
    const platformDirectory = sevenZipPlatformDirectory[platform];
    const executableName = platform === 'win32' ? '7za.exe' : '7za';
    const sevenZipPath = path.resolve(
        process.cwd(),
        'node_modules',
        '7zip-bin',
        platformDirectory,
        arch,
        executableName
    );

    if (!existsSync(sevenZipPath)) {
        throw new Error(`7zip executable was not found at ${sevenZipPath}.`);
    }

    return sevenZipPath;
}

function runDotnetPublish(platform: SupportedPlatform): string {
    const arch = resolveTargetArch(platform);
    const runtime = resolveDotnetRuntime(platform, arch);
    const publishDir = resolveNativeHostPublishDir(runtime);
    const objDir = withTrailingSeparator(resolveNativeHostObjDir(runtime));
    const binDir = withTrailingSeparator(resolveNativeHostBinDir(runtime));
    const { productName, description, company, version, copyright } = resolveNativeHostMetadata();
    const args = [
        'publish',
        nativeHostProjectPath,
        '-c',
        'Release',
        '-r',
        runtime,
        '--self-contained',
        'true',
        '-o',
        publishDir,
        `-p:BaseIntermediateOutputPath=${objDir}`,
        `-p:IntermediateOutputPath=${objDir}`,
        `-p:MSBuildProjectExtensionsPath=${objDir}`,
        `-p:RestoreBaseIntermediateOutputPath=${objDir}`,
        `-p:BaseOutputPath=${binDir}`,
        `-p:LauncherProductName=${productName}`,
        `-p:LauncherDescription=${description}`,
        `-p:LauncherCompany=${company}`,
        `-p:LauncherCopyright=${copyright}`,
        `-p:LauncherVersion=${version}`
    ];

    const result = spawnSync('dotnet', args, {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
            ...process.env,
            AVALONIA_TELEMETRY_OPTOUT: '1'
        }
    });

    if (result.status !== 0) {
        const details =
            result.error?.message?.trim() ||
            result.stderr?.trim() ||
            result.stdout?.trim() ||
            'dotnet publish failed.';
        throw new Error(`Failed to build the native launcher host for ${runtime}. ${details}`);
    }

    return path.join(publishDir, resolveNativeHostExecutableName(platform));
}

async function buildNativeHost(platform: SupportedPlatform): Promise<string> {
    const arch = resolveTargetArch(platform);
    const runtime = resolveDotnetRuntime(platform, arch);
    const publishDir = resolveNativeHostPublishDir(runtime);

    if (!nativeHostBuildPromises.has(runtime)) {
        nativeHostBuildPromises.set(runtime, (async () => {
            await rm(publishDir, { recursive: true, force: true });
            const executablePath = runDotnetPublish(platform);

            if (!existsSync(executablePath)) {
                throw new Error(`The native launcher host was not generated at ${executablePath}.`);
            }

            return executablePath;
        })());
    }

    return nativeHostBuildPromises.get(runtime)!;
}

export async function prepareNativeLayeredArtifacts(context: BeforePackHookContext): Promise<void> {
    const platform = resolveBuildPlatformFromHook(context.electronPlatformName);

    if (!platform || !shouldBuildNativeHost(platform)) {
        return;
    }

    await buildNativeHost(platform);
}

async function findPrimaryPackagedApp(appOutDir: string, platform: SupportedPlatform): Promise<string | null> {
    const { productName } = resolveNativeHostMetadata();

    if (platform === 'darwin') {
        const preferredBundlePath = path.join(appOutDir, `${productName}.app`);

        if (existsSync(preferredBundlePath)) {
            return preferredBundlePath;
        }

        const entries = await readdir(appOutDir, { withFileTypes: true });
        const bundle = entries
            .filter((entry) => entry.isDirectory() && entry.name.endsWith('.app'))
            .map((entry) => entry.name)
            .sort((left, right) => left.localeCompare(right))
            .at(0);

        return bundle ? path.join(appOutDir, bundle) : null;
    }

    const executableName = platform === 'win32' ? `${productName}.exe` : productName;
    const preferredExecutablePath = path.join(appOutDir, executableName);

    if (existsSync(preferredExecutablePath)) {
        return preferredExecutablePath;
    }

    const ignoredExecutableNames = new Set([
        resolveNativeHostExecutableName(platform).toLowerCase(),
        'chrome_proxy',
        'chrome_proxy.exe',
        'crashpad_handler',
        'crashpad_handler.exe',
        'elevate.exe',
        'notification_helper.exe',
        'update.exe'
    ]);

    const entries = await readdir(appOutDir, { withFileTypes: true });
    const candidates = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((fileName) => !ignoredExecutableNames.has(fileName.toLowerCase()))
        .filter((fileName) => platform === 'win32'
            ? fileName.toLowerCase().endsWith('.exe')
            : !fileName.includes('.'))
        .sort((left, right) => left.localeCompare(right));

    return candidates[0] ? path.join(appOutDir, candidates[0]) : null;
}

async function movePackagedAppIntoNestedDirectory(
    appOutDir: string,
    platform: SupportedPlatform
): Promise<void> {
    const nativeHostExecutableName = resolveNativeHostExecutableName(platform);
    const nestedAppDirectoryName = resolveNestedAppDirectoryName(platform);
    const nestedAppDir = path.join(appOutDir, nestedAppDirectoryName);

    await rm(nestedAppDir, { recursive: true, force: true });
    await mkdir(nestedAppDir, { recursive: true });

    const entries = await readdir(appOutDir, { withFileTypes: true });

    for (const entry of entries) {
        if (
            entry.name === nestedAppDirectoryName
            || entry.name === nativeHostExecutableName
            || entry.name === windowsLauncherIconFileName
        ) {
            continue;
        }

        await rename(
            path.join(appOutDir, entry.name),
            path.join(nestedAppDir, entry.name)
        );
    }
}

async function wrapNativeLayeredDirectory(
    appOutDir: string,
    platform: SupportedPlatform
): Promise<void> {
    const nativeHostExecutableName = resolveNativeHostExecutableName(platform);
    const nativeHostOutputPath = path.join(appOutDir, nativeHostExecutableName);
    const nestedAppDirectoryName = resolveNestedAppDirectoryName(platform);
    const nestedAppDir = path.join(appOutDir, nestedAppDirectoryName);

    if (existsSync(nativeHostOutputPath) && existsSync(nestedAppDir)) {
        return;
    }

    if (!(await findPrimaryPackagedApp(appOutDir, platform))) {
        throw new Error(`Could not resolve the packaged Electron app in ${appOutDir}.`);
    }

    const nativeHostPath = await buildNativeHost(platform);

    await movePackagedAppIntoNestedDirectory(appOutDir, platform);
    await copyFile(nativeHostPath, nativeHostOutputPath);

    if (platform !== 'win32') {
        await chmod(nativeHostOutputPath, 0o755);
    }

    if (platform === 'win32') {
        const iconSourcePath = path.resolve(process.cwd(), 'build', 'icon.ico');

        if (existsSync(iconSourcePath)) {
            await copyFile(iconSourcePath, path.join(appOutDir, windowsLauncherIconFileName));
        }
    }
}

function resolveLayeredZipName(platform: SupportedPlatform): string {
    const packageMetadata = readPackageMetadata();
    const productName = packageMetadata.productName?.trim() || appMeta.productName;
    const version = packageMetadata.version?.trim() || '0.0.1';
    const arch = resolveTargetArch(platform);
    const osName = platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : 'linux';

    return `${productName}-${version}-${osName}-${arch}.zip`;
}

async function createLayeredZip(
    unpackedDirectory: string,
    platform: SupportedPlatform
): Promise<string> {
    const arch = resolveTargetArch(platform);
    const sevenZipPath = resolveSevenZipPath(platform, arch);
    const zipFilePath = path.join(path.dirname(unpackedDirectory), resolveLayeredZipName(platform));

    await rm(zipFilePath, { force: true });

    if (platform !== 'win32') {
        await chmod(sevenZipPath, 0o755);
    }

    const zipResult = spawnSync(
        sevenZipPath,
        [
            'a',
            '-tzip',
            '-mx=9',
            zipFilePath,
            '.'
        ],
        {
            cwd: unpackedDirectory,
            encoding: 'utf8'
        }
    );

    if (zipResult.status !== 0) {
        const details =
            zipResult.error?.message?.trim() ||
            zipResult.stderr?.trim() ||
            zipResult.stdout?.trim() ||
            '7zip archive creation failed.';
        throw new Error(`Failed to create the layered ${platform} zip archive. ${details}`);
    }

    return zipFilePath;
}

function isUnpackedDirectoryForPlatform(
    directoryName: string,
    platform: SupportedPlatform
): boolean {
    if (platform === 'win32') {
        return directoryName.endsWith('win-unpacked');
    }

    if (platform === 'linux') {
        return directoryName.endsWith('linux-unpacked');
    }

    return directoryName === 'mac' || directoryName.startsWith('mac-');
}

export async function wrapNativeLayeredBuild(buildResult: BuildResult): Promise<string[]> {
    const platform = resolveTargetPlatform();

    if (!shouldBuildNativeHost(platform)) {
        return [];
    }

    const entries = await readdir(buildResult.outDir, { withFileTypes: true });
    const unpackedDirectories = entries
        .filter((entry) => entry.isDirectory() && isUnpackedDirectoryForPlatform(entry.name, platform))
        .map((entry) => path.join(buildResult.outDir, entry.name));
    const additionalArtifacts: string[] = [];

    for (const unpackedDirectory of unpackedDirectories) {
        await wrapNativeLayeredDirectory(unpackedDirectory, platform);

        if (shouldCreateLayeredZip()) {
            additionalArtifacts.push(await createLayeredZip(unpackedDirectory, platform));
        }
    }

    return additionalArtifacts;
}
