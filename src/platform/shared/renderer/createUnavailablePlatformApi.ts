import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';
import type { AppPlatform, PlatformApi } from '$lib/contracts/platform';

function createUnavailableError(kind: AppPlatform): Error {
    return new Error(`${kind} platform adapter is not implemented yet.`);
}

export function createUnavailablePlatformApi(kind: AppPlatform): PlatformApi {
    return {
        kind,
        isAvailable: false,
        async invoke<T extends PlatformCommand>(
            _command: T,
            _payload: PlatformCommandPayload<T>
        ): Promise<PlatformCommandResult<T>> {
            throw createUnavailableError(kind);
        }
    };
}
