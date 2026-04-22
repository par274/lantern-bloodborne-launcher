export const BLOODBORNE_TITLE_IDS = [
    'CUSA00207',
    'CUSA00208',
    'CUSA00299',
    'CUSA00900',
    'CUSA01363',
    'CUSA03014',
    'CUSA03023',
    'CUSA03173'
] as const;

export type BloodborneTitleId = (typeof BLOODBORNE_TITLE_IDS)[number];
export type EmulatorChannel = 'stable' | 'nightly';

export type BloodborneInstallError =
    | 'missing'
    | 'not-found'
    | 'not-directory'
    | 'invalid-title-id'
    | 'missing-eboot';

export type Shadps4InstallError =
    | 'missing'
    | 'not-found'
    | 'not-file';

export interface LauncherConfig {
    schemaVersion: 1;
    locale: string;
    emulator: {
        shadps4: {
            channel: EmulatorChannel;
            version: string | null;
            executablePath: string | null;
        };
    };
    games: {
        bloodborne: {
            installPath: string | null;
            titleId: BloodborneTitleId | null;
            title: string | null;
            contentId: string | null;
            appVer: string | null;
        };
    };
}

export interface BloodborneInstallStatus {
    installPath: string | null;
    titleId: BloodborneTitleId | null;
    isConfigured: boolean;
    isValid: boolean;
    error: BloodborneInstallError | null;
}

export interface Shadps4InstallStatus {
    executablePath: string | null;
    version: string | null;
    channel: EmulatorChannel;
    isConfigured: boolean;
    isAvailable: boolean;
    error: Shadps4InstallError | null;
}

export interface LauncherBootstrapState {
    config: LauncherConfig;
    bloodborne: BloodborneInstallStatus;
    emulator: {
        shadps4: Shadps4InstallStatus;
    };
}

export interface PickBloodborneDirectoryResult {
    canceled: boolean;
    bootstrapState: LauncherBootstrapState;
    selection: BloodborneInstallStatus | null;
}
