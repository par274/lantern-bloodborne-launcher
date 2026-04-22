import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';

export interface ElectronCommandHandler<T extends PlatformCommand = PlatformCommand> {
    command: T;
    handle: (payload: PlatformCommandPayload<T>) => Promise<PlatformCommandResult<T>> | PlatformCommandResult<T>;
}

export function defineElectronCommand<T extends PlatformCommand>(
    command: T,
    handle: (payload: PlatformCommandPayload<T>) => Promise<PlatformCommandResult<T>> | PlatformCommandResult<T>
): ElectronCommandHandler<T> {
    return {
        command,
        handle
    };
}
