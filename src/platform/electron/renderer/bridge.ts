import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';

export interface ElectronRendererBridge {
    invoke: <T extends PlatformCommand>(
        command: T,
        payload: PlatformCommandPayload<T>
    ) => Promise<PlatformCommandResult<T>>;
}
