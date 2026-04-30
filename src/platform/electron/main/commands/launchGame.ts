import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

import { BrowserWindow, globalShortcut } from 'electron';

import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { defineElectronCommand } from '../defineElectronCommand';
import {
    closeGameOverlayWindowAfterGameEnd,
    setGameOverlayHostWindow,
    showGameOverlayHint,
    toggleGameOverlayWindow
} from '../gameOverlayWindow';
import {
    canUseHostCommandChannel,
    connectHostCommandSocket,
    createHostProtocolLineHandler,
    writeHostCommand
} from '../hostCommandClient';

const GAME_EVENT_CHANNEL = 'game:event';

let activeFallbackGameProcess: ChildProcess | null = null;
let activeEmbeddedGameSocket: import('node:net').Socket | null = null;
let activeHostLaunchPromise: Promise<{ mode: 'embedded' | 'standalone' }> | null = null;
let unregisterHostLineHandler: (() => void) | null = null;
let isGameShortcutRegistered = false;

function getLauncherWindows(): BrowserWindow[] {
    return BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed());
}

function getGameHostWindow(): BrowserWindow {
    const windows = getLauncherWindows();
    const focusedWindow = BrowserWindow.getFocusedWindow();

    if (focusedWindow && windows.includes(focusedWindow)) {
        return focusedWindow;
    }

    const window = windows.at(-1);
    if (!window) {
        throw new Error('Lantern launcher window is not available.');
    }

    return window;
}

function hideLauncherWindows(): void {
    for (const window of getLauncherWindows()) {
        window.blur();
        window.hide();
    }
}

function showLauncherWindows(): void {
    const windows = getLauncherWindows();

    for (const window of windows) {
        if (window.isMinimized()) {
            window.restore();
        }
        window.show();
    }

    windows.at(-1)?.focus();
}

function sendGameEvent(payload: { type: 'session-ended'; exitCode: number | null }): void {
    for (const window of getLauncherWindows()) {
        window.webContents.send(GAME_EVENT_CHANNEL, payload);
    }
}

function registerGameShortcut(): void {
    if (isGameShortcutRegistered) {
        return;
    }

    isGameShortcutRegistered = globalShortcut.register('F1', () => {
        void toggleGameOverlayWindow().catch((error) => {
            console.warn('Game overlay toggle failed.', error);
        });
    });
}

function unregisterGameShortcut(): void {
    if (!isGameShortcutRegistered) {
        return;
    }

    globalShortcut.unregister('F1');
    isGameShortcutRegistered = false;
}

function readNativeWindowHandle(window: BrowserWindow): string {
    const handle = window.getNativeWindowHandle();

    return handle.length >= 8 ? handle.readBigUInt64LE(0).toString() : BigInt(handle.readUInt32LE(0)).toString();
}

function clearEmbeddedGameSession(exitCode: number | null = null): void {
    unregisterHostLineHandler?.();
    unregisterHostLineHandler = null;
    activeEmbeddedGameSocket?.destroy();
    activeEmbeddedGameSocket = null;
    unregisterGameShortcut();
    closeGameOverlayWindowAfterGameEnd();
    sendGameEvent({ type: 'session-ended', exitCode });
}

function clearActiveFallbackGameProcess(processRef?: ChildProcess): void {
    if (processRef && activeFallbackGameProcess !== processRef) {
        return;
    }

    activeFallbackGameProcess = null;
}

async function waitForProcessSpawn(processRef: ChildProcess): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const handleSpawn = () => {
            processRef.removeListener('error', handleError);
            resolve();
        };

        const handleError = (error: Error) => {
            processRef.removeListener('spawn', handleSpawn);
            reject(error);
        };

        processRef.once('spawn', handleSpawn);
        processRef.once('error', handleError);
    });
}

