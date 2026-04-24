import type { EmulatorChannel, LauncherBootstrapState, PickBloodborneDirectoryResult } from './launcherConfig';

export const PLATFORM_COMMANDS = {
    APP_EXIT: 'app:exit',
    LAUNCH_GAME: 'launcher:start-game',
    UPDATE_SHADPS4: 'emulator:update-shadps4',
    GET_SHADPS4_UPDATE_CHANGELOG: 'emulator:get-shadps4-update-changelog',
    GET_SHADPS4_GRAPHICS_SETTINGS: 'emulator:get-graphics-settings',
    SAVE_SHADPS4_GRAPHICS_SETTINGS: 'emulator:save-graphics-settings',
    GET_SHADPS4_GENERAL_SETTINGS: 'emulator:get-general-settings',
    SAVE_SHADPS4_GENERAL_SETTINGS: 'emulator:save-general-settings',
    DELETE_SHADPS4_SHADER_CACHE: 'emulator:delete-shader-cache',
    READ_CLIPBOARD_TEXT: 'clipboard:read-text',
    RENDERER_SCENE_READY: 'app:renderer-scene-ready',
    GET_LAUNCHER_BOOTSTRAP_STATE: 'app:get-launcher-bootstrap-state',
    GET_SPLASH_STATUS: 'app:get-splash-status',
    GET_BLOODBORNE_PATCH_CATALOG: 'patches:get-bloodborne-catalog',
    GET_BLOODBORNE_PATCH_ENABLEMENT: 'patches:get-bloodborne-enablement',
    SAVE_BLOODBORNE_PATCH_ENABLEMENT: 'patches:save-bloodborne-enablement',
    SYNC_BLOODBORNE_PATCH_ENABLEMENT: 'patches:sync-bloodborne-enablement',
    UPDATE_BLOODBORNE_PATCHES: 'patches:update-bloodborne',
    GET_BLOODBORNE_PATCH_UPDATE_STATUS: 'patches:get-bloodborne-update-status',
    PICK_BLOODBORNE_DIRECTORY: 'app:pick-bloodborne-directory',
    SAVE_LAUNCHER_LOCALE: 'app:save-launcher-locale',
    COMPLETE_SPLASH_BOOTSTRAP: 'app:complete-splash-bootstrap'
} as const;

export type PlatformCommand = (typeof PLATFORM_COMMANDS)[keyof typeof PLATFORM_COMMANDS];

export interface SplashStatusSnapshot {
    key: string;
    progress: number | null;
}

export interface BloodbornePatchCatalogItem {
    id: string;
    metadataName: string;
    author: string | null;
    note: string | null;
    appVersion: string | null;
    hasLauncherDefinition: boolean;
}

export interface BloodbornePatchUpdateStatusSnapshot {
    key: string;
    progress: number | null;
    isUpdating: boolean;
    error: string | null;
}

export interface BloodbornePatchEnablementState {
    enabledPatchIds: string[];
}

export interface Shadps4UpdateCommit {
    sha: string;
    shortSha: string;
    title: string;
    body: string | null;
    commitUrl: string | null;
    pullRequestNumber: number | null;
    pullRequestUrl: string | null;
}

export interface Shadps4UpdateChangelog {
    channel: EmulatorChannel;
    currentVersion: string | null;
    targetVersion: string;
    currentCommit: string | null;
    targetCommit: string | null;
    compareUrl: string | null;
    isUpToDate: boolean;
    commits: Shadps4UpdateCommit[];
}

export const SHADPS4_GRAPHICS_PRESET_IDS = [
    'ultra-quality',
    'quality',
    'performance',
    'ultra-performance',
    'custom'
] as const;

export const SHADPS4_GRAPHICS_READBACKS_MODES = ['disabled', 'relaxed'] as const;
export const SHADPS4_GRAPHICS_RESOLUTION_OPTIONS = ['1080p', '1440p', '2160p'] as const;
export const SHADPS4_GRAPHICS_EXTRA_DMEM_OPTIONS = [2048, 4096, 8196, 12288, 16384] as const;

export type Shadps4GraphicsPresetSelection = (typeof SHADPS4_GRAPHICS_PRESET_IDS)[number];
export type Shadps4GraphicsReadbacksMode = (typeof SHADPS4_GRAPHICS_READBACKS_MODES)[number];
export type Shadps4GraphicsResolutionOption = (typeof SHADPS4_GRAPHICS_RESOLUTION_OPTIONS)[number];
export type Shadps4GraphicsExtraDmemOption = (typeof SHADPS4_GRAPHICS_EXTRA_DMEM_OPTIONS)[number];

export interface Shadps4GraphicsSettings {
    presetId: Shadps4GraphicsPresetSelection;
    custom: {
        readbacksMode: Shadps4GraphicsReadbacksMode;
        resolution: Shadps4GraphicsResolutionOption;
        extraDmemInMegabytes: Shadps4GraphicsExtraDmemOption;
        pipelineCacheEnabled: boolean;
    };
    directMemoryAccessEnabled: boolean;
}

