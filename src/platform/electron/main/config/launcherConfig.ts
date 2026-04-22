import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';

import {
    BLOODBORNE_TITLE_IDS,
    type BloodborneInstallStatus,
    type BloodborneTitleId,
    type EmulatorChannel,
    type LauncherBootstrapState,
    type LauncherConfig,
    type Shadps4InstallStatus
} from '$lib/contracts/launcherConfig';
import translations from '$lib/translations/translations';
import appDefinition from '$platform/app';

import { readBloodborneParamSfoMetadata, type ParamSfoMetadata } from './paramSfo';

const CONFIG_SCHEMA_VERSION = 1 as const;
const LAUNCHER_DIRECTORY_NAME = 'LanternLauncher';
const LAUNCHER_EMU_DIRECTORY_NAME = 'emu';
const LAUNCHER_VERSIONS_DIRECTORY_NAME = 'versions';
const LAUNCHER_CONFIG_FILE_NAME = 'config.json';
const DEFAULT_SHADPS4_CHANNEL: EmulatorChannel = 'nightly';

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isBloodborneTitleId(value: string | null): value is BloodborneTitleId {
    return !!value && (BLOODBORNE_TITLE_IDS as readonly string[]).includes(value);
}

function resolveSupportedLocale(locale: string): string {
    const supportedLocales = Object.keys(translations);
    return supportedLocales.includes(locale) ? locale : appDefinition.defaults.lang;
}

function normalizeOptionalString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
}

function isEmulatorChannel(value: string | null): value is EmulatorChannel {
    return value === 'stable' || value === 'nightly';
}

function createEmptyBloodborneMetadata() {
    return {
        title: null,
        contentId: null,
        appVer: null
    };
}

function createDefaultEmulatorConfig(): LauncherConfig['emulator'] {
    return {
        shadps4: {
            channel: DEFAULT_SHADPS4_CHANNEL,
            version: null,
            executablePath: null
        }
    };
}

function areBloodborneConfigValuesEqual(
    left: LauncherConfig['games']['bloodborne'],
    right: LauncherConfig['games']['bloodborne']
): boolean {
    return (
        left.installPath === right.installPath &&
        left.titleId === right.titleId &&
        left.title === right.title &&
        left.contentId === right.contentId &&
        left.appVer === right.appVer
    );
}

function resolveBloodborneTitleId(
    validationTitleId: BloodborneTitleId | null,
    metadataTitleId: string | null
): BloodborneTitleId | null {
    if (!validationTitleId) {
        return null;
    }

    return isBloodborneTitleId(metadataTitleId) ? metadataTitleId : validationTitleId;
}

async function resolveBloodborneConfig(
    validation: BloodborneInstallStatus
): Promise<LauncherConfig['games']['bloodborne']> {
    if (!validation.isValid || !validation.installPath || !validation.titleId) {
        return {
            installPath: validation.installPath,
            titleId: validation.titleId,
            ...createEmptyBloodborneMetadata()
        };
    }

    let metadata: ParamSfoMetadata | null = null;
    try {
        metadata = await readBloodborneParamSfoMetadata(validation.installPath);
    } catch {
        metadata = null;
    }

    return {
        installPath: validation.installPath,
        titleId: resolveBloodborneTitleId(validation.titleId, metadata?.titleId ?? null),
        title: metadata?.title ?? null,
        contentId: metadata?.contentId ?? null,
        appVer: metadata?.appVer ?? null
    };
}

export function createDefaultLauncherConfig(): LauncherConfig {
    return {
        schemaVersion: CONFIG_SCHEMA_VERSION,
        locale: resolveSupportedLocale(appDefinition.defaults.lang),
        emulator: createDefaultEmulatorConfig(),
        games: {
            bloodborne: {
                installPath: null,
                titleId: null,
                ...createEmptyBloodborneMetadata()
            }
        }
    };
}

export function resolveLauncherRootPath(): string {
    return path.join(app.getPath('appData'), LAUNCHER_DIRECTORY_NAME);
}

export function resolveLauncherEmuPath(): string {
    return path.join(resolveLauncherRootPath(), LAUNCHER_EMU_DIRECTORY_NAME);
}

export function resolveLauncherVersionsPath(): string {
    return path.join(resolveLauncherEmuPath(), LAUNCHER_VERSIONS_DIRECTORY_NAME);
}

export function resolveLegacyLauncherConfigPath(): string {
    return path.join(resolveLauncherRootPath(), LAUNCHER_CONFIG_FILE_NAME);
}

