import type { LauncherBootstrapState, PickBloodborneDirectoryResult } from './launcherConfig';

export const PLATFORM_COMMANDS = {
    APP_EXIT: 'app:exit',
    LAUNCH_GAME: 'launcher:start-game',
    UPDATE_SHADPS4: 'emulator:update-shadps4',
    GET_SHADPS4_GENERAL_SETTINGS: 'emulator:get-general-settings',
    SAVE_SHADPS4_GENERAL_SETTINGS: 'emulator:save-general-settings',
    DELETE_SHADPS4_SHADER_CACHE: 'emulator:delete-shader-cache',
    READ_CLIPBOARD_TEXT: 'clipboard:read-text',
    RENDERER_SCENE_READY: 'app:renderer-scene-ready',
    GET_LAUNCHER_BOOTSTRAP_STATE: 'app:get-launcher-bootstrap-state',
    GET_SPLASH_STATUS: 'app:get-splash-status',
    GET_BLOODBORNE_PATCH_CATALOG: 'patches:get-bloodborne-catalog',
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