export interface Shadps4GeneralSettings {
    consoleLanguage: number;
    discordRpcEnabled: boolean;
    trophyNotificationDuration: number;
    trophyNotificationSide: string;
    trophyPopupDisabled: boolean;
    volumeSlider: number;
    releaseTrophyKey: string;
}

export interface DeleteShadps4ShaderCacheResult {
    deleted: boolean;
    path: string | null;
}

export interface PlatformCommandMap {
    [PLATFORM_COMMANDS.APP_EXIT]: {
        payload: undefined;
        result: void;
    };

    [PLATFORM_COMMANDS.LAUNCH_GAME]: {
        payload: undefined;
        result: void;
    };

    [PLATFORM_COMMANDS.UPDATE_SHADPS4]: {
        payload: undefined;
        result: LauncherBootstrapState;
    };

    [PLATFORM_COMMANDS.GET_SHADPS4_UPDATE_CHANGELOG]: {
        payload: undefined;
        result: Shadps4UpdateChangelog;
    };

    [PLATFORM_COMMANDS.GET_SHADPS4_GRAPHICS_SETTINGS]: {
        payload: undefined;
        result: Shadps4GraphicsSettings;
    };

    [PLATFORM_COMMANDS.SAVE_SHADPS4_GRAPHICS_SETTINGS]: {
        payload: Shadps4GraphicsSettings;
        result: Shadps4GraphicsSettings;
    };

    [PLATFORM_COMMANDS.GET_SHADPS4_GENERAL_SETTINGS]: {
        payload: undefined;
        result: Shadps4GeneralSettings;
    };

    [PLATFORM_COMMANDS.SAVE_SHADPS4_GENERAL_SETTINGS]: {
        payload: Shadps4GeneralSettings;
        result: Shadps4GeneralSettings;
    };

    [PLATFORM_COMMANDS.DELETE_SHADPS4_SHADER_CACHE]: {
        payload: undefined;
        result: DeleteShadps4ShaderCacheResult;
    };

    [PLATFORM_COMMANDS.READ_CLIPBOARD_TEXT]: {
        payload: undefined;
        result: string;
    };

    [PLATFORM_COMMANDS.RENDERER_SCENE_READY]: {
        payload: undefined;
        result: void;
    };

    [PLATFORM_COMMANDS.GET_LAUNCHER_BOOTSTRAP_STATE]: {
        payload: undefined;
        result: LauncherBootstrapState;
    };

    [PLATFORM_COMMANDS.GET_SPLASH_STATUS]: {
        payload: undefined;
        result: SplashStatusSnapshot;
    };

    [PLATFORM_COMMANDS.GET_BLOODBORNE_PATCH_CATALOG]: {
        payload: undefined;
        result: BloodbornePatchCatalogItem[];
    };

    [PLATFORM_COMMANDS.GET_BLOODBORNE_PATCH_ENABLEMENT]: {
        payload: undefined;
        result: BloodbornePatchEnablementState;
    };

    [PLATFORM_COMMANDS.SAVE_BLOODBORNE_PATCH_ENABLEMENT]: {
        payload: BloodbornePatchEnablementState;
        result: BloodbornePatchEnablementState;
    };

    [PLATFORM_COMMANDS.SYNC_BLOODBORNE_PATCH_ENABLEMENT]: {
        payload: undefined;
        result: BloodbornePatchEnablementState;
    };

    [PLATFORM_COMMANDS.UPDATE_BLOODBORNE_PATCHES]: {
        payload: undefined;
        result: BloodbornePatchCatalogItem[];
    };

    [PLATFORM_COMMANDS.GET_BLOODBORNE_PATCH_UPDATE_STATUS]: {
        payload: undefined;
        result: BloodbornePatchUpdateStatusSnapshot;
    };

    [PLATFORM_COMMANDS.PICK_BLOODBORNE_DIRECTORY]: {
        payload: undefined;
        result: PickBloodborneDirectoryResult;
    };

    [PLATFORM_COMMANDS.SAVE_LAUNCHER_LOCALE]: {
        payload: {
            locale: string;
        };
        result: LauncherBootstrapState;
    };

    [PLATFORM_COMMANDS.COMPLETE_SPLASH_BOOTSTRAP]: {
        payload: undefined;
        result: void;
    };
}

export type PlatformCommandPayload<T extends PlatformCommand> = PlatformCommandMap[T]['payload'];
export type PlatformCommandResult<T extends PlatformCommand> = PlatformCommandMap[T]['result'];
export type PlatformCommandArgs<T extends PlatformCommand> = PlatformCommandPayload<T> extends undefined
    ? []
    : [PlatformCommandPayload<T>];
