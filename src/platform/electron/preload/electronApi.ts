import { ipcRenderer, type IpcRendererEvent } from 'electron';

import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';

import type { ElectronGameEvent, ElectronRendererBridge } from '../renderer/bridge';

const GAME_EVENT_CHANNEL = 'game:event';

function invoke<T extends PlatformCommand>(
    command: T,
    payload: PlatformCommandPayload<T>
): Promise<PlatformCommandResult<T>> {
    return ipcRenderer.invoke(command, payload) as Promise<PlatformCommandResult<T>>;
}

export const electronAPI: ElectronRendererBridge = {
    invoke,
    onGameEvent(handler) {
        const listener = (_event: IpcRendererEvent, payload: ElectronGameEvent) => {
            handler(payload);
        };

        ipcRenderer.on(GAME_EVENT_CHANNEL, listener);

        return () => {
            ipcRenderer.removeListener(GAME_EVENT_CHANNEL, listener);
        };
    }
};
