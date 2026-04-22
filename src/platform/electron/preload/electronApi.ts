import { ipcRenderer } from 'electron';

import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';

import type { ElectronRendererBridge } from '../renderer/bridge';

function invoke<T extends PlatformCommand>(
    command: T,
    payload: PlatformCommandPayload<T>
): Promise<PlatformCommandResult<T>> {
    return ipcRenderer.invoke(command, payload) as Promise<PlatformCommandResult<T>>;
}

export const electronAPI: ElectronRendererBridge = {
    invoke
};
