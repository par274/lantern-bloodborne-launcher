import path from 'node:path';

import { app, BrowserWindow, screen, type Rectangle } from 'electron';

import appMeta from '../config/app.meta';
import { canUseHostCommandChannel, sendHostCommand } from './hostCommandClient';

const GAME_EVENT_CHANNEL = 'game:event';

let overlayWindow: BrowserWindow | null = null;
let overlayBoundsOwnerWindow: BrowserWindow | null = null;
let overlayWindowReadyPromise: Promise<BrowserWindow> | null = null;
let isOverlayOpen = false;
let isClosingProgrammatically = false;
let isOverlaySuspended = false;
let overlayHintHideTimer: ReturnType<typeof setTimeout> | null = null;
let nextOverlayInputMode: 'xbox' | 'dualsense' | null = null;

type GameOverlayCloseOptions = {
    focusDelayMs?: number;
};

function resolveBuiltRendererRootPath(): string {
    return path.join(app.getAppPath(), '.build', 'svelte', 'static');
}

function resolvePreloadPath(): string {
    return path.join(app.getAppPath(), '.build', 'dist', 'electron', 'preload.js');
}

function loadOverlayContent(window: BrowserWindow): Promise<void> {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;

    if (devServerUrl) {
        return window.loadURL(new URL('/game-overlay/', devServerUrl).toString());
    }

    return window.loadFile(path.join(resolveBuiltRendererRootPath(), 'game-overlay', 'index.html'));
}

function getFallbackHostWindow(): BrowserWindow | null {
    return BrowserWindow.getAllWindows().find((window) => {
        return !window.isDestroyed() && window !== overlayWindow && window.isVisible();
    }) ?? null;
}

function getOverlayOwnerWindow(): BrowserWindow | null {
    return getFallbackHostWindow();
}

function resolveDisplayBounds(): Rectangle {
    return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).bounds;
}

function resolveOverlayBounds(ownerWindow: BrowserWindow | null): Rectangle {
    return ownerWindow && !ownerWindow.isDestroyed() && ownerWindow.isVisible()
        ? ownerWindow.getBounds()
        : resolveDisplayBounds();
}

function syncOverlayBounds(): void {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
        return;
    }

    const ownerWindow = getOverlayOwnerWindow();
    overlayWindow.setBounds(resolveOverlayBounds(ownerWindow), false);
}

async function getOrCreateOverlayWindow(): Promise<BrowserWindow> {
    if (overlayWindowReadyPromise) {
        return overlayWindowReadyPromise;
    }

    if (overlayWindow && !overlayWindow.isDestroyed()) {
        return overlayWindow;
    }

    const ownerWindow = getOverlayOwnerWindow();
    const bounds = resolveOverlayBounds(ownerWindow);
    const window = new BrowserWindow({
        ...bounds,
        show: false,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        hasShadow: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        parent: ownerWindow ?? undefined,
        title: `${appMeta.title} Overlay`,
        webPreferences: {
            preload: resolvePreloadPath(),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false
        }
    });

    overlayWindow = window;
    window.removeMenu();
    window.setAlwaysOnTop(true, 'screen-saver');

    overlayBoundsOwnerWindow = ownerWindow;
    overlayBoundsOwnerWindow?.on('resize', syncOverlayBounds);
    overlayBoundsOwnerWindow?.on('move', syncOverlayBounds);

    window.on('close', (event) => {
        if (!isOverlayOpen || isClosingProgrammatically) {
            return;
        }

        event.preventDefault();
        void setGameOverlayWindowOpen(false).catch((error) => {
            console.warn('Game overlay close failed.', error);
        });
    });

    window.on('blur', () => {
        if (!isOverlayOpen || isClosingProgrammatically) {
            return;
        }

        void closeOverlayAfterFocusLoss().catch((error) => {
            console.warn('Game overlay focus-loss close failed.', error);
        });
    });

    window.once('closed', () => {
        if (overlayWindow === window) {
            overlayWindow = null;
        }

        if (overlayBoundsOwnerWindow && !overlayBoundsOwnerWindow.isDestroyed()) {
            overlayBoundsOwnerWindow.off('resize', syncOverlayBounds);
            overlayBoundsOwnerWindow.off('move', syncOverlayBounds);
        }

        overlayBoundsOwnerWindow = null;
    });

    overlayWindowReadyPromise = loadOverlayContent(window)
        .then(() => window)
        .finally(() => {
            overlayWindowReadyPromise = null;
        });

    return overlayWindowReadyPromise;
}

async function sendOptionalHostCommand(command: string, lines: readonly string[] = []): Promise<void> {
    if (!canUseHostCommandChannel()) {
        return;
    }

    try {
        await sendHostCommand(command, lines);
    } catch (error) {
        console.warn(`Game overlay host command "${command}" failed.`, error);
    }
}

async function isGameWindowActive(): Promise<boolean> {
    if (!canUseHostCommandChannel()) {
        return true;
    }

    try {
        return (await sendHostCommand('is-game-window-active')) === 'true';
    } catch (error) {
        console.warn('Game window active state could not be resolved.', error);
        return true;
    }
}

async function pauseGameForOverlay(): Promise<void> {
    await sendOptionalHostCommand('toggle-game-pause');
}

async function resumeGameFromOverlay(): Promise<void> {
    await sendOptionalHostCommand('toggle-game-pause');
}

async function focusGameAfterOverlay(): Promise<void> {
    await sendOptionalHostCommand('focus-game-window');
}

