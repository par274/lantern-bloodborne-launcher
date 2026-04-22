import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';

import type {
    BloodbornePatchCatalogItem,
    BloodbornePatchUpdateStatusSnapshot,
    DeleteShadps4ShaderCacheResult,
    Shadps4GeneralSettings
} from '$lib/contracts/commands';
import { BLOODBORNE_TITLE_IDS, type LauncherBootstrapState } from '$lib/contracts/launcherConfig';
import {
    BLOODBORNE_PATCH_FILE_NAME,
    BLOODBORNE_PATCH_SUPPORTED_APP_VERSION,
    BLOODBORNE_PATCHES,
    getBloodbornePatchAuthor,
    getBloodbornePatchByMetadataName,
    isBloodbornePatchAppVersionSupported
} from '$lib/patches/bloodbornePatches';

import { resolveBloodborneCustomConfig } from './presets';
import { setSplashStatusKey } from './splashStatus';

const SHADPS4_PATCHES_URL = `https://raw.githubusercontent.com/shadps4-emu/ps4_cheats/refs/heads/main/PATCHES/${BLOODBORNE_PATCH_FILE_NAME}`;
const SHADPS4_RUNTIME_INIT_TIMEOUT_MS = 20000;
const SHADPS4_RUNTIME_INIT_POLL_MS = 250;
const SHADPS4_KEYS_FILE_NAME = 'keys.json';
const XML_METADATA_TAG_PATTERN = /<Metadata\b[\s\S]*?>/g;
const XML_ATTRIBUTE_PATTERN = /\s([A-Za-z_:][\w:.-]*)="([^"]*)"/g;
const DEFAULT_SHADPS4_GENERAL_SETTINGS: Shadps4GeneralSettings = {
    consoleLanguage: 19,
    discordRpcEnabled: true,
    trophyNotificationDuration: 6.0,
    trophyNotificationSide: 'right',
    trophyPopupDisabled: false,
    volumeSlider: 100,
    releaseTrophyKey: ''
};

let bloodbornePatchUpdateStatus: BloodbornePatchUpdateStatusSnapshot = {
    key: 'patch.update.idle',
    progress: null,
    isUpdating: false,
    error: null
};

function resolveRoamingShadps4UserDataRootPath(): string {
    return path.join(app.getPath('appData'), 'shadps4');
}

function resolvePortableShadps4UserDataRootPath(executablePath: string): string {
    return path.join(path.dirname(executablePath), 'user');
}

function resolveShadps4UserDataRootCandidates(executablePath?: string | null): string[] {
    const candidates = [resolveRoamingShadps4UserDataRootPath()];

    if (executablePath) {
        candidates.push(resolvePortableShadps4UserDataRootPath(executablePath));
    }

    return [...new Set(candidates.map((candidate) => path.resolve(candidate)))];
}

function resolveShadps4ConfigJsonPath(rootPath: string): string {
    return path.join(rootPath, 'config.json');
}

function resolveShadps4ConfigTomlPath(rootPath: string): string {
    return path.join(rootPath, 'config.toml');
}

function resolveShadps4PatchesPath(rootPath: string): string {
    return path.join(rootPath, 'patches', 'shadPS4');
}

function resolveShadps4BloodbornePatchPath(rootPath: string): string {
    return path.join(resolveShadps4PatchesPath(rootPath), BLOODBORNE_PATCH_FILE_NAME);
}

function resolveShadps4PatchIndexPath(rootPath: string): string {
    return path.join(resolveShadps4PatchesPath(rootPath), 'files.json');
}

function resolveShadps4KeysJsonPath(rootPath: string): string {
    return path.join(rootPath, SHADPS4_KEYS_FILE_NAME);
}

function resolveShadps4ShaderCachePath(rootPath: string): string {
    return path.join(rootPath, 'cache');
}

function resolveShadps4CustomConfigPath(rootPath: string, titleId: string): string {
    return path.join(rootPath, 'custom_configs', `${titleId}.json`);
}

