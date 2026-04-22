import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import type { BuildResult } from 'electron-builder';

import appMeta from './app.meta';

const launcherProjectPath = path.resolve(process.cwd(), 'native', 'windows', 'LanternLauncherHost.csproj');
const launcherBuildRoot = path.resolve(process.cwd(), '.build', 'dotnet', 'windows-launcher');
const launcherPublishDir = path.join(launcherBuildRoot, 'publish');
const launcherExecutableName = 'app.exe';
const nestedAppDirectoryName = 'app';
const launcherIconFileName = 'app.ico';
const packageLifecycleScript = process.env.npm_lifecycle_event ?? '';

let launcherBuildPromise: Promise<string> | null = null;

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

interface LauncherMetadata {
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

function resolveWindowsTargetArch(): string {
    const explicitArch = process.env.BUILD_TARGET_ARCH;

    if (explicitArch === 'x64' || explicitArch === 'arm64') {
        return explicitArch;
    }

    if (process.argv.includes('--arm64')) {
        return 'arm64';
    }

    return 'x64';
}

function resolveLauncherMetadata(): LauncherMetadata {
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

async function findPrimaryPackagedExecutable(appOutDir: string): Promise<string | null> {
    const { productName } = resolveLauncherMetadata();
    const preferredExecutablePath = path.join(appOutDir, `${productName}.exe`);

    if (existsSync(preferredExecutablePath)) {
        return preferredExecutablePath;
    }

    const ignoredExecutableNames = new Set([
        launcherExecutableName.toLowerCase(),
        'chrome_proxy.exe',
        'crashpad_handler.exe',
        'elevate.exe',
        'notification_helper.exe',
        'update.exe'
    ]);

    const entries = await readdir(appOutDir, { withFileTypes: true });
    const candidates = entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.exe'))
        .map((entry) => entry.name)
        .filter((fileName) => !ignoredExecutableNames.has(fileName.toLowerCase()))
        .sort((left, right) => left.localeCompare(right));

    return candidates[0] ? path.join(appOutDir, candidates[0]) : null;
}

function shouldCreateLayeredWindowsZip(): boolean {
    return packageLifecycleScript.includes(':ci');
}

function runDotnetPublish(): string {
    const { productName, description, company, version, copyright } = resolveLauncherMetadata();
    const args = [
        'publish',
        launcherProjectPath,
        '-c',
        'Release',
        '-r',
        'win-x64',
        '--self-contained',
        'true',
        '-o',
        launcherPublishDir,
        `-p:BaseIntermediateOutputPath=${path.join(launcherBuildRoot, 'obj')}${path.sep}`,
        `-p:BaseOutputPath=${path.join(launcherBuildRoot, 'bin')}${path.sep}`,
        `-p:LauncherProductName=${productName}`,
        `-p:LauncherDescription=${description}`,
        `-p:LauncherCompany=${company}`,
        `-p:LauncherCopyright=${copyright}`,
        `-p:LauncherVersion=${version}`
    ];

    const result = spawnSync('dotnet', args, {
        cwd: process.cwd(),
        encoding: 'utf8'
    });

    if (result.status !== 0) {
        const details =
            result.error?.message?.trim() ||
            result.stderr?.trim() ||
            result.stdout?.trim() ||
            'dotnet publish failed.';
        throw new Error(`Failed to build the Windows launcher stub. ${details}`);
    }

    return path.join(launcherPublishDir, launcherExecutableName);
}

async function buildLauncherStub(): Promise<string> {
    launcherBuildPromise ??= (async () => {
        await rm(launcherPublishDir, { recursive: true, force: true });
        const executablePath = runDotnetPublish();

        if (!existsSync(executablePath)) {
            throw new Error(`The Windows launcher stub was not generated at ${executablePath}.`);
        }

        return executablePath;
    })();

    return launcherBuildPromise;
}

export async function prepareWindowsLayeredArtifacts(context: BeforePackHookContext): Promise<void> {
    if (context.electronPlatformName !== 'win32') {
        return;
    }

    await buildLauncherStub();
}

async function movePackagedAppIntoNestedDirectory(appOutDir: string): Promise<void> {
    const nestedAppDir = path.join(appOutDir, nestedAppDirectoryName);
    await rm(nestedAppDir, { recursive: true, force: true });
    await mkdir(nestedAppDir, { recursive: true });

    const entries = await readdir(appOutDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name === nestedAppDirectoryName) {
            continue;
        }

        await rename(
            path.join(appOutDir, entry.name),
            path.join(nestedAppDir, entry.name)
        );
    }
}

async function wrapWindowsLayeredDirectory(appOutDir: string): Promise<void> {
    const executableName = launcherExecutableName;
    const iconFileName = launcherIconFileName;
    const nestedAppDir = path.join(appOutDir, nestedAppDirectoryName);

    if (existsSync(path.join(appOutDir, executableName)) && existsSync(nestedAppDir)) {
        return;
    }

    if (!(await findPrimaryPackagedExecutable(appOutDir))) {
        throw new Error(`Could not resolve the packaged Electron executable in ${appOutDir}.`);
    }

    const launcherPath = await buildLauncherStub();

    await movePackagedAppIntoNestedDirectory(appOutDir);
    await copyFile(launcherPath, path.join(appOutDir, executableName));

    const iconSourcePath = path.resolve(process.cwd(), 'build', 'icon.ico');
    if (existsSync(iconSourcePath)) {
        await copyFile(iconSourcePath, path.join(appOutDir, iconFileName));
    }
}

async function createLayeredWindowsZip(unpackedDirectory: string): Promise<string> {
    const packageMetadata = readPackageMetadata();
    const productName = packageMetadata.productName?.trim() || appMeta.productName;
    const version = packageMetadata.version?.trim() || '0.0.1';
    const targetArch = resolveWindowsTargetArch();
    const zipFileName = `${productName}-${version}-win-${targetArch}.zip`;
    const zipFilePath = path.join(path.dirname(unpackedDirectory), zipFileName);
    const zipScript = [
        'param([string]$SourceDirectory, [string]$DestinationZip)',
        'Add-Type -AssemblyName System.IO.Compression.FileSystem',
        'if (Test-Path -LiteralPath $DestinationZip) {',
        '    Remove-Item -LiteralPath $DestinationZip -Force',
        '}',
        '[System.IO.Compression.ZipFile]::CreateFromDirectory(',
        '    $SourceDirectory,',
        '    $DestinationZip,',
        '    [System.IO.Compression.CompressionLevel]::Optimal,',
        '    $false',
        ')'
    ].join('\n');
    const zipResult = spawnSync(
        'powershell',
        [
            '-NoLogo',
            '-NoProfile',
            '-Command',
            zipScript,
            unpackedDirectory,
            zipFilePath
        ],
        {
            cwd: process.cwd(),
            encoding: 'utf8'
        }
    );

    if (zipResult.status !== 0) {
        const details =
            zipResult.error?.message?.trim() ||
            zipResult.stderr?.trim() ||
            zipResult.stdout?.trim() ||
            'PowerShell zip creation failed.';
        throw new Error(`Failed to create the layered Windows zip archive. ${details}`);
    }

    return zipFilePath;
}

export async function wrapWindowsLayeredBuild(buildResult: BuildResult): Promise<string[]> {
    const entries = await readdir(buildResult.outDir, { withFileTypes: true });
    const unpackedDirectories = entries
        .filter((entry) => entry.isDirectory() && entry.name.endsWith('-unpacked'))
        .map((entry) => path.join(buildResult.outDir, entry.name));
    const additionalArtifacts: string[] = [];

    for (const unpackedDirectory of unpackedDirectories) {
        await wrapWindowsLayeredDirectory(unpackedDirectory);

        if (shouldCreateLayeredWindowsZip()) {
            additionalArtifacts.push(await createLayeredWindowsZip(unpackedDirectory));
        }
    }

    return additionalArtifacts;
}