async function delay(ms: number): Promise<void> {
    if (ms <= 0) {
        return;
    }

    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function hideOverlayWindow(): void {
    const window = overlayWindow;
    if (!window || window.isDestroyed()) {
        overlayWindow = null;
        return;
    }

    window.hide();
}

async function closeOverlayAfterFocusLoss(): Promise<void> {
    if (!isOverlayOpen || isClosingProgrammatically) {
        return;
    }

    isOverlayOpen = false;
    clearOverlayHintHideTimer();
    const window = overlayWindow;
    if (window && !window.isDestroyed()) {
        announceOverlayClosed(window);
        setOverlayWindowInteractive(window, false);
        hideOverlayWindow();
    }
    await resumeGameFromOverlay();
}

function clearOverlayHintHideTimer(): void {
    if (!overlayHintHideTimer) {
        return;
    }

    clearTimeout(overlayHintHideTimer);
    overlayHintHideTimer = null;
}

function setOverlayWindowInteractive(window: BrowserWindow, interactive: boolean): void {
    window.setIgnoreMouseEvents(!interactive);
    window.setFocusable(interactive);
}

function focusOverlayWindow(window: BrowserWindow): void {
    window.show();
    window.moveTop();
    window.focus();
    window.webContents.focus();

    setTimeout(() => {
        if (window.isDestroyed() || !isOverlayOpen) {
            return;
        }

        window.moveTop();
        window.focus();
        window.webContents.focus();
    }, 50);
}

function destroyOverlayWindow(): void {
    const window = overlayWindow;
    if (!window || window.isDestroyed()) {
        overlayWindow = null;
        return;
    }

    isClosingProgrammatically = true;
    window.setIgnoreMouseEvents(true);
    window.setFocusable(false);
    window.hide();
    window.destroy();
    isClosingProgrammatically = false;
}

function announceOverlayOpened(window: BrowserWindow): void {
    window.webContents.send(GAME_EVENT_CHANNEL, {
        type: 'overlay-opened',
        inputMode: nextOverlayInputMode ?? undefined
    });
    nextOverlayInputMode = null;
}

function announceOverlayClosed(window: BrowserWindow): void {
    window.webContents.send(GAME_EVENT_CHANNEL, { type: 'overlay-closed' });
}

function announceOverlayHint(window: BrowserWindow): void {
    window.webContents.send(GAME_EVENT_CHANNEL, { type: 'overlay-hint' });
}

export async function preloadGameOverlayWindow(): Promise<void> {
    isOverlaySuspended = false;
    const window = await getOrCreateOverlayWindow();
    syncOverlayBounds();
    setOverlayWindowInteractive(window, false);
    announceOverlayClosed(window);
}

export function closeGameOverlayWindowAfterGameEnd(): void {
    isOverlayOpen = false;
    clearOverlayHintHideTimer();
    destroyOverlayWindow();
}

export function suspendGameOverlayWindow(): void {
    isOverlaySuspended = true;
    nextOverlayInputMode = null;
    closeGameOverlayWindowAfterGameEnd();
}

export async function showGameOverlayHint(): Promise<void> {
    if (isOverlaySuspended || isOverlayOpen) {
        return;
    }

    const window = await getOrCreateOverlayWindow();
    syncOverlayBounds();
    clearOverlayHintHideTimer();
    setOverlayWindowInteractive(window, false);
    window.setAlwaysOnTop(true, 'screen-saver');
    window.showInactive();
    announceOverlayHint(window);

    overlayHintHideTimer = setTimeout(() => {
        if (isOverlayOpen || window.isDestroyed()) {
            return;
        }

        hideOverlayWindow();
        announceOverlayClosed(window);
    }, 5200);
}

export async function setGameOverlayWindowOpen(open: boolean, options: GameOverlayCloseOptions = {}): Promise<void> {
    if (isOverlaySuspended && open) {
        return;
    }

    if (isOverlayOpen === open) {
        return;
    }

    if (open) {
        try {
            if (!(await isGameWindowActive())) {
                return;
            }

            isOverlayOpen = true;
            clearOverlayHintHideTimer();
            await pauseGameForOverlay();
            const window = await getOrCreateOverlayWindow();
            syncOverlayBounds();
            setOverlayWindowInteractive(window, true);
            window.setAlwaysOnTop(true, 'screen-saver');
            focusOverlayWindow(window);
            setTimeout(() => {
                if (!window.isDestroyed()) {
                    announceOverlayOpened(window);
                }
            }, 0);
        } catch (error) {
            isOverlayOpen = false;
            throw error;
        }

        return;
    }

    isOverlayOpen = false;
    clearOverlayHintHideTimer();
    const window = overlayWindow;
    if (window && !window.isDestroyed()) {
        setOverlayWindowInteractive(window, true);
        announceOverlayClosed(window);
    }
    await resumeGameFromOverlay();
    await delay(options.focusDelayMs ?? 0);
    if (window && !window.isDestroyed()) {
        setOverlayWindowInteractive(window, false);
        window.blur();
    }
    hideOverlayWindow();
    await focusGameAfterOverlay();
}

export async function toggleGameOverlayWindow(inputMode?: 'xbox' | 'dualsense'): Promise<void> {
    if (isOverlaySuspended) {
        return;
    }

    if (!isOverlayOpen && inputMode) {
        nextOverlayInputMode = inputMode;
    }

    await setGameOverlayWindowOpen(!isOverlayOpen);
}