function resolveShadps4InstallDir(bootstrapState: LauncherBootstrapState): string | null {
    const installPath = bootstrapState.bloodborne.installPath;
    const titleId = bootstrapState.bloodborne.titleId;

    if (!bootstrapState.bloodborne.isValid || !installPath || !titleId) {
        return null;
    }

    const resolvedInstallPath = path.resolve(installPath);
    return path.basename(resolvedInstallPath).toUpperCase() === titleId
        ? path.dirname(resolvedInstallPath)
        : resolvedInstallPath;
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

function parseContentLength(value: string | null): number | null {
    if (!value) {
        return null;
    }

    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function setBloodbornePatchUpdateStatus(nextStatus: Partial<BloodbornePatchUpdateStatusSnapshot>): void {
    bloodbornePatchUpdateStatus = {
        ...bloodbornePatchUpdateStatus,
        ...nextStatus
    };
}

function resetBloodbornePatchUpdateStatus(): void {
    bloodbornePatchUpdateStatus = {
        key: 'patch.update.idle',
        progress: null,
        isUpdating: false,
        error: null
    };
}

function decodeXmlAttributeValue(value: string): string {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function createFallbackPatchId(metadataName: string): string {
    const normalizedId = metadataName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `xml:${normalizedId || 'patch'}`;
}

function readMetadataAttributes(metadataTag: string): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (const match of metadataTag.matchAll(XML_ATTRIBUTE_PATTERN)) {
        attributes[match[1]] = decodeXmlAttributeValue(match[2]);
    }

    return attributes;
}

function readBloodbornePatchCatalogFromXml(xmlContent: string): BloodbornePatchCatalogItem[] {
    const catalog: BloodbornePatchCatalogItem[] = [];

    for (const match of xmlContent.matchAll(XML_METADATA_TAG_PATTERN)) {
        const attributes = readMetadataAttributes(match[0]);
        const metadataName = attributes['Name']?.trim();

        if (!metadataName) {
            continue;
        }

        const launcherDefinition = getBloodbornePatchByMetadataName(metadataName);

        catalog.push({
            id: launcherDefinition?.id ?? createFallbackPatchId(metadataName),
            metadataName,
            author: getBloodbornePatchAuthor({ metadataName }) ?? attributes['Author']?.trim() ?? null,
            note: attributes['Note']?.trim() || null,
            appVersion: attributes['AppVer']?.trim() || null,
            hasLauncherDefinition: !!launcherDefinition
        });
    }

    return catalog;
}

function createStaticBloodbornePatchCatalog(): BloodbornePatchCatalogItem[] {
    return BLOODBORNE_PATCHES.map((patch) => ({
        id: patch.id,
        metadataName: patch.metadataName,
        author: getBloodbornePatchAuthor(patch),
        note: null,
        appVersion: BLOODBORNE_PATCH_SUPPORTED_APP_VERSION,
        hasLauncherDefinition: true
    }));
}

function disableBloodbornePatchEnablement(xmlContent: string): string {
    return xmlContent.replace(XML_METADATA_TAG_PATTERN, (metadataTag) => {
        if (!/\sName="[^"]*"/.test(metadataTag)) {
            return metadataTag;
        }

        if (/\sisEnabled="[^"]*"/.test(metadataTag)) {
            return metadataTag.replace(/\sisEnabled="[^"]*"/, ' isEnabled="false"');
        }

        const closingToken = metadataTag.endsWith('/>') ? '/>' : '>';
        return `${metadataTag.slice(0, -closingToken.length)} isEnabled="false"${closingToken}`;
    });
}

async function readResponseTextWithProgress(
    response: Response,
    onProgress: (progress: number | null) => void
): Promise<string> {
    const totalBytes = parseContentLength(response.headers.get('content-length'));

    if (!response.body) {
        onProgress(100);
        return response.text();
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let downloadedBytes = 0;
    let lastProgress = -1;

    onProgress(totalBytes ? 0 : null);

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        if (!value) {
            continue;
        }

        chunks.push(value);
        downloadedBytes += value.byteLength;

        if (totalBytes) {
            const nextProgress = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
            if (nextProgress !== lastProgress) {
                lastProgress = nextProgress;
                onProgress(nextProgress);
            }
        }
    }

    onProgress(100);
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');
}

async function writeTextFile(filePath: string, content: string): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
    await writeTextFile(filePath, `${JSON.stringify(value, null, 4)}\n`);
}

async function readJsonFile<T>(filePath: string): Promise<T> {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

async function sleep(durationMs: number): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, durationMs);
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function normalizeNumber(
    value: unknown,
    fallback: number,
    options: { min?: number; max?: number; integer?: boolean } = {}
): number {
    const parsedValue =
        typeof value === 'number'
            ? value
            : typeof value === 'string' && value.trim().length > 0
                ? Number(value)
                : Number.NaN;

    if (!Number.isFinite(parsedValue)) {
        return fallback;
    }

    const roundedValue = options.integer ? Math.round(parsedValue) : parsedValue;
    const minLimitedValue = options.min === undefined ? roundedValue : Math.max(options.min, roundedValue);
    return options.max === undefined ? minLimitedValue : Math.min(options.max, minLimitedValue);
}