async function launchEmbeddedGameViaHost(): Promise<{ mode: 'embedded' }> {
    if (activeEmbeddedGameSocket && !activeEmbeddedGameSocket.destroyed) {
        return { mode: 'embedded' };
    }

    if (process.platform !== 'win32') {
        throw new Error('Embedded game mode is only available on Windows.');
    }

    const hostWindow = getGameHostWindow();
    setGameOverlayHostWindow(hostWindow);

    const hostWindowHandle = readNativeWindowHandle(hostWindow);
    const socket = await connectHostCommandSocket();

    let didStart = false;
    let didExit = false;

    try {
        const started = new Promise<void>((resolve, reject) => {
            unregisterHostLineHandler = createHostProtocolLineHandler(
                socket,
                (line) => {
                    if (line.startsWith('started:')) {
                        didStart = true;
                        resolve();
                        return;
                    }

                    if (line.startsWith('exited:')) {
                        didExit = true;
                        const exitCode = Number.parseInt(line.slice('exited:'.length), 10);
                        clearEmbeddedGameSession(Number.isFinite(exitCode) ? exitCode : null);
                        return;
                    }

                    if (line.startsWith('error:')) {
                        const error = new Error(line.slice('error:'.length));

                        if (didStart) {
                            clearEmbeddedGameSession(null);
                            return;
                        }

                        reject(error);
                    }
                },
                (error) => {
                    if (didStart) {
                        clearEmbeddedGameSession(null);
                        return;
                    }

                    reject(error);
                }
            );
        });

        await writeHostCommand(socket, 'launch-game-embedded', [hostWindowHandle]);
        await started;

        if (didExit || socket.destroyed) {
            throw new Error('shadPS4 closed before embedded game mode became active.');
        }

        activeEmbeddedGameSocket = socket;
        registerGameShortcut();
        void showGameOverlayHint().catch((error) => {
            console.warn('Game overlay hint could not be shown.', error);
        });

        return { mode: 'embedded' };
    } catch (error) {
        unregisterHostLineHandler?.();
        unregisterHostLineHandler = null;
        socket.destroy();
        throw error;
    }
}

async function launchGameDirectlyForDevelopment(): Promise<{ mode: 'standalone' }> {
    if (activeFallbackGameProcess && activeFallbackGameProcess.exitCode === null && !activeFallbackGameProcess.killed) {
        return { mode: 'standalone' };
    }

    const bootstrapState = await getLauncherBootstrapState();
    const bloodborneTitleId = bootstrapState.bloodborne.titleId;
    const shadps4Path = bootstrapState.emulator.shadps4.executablePath;

    if (!bootstrapState.bloodborne.isValid || !bloodborneTitleId) {
        throw new Error('Bloodborne path is not ready for launch.');
    }

    if (!bootstrapState.emulator.shadps4.isAvailable || !shadps4Path) {
        throw new Error('shadPS4 is not ready for launch.');
    }

    const processRef = spawn(shadps4Path, [bloodborneTitleId], {
        cwd: path.dirname(shadps4Path),
        detached: false,
        stdio: 'ignore',
        windowsHide: false
    });

    activeFallbackGameProcess = processRef;

    processRef.once('exit', () => {
        clearActiveFallbackGameProcess(processRef);
        showLauncherWindows();
    });

    processRef.once('error', () => {
        clearActiveFallbackGameProcess(processRef);
        showLauncherWindows();
    });

    await waitForProcessSpawn(processRef);

    hideLauncherWindows();
    return { mode: 'standalone' };
}

export default defineElectronCommand(PLATFORM_COMMANDS.LAUNCH_GAME, async () => {
    if (activeHostLaunchPromise) {
        return activeHostLaunchPromise;
    }

    const canUseEmbeddedHost = process.platform === 'win32' && canUseHostCommandChannel();

    if (!canUseEmbeddedHost) {
        return launchGameDirectlyForDevelopment();
    }

    activeHostLaunchPromise = launchEmbeddedGameViaHost().finally(() => {
        activeHostLaunchPromise = null;
    });

    return activeHostLaunchPromise;
});
