import path from 'node:path';

import { app, BrowserWindow, type Rectangle } from 'electron';

import appMeta from '../config/app.meta';
import { sendHostCommand } from './hostCommandClient';

const GAME_EVENT_CHANNEL = 'game:event';

let hostWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let overlayWindowReadyPromise: Promise<BrowserWindow> | null = null;
let isOverlayOpen = false;
let isClosingProgrammatically = false;
let overlayHintHideTimer: ReturnType<typeof setTimeout> | null = null;

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
    return BrowserWindow.getAllWindows().find((window) => !window.isDestroyed() && window !== overlayWindow) ?? null;
}

function resolveOverlayBounds(ownerWindow: BrowserWindow | null): Rectangle {
    return ownerWindow && !ownerWindow.isDestroyed()
        ? ownerWindow.getBounds()
        : {
            x: 0,
            y: 0,
            width: 1280,
            height: 720
        };
}

function syncOverlayBounds(): void {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
        return;
    }

    const ownerWindow = hostWindow && !hostWindow.isDestroyed() ? hostWindow : getFallbackHostWindow();
    overlayWindow.setBounds(resolveOverlayBounds(ownerWindow), false);
}

async function getOrCreateOverlayWindow(): Promise<BrowserWindow> {
    if (overlayWindowReadyPromise) {
        return overlayWindowReadyPromise;
    }

    if (overlayWindow && !overlayWindow.isDestroyed()) {
        return overlayWindow;
    }

    const ownerWindow = hostWindow && !hostWindow.isDestroyed() ? hostWindow : getFallbackHostWindow();
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

    ownerWindow?.on('resize', syncOverlayBounds);
    ownerWindow?.on('move', syncOverlayBounds);

    window.on('close', (event) => {
        if (!isOverlayOpen || isClosingProgrammatically) {
            return;
        }

        event.preventDefault();
        void setGameOverlayWindowOpen(false).catch((error) => {
            console.warn('Game overlay close failed.', error);
        });
    });

    window.once('closed', () => {
        if (overlayWindow === window) {
            overlayWindow = null;
        }

        if (hostWindow && !hostWindow.isDestroyed()) {
            hostWindow.off('resize', syncOverlayBounds);
            hostWindow.off('move', syncOverlayBounds);
        }
    });

    overlayWindowReadyPromise = loadOverlayContent(window)
        .then(() => window)
        .finally(() => {
            overlayWindowReadyPromise = null;
        });

    return overlayWindowReadyPromise;
}

async function pauseGameForOverlay(): Promise<void> {
    await sendHostCommand('toggle-game-pause');
    await sendHostCommand('set-game-overlay-visible', ['true']);
}

async function resumeGameFromOverlay(): Promise<void> {
    await sendHostCommand('set-game-overlay-visible', ['false']);
    await sendHostCommand('toggle-game-pause');
}

function hideOverlayWindow(): void {
    const window = overlayWindow;
    if (!window || window.isDestroyed()) {
        overlayWindow = null;
        return;
    }

    window.hide();
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

function destroyOverlayWindow(): void {
    const window = overlayWindow;
    if (!window || window.isDestroyed()) {
        overlayWindow = null;
        return;
    }

    isClosingProgrammatically = true;
    window.close();
    isClosingProgrammatically = false;
}

function announceOverlayOpened(window: BrowserWindow): void {
    window.webContents.send(GAME_EVENT_CHANNEL, { type: 'overlay-opened' });
}

function announceOverlayClosed(window: BrowserWindow): void {
    window.webContents.send(GAME_EVENT_CHANNEL, { type: 'overlay-closed' });
}

function announceOverlayHint(window: BrowserWindow): void {
    window.webContents.send(GAME_EVENT_CHANNEL, { type: 'overlay-hint' });
}

export function setGameOverlayHostWindow(window: BrowserWindow): void {
    hostWindow = window;
    void getOrCreateOverlayWindow()
        .then((overlay) => {
            announceOverlayClosed(overlay);
        })
        .catch((error) => {
            console.warn('Game overlay preload failed.', error);
        });
}

export function closeGameOverlayWindowAfterGameEnd(): void {
    isOverlayOpen = false;
    clearOverlayHintHideTimer();
    destroyOverlayWindow();
}

export async function showGameOverlayHint(): Promise<void> {
    if (isOverlayOpen) {
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

export async function setGameOverlayWindowOpen(open: boolean): Promise<void> {
    if (isOverlayOpen === open) {
        return;
    }

    if (open) {
        try {
            isOverlayOpen = true;
            clearOverlayHintHideTimer();
            await pauseGameForOverlay();
            const window = await getOrCreateOverlayWindow();
            syncOverlayBounds();
            setOverlayWindowInteractive(window, true);
            window.setAlwaysOnTop(true, 'screen-saver');
            window.show();
            window.focus();
            window.webContents.focus();
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
    await resumeGameFromOverlay();
    hideOverlayWindow();
    const window = overlayWindow;
    if (window && !window.isDestroyed()) {
        setOverlayWindowInteractive(window, false);
        announceOverlayClosed(window);
    }
}

export async function toggleGameOverlayWindow(): Promise<void> {
    await setGameOverlayWindowOpen(!isOverlayOpen);
}