export function resolveLauncherConfigPath(): string {
    return path.join(resolveLauncherEmuPath(), LAUNCHER_CONFIG_FILE_NAME);
}

function normalizeLauncherConfig(rawConfig: unknown): LauncherConfig {
    const defaultConfig = createDefaultLauncherConfig();
    if (!isRecord(rawConfig)) {
        return defaultConfig;
    }

    const rawGames = isRecord(rawConfig.games) ? rawConfig.games : null;
    const rawBloodborne = rawGames && isRecord(rawGames.bloodborne) ? rawGames.bloodborne : null;
    const rawEmulator = isRecord(rawConfig.emulator) ? rawConfig.emulator : null;
    const rawShadps4 = rawEmulator && isRecord(rawEmulator.shadps4) ? rawEmulator.shadps4 : null;

    const installPath =
        typeof rawBloodborne?.installPath === 'string' && rawBloodborne.installPath.trim().length > 0
            ? path.resolve(rawBloodborne.installPath)
            : null;

    const rawTitleId = typeof rawBloodborne?.titleId === 'string' ? rawBloodborne.titleId.toUpperCase() : null;
    const titleId = isBloodborneTitleId(rawTitleId) ? rawTitleId : null;
    const title = normalizeOptionalString(rawBloodborne?.title);
    const contentId = normalizeOptionalString(rawBloodborne?.contentId);
    const appVer = normalizeOptionalString(rawBloodborne?.appVer);
    const rawShadps4Channel = typeof rawShadps4?.channel === 'string' ? rawShadps4.channel : null;
    const shadps4Channel = isEmulatorChannel(rawShadps4Channel) ? rawShadps4Channel : DEFAULT_SHADPS4_CHANNEL;
    const shadps4Version = normalizeOptionalString(rawShadps4?.version);
    const shadps4ExecutablePath =
        typeof rawShadps4?.executablePath === 'string' && rawShadps4.executablePath.trim().length > 0
            ? path.resolve(rawShadps4.executablePath)
            : null;

    return {
        schemaVersion: CONFIG_SCHEMA_VERSION,
        locale: resolveSupportedLocale(typeof rawConfig.locale === 'string' ? rawConfig.locale : defaultConfig.locale),
        emulator: {
            shadps4: {
                channel: shadps4Channel,
                version: shadps4Version,
                executablePath: shadps4ExecutablePath
            }
        },
        games: {
            bloodborne: {
                installPath,
                titleId,
                title,
                contentId,
                appVer
            }
        }
    };
}

export async function readLauncherConfig(): Promise<LauncherConfig> {
    const configPath = resolveLauncherConfigPath();

    try {
        const rawConfig = await readFile(configPath, 'utf8');
        return normalizeLauncherConfig(JSON.parse(rawConfig));
    } catch (error) {
        if (error instanceof SyntaxError) {
            return createDefaultLauncherConfig();
        }

        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }

    try {
        const legacyConfig = await readFile(resolveLegacyLauncherConfigPath(), 'utf8');
        const normalizedConfig = normalizeLauncherConfig(JSON.parse(legacyConfig));
        await writeLauncherConfig(normalizedConfig);
        return normalizedConfig;
    } catch (error) {
        if (error instanceof SyntaxError) {
            return createDefaultLauncherConfig();
        }

        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return createDefaultLauncherConfig();
        }

        throw error;
    }
}

export async function writeLauncherConfig(config: LauncherConfig): Promise<LauncherConfig> {
    const normalizedConfig = normalizeLauncherConfig(config);
    const configPath = resolveLauncherConfigPath();

    await mkdir(path.dirname(configPath), { recursive: true });
    await writeFile(configPath, `${JSON.stringify(normalizedConfig, null, 4)}\n`, 'utf8');

    return normalizedConfig;
}