function normalizeString(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function readInstallDirs(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((entry) => {
        if (isRecord(entry) && typeof entry['path'] === 'string') {
            return [entry['path']];
        }

        if (typeof entry === 'string') {
            return [entry];
        }

        return [];
    });
}

function createInstallDirs(installDir: string): Array<{ enabled: boolean; path: string }> {
    return [
        {
            enabled: true,
            path: installDir
        }
    ];
}

function createShadps4ConfigJsonSeed(rootPath: string, installDir: string): Record<string, unknown> {
    return {
        Audio: {
            audio_backend: 0,
            openal_main_output_device: 'Default Device',
            openal_mic_device: 'Default Device',
            openal_padSpk_output_device: 'Default Device',
            sdl_main_output_device: 'Default Device',
            sdl_mic_device: 'Default Device',
            sdl_padSpk_output_device: 'Default Device'
        },
        Debug: {
            debug_dump: false,
            log_enabled: true,
            separate_logging_enabled: false,
            shader_collect: false
        },
        GPU: {
            copy_gpu_buffers: false,
            direct_memory_access_enabled: false,
            dump_shaders: false,
            fsr_enabled: false,
            full_screen: false,
            full_screen_mode: 'Windowed',
            hdr_allowed: false,
            internal_screen_height: 720,
            internal_screen_width: 1280,
            null_gpu: false,
            patch_shaders: false,
            present_mode: 'Fifo',
            rcas_attenuation: 250,
            rcas_enabled: true,
            readback_linear_images_enabled: false,
            readbacks_mode: 0,
            vblank_frequency: 60,
            window_height: 720,
            window_width: 1280
        },
        General: {
            addon_install_dir: path.join(rootPath, 'addcont').replaceAll('\\', '/'),
            big_picture_scale: 1000,
            connected_to_network: false,
            console_language: DEFAULT_SHADPS4_GENERAL_SETTINGS.consoleLanguage,
            dev_kit_mode: false,
            discord_rpc_enabled: DEFAULT_SHADPS4_GENERAL_SETTINGS.discordRpcEnabled,
            extra_dmem_in_mbytes: 0,
            font_dir: '',
            home_dir: path.join(rootPath, 'home'),
            identical_log_grouped: true,
            install_dirs: createInstallDirs(installDir),
            log_filter: '',
            log_type: 'sync',
            neo_mode: false,
            psn_signed_in: false,
            shad_net_enabled: false,
            shadnet_server: '',
            show_fps_counter: false,
            show_splash: false,
            sys_modules_dir: '',
            trophy_notification_duration: DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyNotificationDuration,
            trophy_notification_side: DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyNotificationSide,
            trophy_popup_disabled: DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyPopupDisabled,
            volume_slider: DEFAULT_SHADPS4_GENERAL_SETTINGS.volumeSlider
        },
        Input: {
            background_controller_input: false,
            camera_id: -1,
            cursor_hide_timeout: 1,
            cursor_state: 1,
            default_controller_id: '',
            motion_controls_enabled: true,
            special_pad_class: 1,
            usb_device_backend: 0,
            use_special_pad: false,
            use_unified_input_config: true
        },
        Log: {
            append: false,
            enable: true,
            filter: '',
            max_skip_duration: 5000,
            separate: false,
            size_limit: 104857600,
            skip_duplicate: true,
            sync: true,
            type: 'wincolor'
        },
        Vulkan: {
            gpu_id: -1,
            pipeline_cache_archived: false,
            pipeline_cache_enabled: false,
            renderdoc_enabled: false,
            vkcrash_diagnostic_enabled: false,
            vkguest_markers: false,
            vkhost_markers: false,
            vkvalidation_core_enabled: true,
            vkvalidation_enabled: false,
            vkvalidation_gpu_enabled: false,
            vkvalidation_sync_enabled: false
        }
    };
}

async function findShadps4ConfigRootPath(executablePath?: string | null): Promise<string | null> {
    for (const rootPath of resolveShadps4UserDataRootCandidates(executablePath)) {
        if (
            (await pathExists(resolveShadps4ConfigJsonPath(rootPath))) ||
            (await pathExists(resolveShadps4ConfigTomlPath(rootPath)))
        ) {
            return rootPath;
        }
    }

    return null;
}

async function resolveShadps4UserDataRootPath(executablePath?: string | null): Promise<string> {
    const configRootPath = await findShadps4ConfigRootPath(executablePath);
    if (configRootPath) {
        return configRootPath;
    }

    for (const rootPath of resolveShadps4UserDataRootCandidates(executablePath)) {
        if (await pathExists(rootPath)) {
            return rootPath;
        }
    }

    return resolveRoamingShadps4UserDataRootPath();
}

async function initializeShadps4UserData(executablePath: string): Promise<string | null> {
    const existingConfigRootPath = await findShadps4ConfigRootPath(executablePath);
    if (existingConfigRootPath) {
        return existingConfigRootPath;
    }

    setSplashStatusKey('splash.initializingShadps4Runtime');

    const processRef = spawn(executablePath, [], {
        cwd: path.dirname(executablePath),
        detached: false,
        stdio: 'ignore',
        windowsHide: true
    });

    let spawnError: Error | null = null;
    processRef.once('error', (error) => {
        spawnError = error;
    });

    const deadline = Date.now() + SHADPS4_RUNTIME_INIT_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (spawnError) {
            throw spawnError;
        }

        const configRootPath = await findShadps4ConfigRootPath(executablePath);
        if (configRootPath) {
            if (processRef.exitCode === null && !processRef.killed) {
                processRef.kill();
            }

            return configRootPath;
        }

        await sleep(SHADPS4_RUNTIME_INIT_POLL_MS);
    }

    if (processRef.exitCode === null && !processRef.killed) {
        processRef.kill();
    }

    if (spawnError) {
        throw spawnError;
    }

    return findShadps4ConfigRootPath(executablePath);
}

