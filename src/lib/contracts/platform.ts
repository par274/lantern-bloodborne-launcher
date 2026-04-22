import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from './commands';

export type AppPlatform = 'electron' | 'web' | 'mobile';

export interface PlatformApi {
    kind: AppPlatform;
    isAvailable: boolean;
    invoke: <T extends PlatformCommand>(
        command: T,
        payload: PlatformCommandPayload<T>
    ) => Promise<PlatformCommandResult<T>>;
}
