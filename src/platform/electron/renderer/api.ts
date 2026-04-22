import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';
import type { PlatformApi } from '$lib/contracts/platform';

import type { ElectronRendererBridge } from './bridge';

function getElectronBridge(): ElectronRendererBridge {
    const bridge = window.electronAPI;

    if (!bridge) {
        throw new Error('Electron bridge is not available.');
    }

    return bridge;
}

export const platformApi: PlatformApi = {
    kind: 'electron',
    get isAvailable(): boolean {
        return typeof window !== 'undefined' && !!window.electronAPI;
    },
    async invoke<T extends PlatformCommand>(
        command: T,
        payload: PlatformCommandPayload<T>
    ): Promise<PlatformCommandResult<T>> {
        return getElectronBridge().invoke(command, payload);
    }
};