async function syncShadps4ConfigJson(
    rootPath: string,
    bootstrapState: LauncherBootstrapState
): Promise<void> {
    const installDir = resolveShadps4InstallDir(bootstrapState);
    if (!installDir) {
        return;
    }

    const configJsonPath = resolveShadps4ConfigJsonPath(rootPath);
    if (!(await pathExists(configJsonPath))) {
        await writeJsonFile(configJsonPath, createShadps4ConfigJsonSeed(rootPath, installDir));
        return;
    }

    const currentConfig = await readJsonFile<Record<string, unknown>>(configJsonPath);
    const currentGeneral = isRecord(currentConfig['General']) ? currentConfig['General'] : {};
    const currentInstallDirs = readInstallDirs(currentGeneral['install_dirs']);

    if (currentInstallDirs.length === 1 && currentInstallDirs[0] === installDir) {
        return;
    }

    await writeJsonFile(configJsonPath, {
        ...currentConfig,
        General: {
            ...currentGeneral,
            install_dirs: createInstallDirs(installDir)
        }
    });
}

async function ensureBloodborneCustomConfig(
    rootPath: string,
    bootstrapState: LauncherBootstrapState
): Promise<void> {
    const titleId = bootstrapState.bloodborne.titleId;
    if (!bootstrapState.bloodborne.isValid || !titleId) {
        return;
    }

    const customConfigPath = resolveShadps4CustomConfigPath(rootPath, titleId);
    if (await pathExists(customConfigPath)) {
        return;
    }

    await writeJsonFile(
        customConfigPath,
        resolveBloodborneCustomConfig({
            presetId: 'quality'
        })
    );
}

let bloodbornePatchContentPromise: Promise<string> | null = null;

async function readBloodbornePatchContent(): Promise<string> {
    if (!bloodbornePatchContentPromise) {
        bloodbornePatchContentPromise = (async () => {
            setSplashStatusKey('splash.downloadingShadps4Patches');

            const response = await fetch(SHADPS4_PATCHES_URL);
            if (!response.ok) {
                throw new Error(`Bloodborne patch download failed with status ${response.status}.`);
            }

            return response.text();
        })();
    }

    return bloodbornePatchContentPromise;
}