export async function validateBloodborneInstallPath(installPath: string | null): Promise<BloodborneInstallStatus> {
    if (!installPath) {
        return {
            installPath: null,
            titleId: null,
            isConfigured: false,
            isValid: false,
            error: 'missing'
        };
    }

    const resolvedInstallPath = path.resolve(installPath);

    let installDirectoryStats;
    try {
        installDirectoryStats = await stat(resolvedInstallPath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return {
                installPath: resolvedInstallPath,
                titleId: null,
                isConfigured: true,
                isValid: false,
                error: 'not-found'
            };
        }

        throw error;
    }

    if (!installDirectoryStats.isDirectory()) {
        return {
            installPath: resolvedInstallPath,
            titleId: null,
            isConfigured: true,
            isValid: false,
            error: 'not-directory'
        };
    }

    const titleIdCandidate = path.basename(resolvedInstallPath).toUpperCase();
    if (!isBloodborneTitleId(titleIdCandidate)) {
        return {
            installPath: resolvedInstallPath,
            titleId: null,
            isConfigured: true,
            isValid: false,
            error: 'invalid-title-id'
        };
    }

    try {
        const ebootStats = await stat(path.join(resolvedInstallPath, 'eboot.bin'));
        if (!ebootStats.isFile()) {
            throw new Error('EBOOT_NOT_A_FILE');
        }
    } catch {
        return {
            installPath: resolvedInstallPath,
            titleId: titleIdCandidate,
            isConfigured: true,
            isValid: false,
            error: 'missing-eboot'
        };
    }

    return {
        installPath: resolvedInstallPath,
        titleId: titleIdCandidate,
        isConfigured: true,
        isValid: true,
        error: null
    };
}

export async function validateShadps4Install(
    shadps4Config: LauncherConfig['emulator']['shadps4']
): Promise<Shadps4InstallStatus> {
    const executablePath = shadps4Config.executablePath ? path.resolve(shadps4Config.executablePath) : null;

    if (!executablePath) {
        return {
            executablePath: null,
            version: shadps4Config.version,
            channel: shadps4Config.channel,
            isConfigured: false,
            isAvailable: false,
            error: 'missing'
        };
    }

    let executableStats;
    try {
        executableStats = await stat(executablePath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return {
                executablePath,
                version: shadps4Config.version,
                channel: shadps4Config.channel,
                isConfigured: true,
                isAvailable: false,
                error: 'not-found'
            };
        }

        throw error;
    }

    if (!executableStats.isFile()) {
        return {
            executablePath,
            version: shadps4Config.version,
            channel: shadps4Config.channel,
            isConfigured: true,
            isAvailable: false,
            error: 'not-file'
        };
    }

    return {
        executablePath,
        version: shadps4Config.version,
        channel: shadps4Config.channel,
        isConfigured: true,
        isAvailable: true,
        error: null
    };
}

export async function createLauncherBootstrapState(config?: LauncherConfig): Promise<LauncherBootstrapState> {
    const resolvedConfig = config ? normalizeLauncherConfig(config) : await readLauncherConfig();
    const bloodborne = await validateBloodborneInstallPath(resolvedConfig.games.bloodborne.installPath);
    const shadps4 = await validateShadps4Install(resolvedConfig.emulator.shadps4);
    const resolvedBloodborneConfig = await resolveBloodborneConfig(bloodborne);
    const nextConfig: LauncherConfig = {
        ...resolvedConfig,
        games: {
            ...resolvedConfig.games,
            bloodborne: resolvedBloodborneConfig
        }
    };

    if (bloodborne.isValid && !areBloodborneConfigValuesEqual(resolvedConfig.games.bloodborne, resolvedBloodborneConfig)) {
        await writeLauncherConfig(nextConfig);
    }

    return {
        config: nextConfig,
        bloodborne,
        emulator: {
            shadps4
        }
    };
}

export async function getLauncherBootstrapState(): Promise<LauncherBootstrapState> {
    return createLauncherBootstrapState();
}

export async function saveLauncherLocale(nextLocale: string): Promise<LauncherBootstrapState> {
    const currentConfig = await readLauncherConfig();
    const nextConfig: LauncherConfig = {
        ...currentConfig,
        locale: resolveSupportedLocale(nextLocale)
    };

    const writtenConfig = await writeLauncherConfig(nextConfig);
    return createLauncherBootstrapState(writtenConfig);
}

export async function saveBloodborneInstallPath(installPath: string): Promise<LauncherBootstrapState> {
    const validation = await validateBloodborneInstallPath(installPath);
    if (!validation.isValid || !validation.installPath || !validation.titleId) {
        throw new Error('Bloodborne install path cannot be saved because it is invalid.');
    }

    const currentConfig = await readLauncherConfig();
    const nextConfig: LauncherConfig = {
        ...currentConfig,
        games: {
            ...currentConfig.games,
            bloodborne: {
                installPath: validation.installPath,
                titleId: validation.titleId,
                ...createEmptyBloodborneMetadata()
            }
        }
    };

    const writtenConfig = await writeLauncherConfig(nextConfig);
    return createLauncherBootstrapState(writtenConfig);
}
