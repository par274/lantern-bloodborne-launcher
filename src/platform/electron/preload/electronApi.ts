import { ipcRenderer, type IpcRendererEvent } from 'electron';

import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';

import type { ElectronGameEvent, ElectronRendererBridge } from '../renderer/bridge';

const GAME_EVENT_CHANNEL = 'game:event';
const MAX_QUEUED_GAME_EVENTS = 10;

const gameEventHandlers = new Set<(event: ElectronGameEvent) => void>();
const queuedGameEvents: ElectronGameEvent[] = [];

ipcRenderer.on(GAME_EVENT_CHANNEL, (_event: IpcRendererEvent, payload: ElectronGameEvent) => {
    if (gameEventHandlers.size === 0) {
        queuedGameEvents.push(payload);

        if (queuedGameEvents.length > MAX_QUEUED_GAME_EVENTS) {
            queuedGameEvents.shift();
        }

        return;
    }

    for (const handler of gameEventHandlers) {
        handler(payload);
    }
});

function invoke<T extends PlatformCommand>(
    command: T,
    payload: PlatformCommandPayload<T>
): Promise<PlatformCommandResult<T>> {
    return ipcRenderer.invoke(command, payload) as Promise<PlatformCommandResult<T>>;
}

export const electronAPI: ElectronRendererBridge = {
    invoke,
    onGameEvent(handler) {
        gameEventHandlers.add(handler);

        for (const event of queuedGameEvents.splice(0)) {
            handler(event);
        }

        return () => {
            gameEventHandlers.delete(handler);
        };
    }
};