async function downloadBloodbornePatchContentWithUpdateStatus(): Promise<string> {
    setBloodbornePatchUpdateStatus({
        key: 'patch.update.downloading',
        progress: 0,
        isUpdating: true,
        error: null
    });

    const response = await fetch(SHADPS4_PATCHES_URL);
    if (!response.ok) {
        throw new Error(`Bloodborne patch download failed with status ${response.status}.`);
    }

    return readResponseTextWithProgress(response, (progress) => {
        setBloodbornePatchUpdateStatus({
            key: 'patch.update.downloading',
            progress,
            isUpdating: true,
            error: null
        });
    });
}

async function ensureBloodbornePatchFile(rootPath: string): Promise<void> {
    const patchPath = resolveShadps4BloodbornePatchPath(rootPath);
    if (await pathExists(patchPath)) {
        return;
    }

    const patchContent = await readBloodbornePatchContent();
    await writeTextFile(patchPath, patchContent);
}

async function ensureBloodbornePatchIndexFile(rootPath: string): Promise<void> {
    const patchIndexPath = resolveShadps4PatchIndexPath(rootPath);
    if (await pathExists(patchIndexPath)) {
        return;
    }

    await writeJsonFile(patchIndexPath, {
        [BLOODBORNE_PATCH_FILE_NAME]: [...BLOODBORNE_TITLE_IDS]
    });
}

async function resolveShadps4UserDataRootPathForBootstrapState(bootstrapState: LauncherBootstrapState): Promise<string> {
    return resolveShadps4UserDataRootPath(bootstrapState.config.emulator.shadps4.executablePath);
}

async function readJsonObjectFile(filePath: string): Promise<Record<string, unknown> | null> {
    if (!(await pathExists(filePath))) {
        return null;
    }

    const parsedValue = await readJsonFile<unknown>(filePath);
    return isRecord(parsedValue) ? parsedValue : null;
}

async function readShadps4ConfigJson(rootPath: string): Promise<Record<string, unknown> | null> {
    return readJsonObjectFile(resolveShadps4ConfigJsonPath(rootPath));
}

async function readShadps4CustomConfigJson(
    rootPath: string,
    bootstrapState: LauncherBootstrapState
): Promise<Record<string, unknown> | null> {
    const titleId = bootstrapState.bloodborne.titleId;
    if (!bootstrapState.bloodborne.isValid || !titleId) {
        return null;
    }

    return readJsonObjectFile(resolveShadps4CustomConfigPath(rootPath, titleId));
}

function readGeneralSettingsFromConfig(config: Record<string, unknown> | null): Shadps4GeneralSettings {
    const general = config && isRecord(config['General']) ? config['General'] : {};

    return {
        consoleLanguage: normalizeNumber(
            general['console_language'],
            DEFAULT_SHADPS4_GENERAL_SETTINGS.consoleLanguage,
            { min: 0, max: 30, integer: true }
        ),
        discordRpcEnabled: normalizeBoolean(
            general['discord_rpc_enabled'],
            DEFAULT_SHADPS4_GENERAL_SETTINGS.discordRpcEnabled
        ),
        trophyNotificationDuration: normalizeNumber(
            general['trophy_notification_duration'],
            DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyNotificationDuration,
            { min: 0, max: 60000 }
        ),
        trophyNotificationSide: normalizeString(
            general['trophy_notification_side'],
            DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyNotificationSide
        ),
        trophyPopupDisabled: normalizeBoolean(
            general['trophy_popup_disabled'],
            DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyPopupDisabled
        ),
        volumeSlider: normalizeNumber(general['volume_slider'], DEFAULT_SHADPS4_GENERAL_SETTINGS.volumeSlider, {
            min: 0,
            max: 200,
            integer: true
        }),
        releaseTrophyKey: DEFAULT_SHADPS4_GENERAL_SETTINGS.releaseTrophyKey
    };
}

function mergeGeneralSettings(
    fallbackSettings: Shadps4GeneralSettings,
    config: Record<string, unknown> | null
): Shadps4GeneralSettings {
    const general = config && isRecord(config['General']) ? config['General'] : {};

    return {
        ...fallbackSettings,
        consoleLanguage: normalizeNumber(general['console_language'], fallbackSettings.consoleLanguage, {
            min: 0,
            max: 30,
            integer: true
        }),
        discordRpcEnabled: normalizeBoolean(general['discord_rpc_enabled'], fallbackSettings.discordRpcEnabled),
        trophyNotificationDuration: normalizeNumber(
            general['trophy_notification_duration'],
            fallbackSettings.trophyNotificationDuration,
            { min: 0, max: 60000 }
        ),
        trophyNotificationSide: normalizeString(general['trophy_notification_side'], fallbackSettings.trophyNotificationSide),
        trophyPopupDisabled: normalizeBoolean(general['trophy_popup_disabled'], fallbackSettings.trophyPopupDisabled),
        volumeSlider: normalizeNumber(general['volume_slider'], fallbackSettings.volumeSlider, {
            min: 0,
            max: 200,
            integer: true
        })
    };
}

function normalizeGeneralSettings(settings: Shadps4GeneralSettings): Shadps4GeneralSettings {
    return {
        consoleLanguage: normalizeNumber(settings.consoleLanguage, DEFAULT_SHADPS4_GENERAL_SETTINGS.consoleLanguage, {
            min: 0,
            max: 30,
            integer: true
        }),
        discordRpcEnabled: !!settings.discordRpcEnabled,
        trophyNotificationDuration: normalizeNumber(
            settings.trophyNotificationDuration,
            DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyNotificationDuration,
            { min: 0, max: 60000 }
        ),
        trophyNotificationSide: normalizeString(
            settings.trophyNotificationSide,
            DEFAULT_SHADPS4_GENERAL_SETTINGS.trophyNotificationSide
        ),
        trophyPopupDisabled: !!settings.trophyPopupDisabled,
        volumeSlider: normalizeNumber(settings.volumeSlider, DEFAULT_SHADPS4_GENERAL_SETTINGS.volumeSlider, {
            min: 0,
            max: 200,
            integer: true
        }),
        releaseTrophyKey: typeof settings.releaseTrophyKey === 'string' ? settings.releaseTrophyKey.trim() : ''
    };
}

function applyGeneralSettingsToConfig(
    config: Record<string, unknown>,
    settings: Shadps4GeneralSettings
): Record<string, unknown> {
    const currentGeneral = isRecord(config['General']) ? config['General'] : {};

    return {
        ...config,
        General: {
            ...currentGeneral,
            console_language: settings.consoleLanguage,
            discord_rpc_enabled: settings.discordRpcEnabled,
            trophy_notification_duration: settings.trophyNotificationDuration,
            trophy_notification_side: settings.trophyNotificationSide,
            trophy_popup_disabled: settings.trophyPopupDisabled,
            volume_slider: settings.volumeSlider
        }
    };
}

async function readShadps4KeysJson(rootPath: string): Promise<Record<string, unknown>> {
    return (await readJsonObjectFile(resolveShadps4KeysJsonPath(rootPath))) ?? {};
}

async function readReleaseTrophyKey(rootPath: string): Promise<string> {
    const keys = await readShadps4KeysJson(rootPath);
    return typeof keys['ReleaseTrophyKey'] === 'string' ? keys['ReleaseTrophyKey'] : '';
}

async function writeReleaseTrophyKey(rootPath: string, releaseTrophyKey: string): Promise<void> {
    const keys = await readShadps4KeysJson(rootPath);
    await writeJsonFile(resolveShadps4KeysJsonPath(rootPath), {
        ...keys,
        ReleaseTrophyKey: releaseTrophyKey
    });
}

function createCustomConfigFallback(): Record<string, unknown> {
    return resolveBloodborneCustomConfig({ presetId: 'quality' }) as unknown as Record<string, unknown>;
}

export function getBloodbornePatchUpdateStatus(): BloodbornePatchUpdateStatusSnapshot {
    return bloodbornePatchUpdateStatus;
}

export async function readShadps4GeneralSettings(
    bootstrapState: LauncherBootstrapState
): Promise<Shadps4GeneralSettings> {
    const rootPath = await resolveShadps4UserDataRootPathForBootstrapState(bootstrapState);
    const globalConfig = await readShadps4ConfigJson(rootPath);
    const customConfig = await readShadps4CustomConfigJson(rootPath, bootstrapState);
    const fallbackSettings = readGeneralSettingsFromConfig(globalConfig);
    const customSettings = mergeGeneralSettings(fallbackSettings, customConfig);

    return {
        ...customSettings,
        releaseTrophyKey: await readReleaseTrophyKey(rootPath)
    };
}

export async function saveShadps4GeneralSettings(
    bootstrapState: LauncherBootstrapState,
    settings: Shadps4GeneralSettings
): Promise<Shadps4GeneralSettings> {
    const rootPath = await resolveShadps4UserDataRootPathForBootstrapState(bootstrapState);
    const titleId = bootstrapState.bloodborne.titleId;

    if (!bootstrapState.bloodborne.isValid || !titleId) {
        throw new Error('Bloodborne custom config cannot be saved before the game is configured.');
    }

    const normalizedSettings = normalizeGeneralSettings(settings);
    const customConfigPath = resolveShadps4CustomConfigPath(rootPath, titleId);
    const currentCustomConfig = (await readJsonObjectFile(customConfigPath)) ?? createCustomConfigFallback();

    await writeJsonFile(customConfigPath, applyGeneralSettingsToConfig(currentCustomConfig, normalizedSettings));
    await writeReleaseTrophyKey(rootPath, normalizedSettings.releaseTrophyKey);

    return readShadps4GeneralSettings(bootstrapState);
}

export async function deleteShadps4ShaderCache(
    bootstrapState: LauncherBootstrapState
): Promise<DeleteShadps4ShaderCacheResult> {
    const rootPath = await resolveShadps4UserDataRootPathForBootstrapState(bootstrapState);
    const cachePath = resolveShadps4ShaderCachePath(rootPath);

    await rm(cachePath, { recursive: true, force: true });
    await mkdir(cachePath, { recursive: true });

    return {
        deleted: true,
        path: cachePath
    };
}

export async function readBloodbornePatchCatalog(
    bootstrapState: LauncherBootstrapState
): Promise<BloodbornePatchCatalogItem[]> {
    const rootPath = await resolveShadps4UserDataRootPathForBootstrapState(bootstrapState);
    const patchPath = resolveShadps4BloodbornePatchPath(rootPath);

    if (!(await pathExists(patchPath))) {
        return createStaticBloodbornePatchCatalog();
    }

    const catalog = readBloodbornePatchCatalogFromXml(await readFile(patchPath, 'utf8'));
    return catalog.length > 0 ? catalog : createStaticBloodbornePatchCatalog();
}

export async function updateBloodbornePatchFile(
    bootstrapState: LauncherBootstrapState
): Promise<BloodbornePatchCatalogItem[]> {
    if (bloodbornePatchUpdateStatus.isUpdating) {
        return readBloodbornePatchCatalog(bootstrapState);
    }

    resetBloodbornePatchUpdateStatus();

    try {
        const rootPath = await resolveShadps4UserDataRootPathForBootstrapState(bootstrapState);
        const patchPath = resolveShadps4BloodbornePatchPath(rootPath);
        const patchContent = disableBloodbornePatchEnablement(await downloadBloodbornePatchContentWithUpdateStatus());

        setBloodbornePatchUpdateStatus({
            key: 'patch.update.writing',
            progress: 100,
            isUpdating: true,
            error: null
        });

        await writeTextFile(patchPath, patchContent);
        await ensureBloodbornePatchIndexFile(rootPath);

        bloodbornePatchContentPromise = Promise.resolve(patchContent);

        setBloodbornePatchUpdateStatus({
            key: 'patch.update.complete',
            progress: 100,
            isUpdating: false,
            error: null
        });

        return readBloodbornePatchCatalogFromXml(patchContent);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown patch update error.';
        setBloodbornePatchUpdateStatus({
            key: 'patch.update.failed',
            progress: null,
            isUpdating: false,
            error: message
        });
        throw error;
    }
}

export async function ensureShadps4UserDataSynced(
    bootstrapState: LauncherBootstrapState
): Promise<void> {
    setSplashStatusKey('splash.preparingShadps4UserData');

    const executablePath = bootstrapState.config.emulator.shadps4.executablePath;
    let rootPath = await resolveShadps4UserDataRootPath(executablePath);

    if (await pathExists(executablePath)) {
        const initializedRootPath = await initializeShadps4UserData(executablePath as string);
        rootPath = initializedRootPath ?? rootPath;
    }

    if (!(await pathExists(resolveShadps4ConfigJsonPath(rootPath)))) {
        console.warn('shadPS4 did not create config.json automatically. A launcher-managed JSON config will be written.');
    }

    await syncShadps4ConfigJson(rootPath, bootstrapState);
    await ensureBloodborneCustomConfig(rootPath, bootstrapState);

    if (!isBloodbornePatchAppVersionSupported(bootstrapState.config.games.bloodborne.appVer)) {
        console.warn('Skipping Bloodborne patches because the game app version is not 01.09.');
        return;
    }

    await ensureBloodbornePatchFile(rootPath);
    await ensureBloodbornePatchIndexFile(rootPath);
}
