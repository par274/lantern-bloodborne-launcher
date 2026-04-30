import path from 'node:path';

import { app, BrowserWindow, ipcMain, shell } from 'electron';

import { PLATFORM_COMMANDS } from '../../lib/contracts/commands';

import appMeta from './config/app.meta';
import { getLauncherBootstrapState, readLauncherConfig, validateShadps4Install } from './main/config/launcherConfig';
import { ensureLatestShadps4Configured } from './main/config/shadps4';
import { ensureShadps4UserDataSynced } from './main/config/shadps4UserData';
import { resetSplashStatusKey, setSplashStatusKey } from './main/config/splashStatus';
import { canUseHostCommandChannel, sendHostCommand } from './main/hostCommandClient';
import { registerCommands } from './main/registerCommands';

const SPLASH_MIN_VISIBLE_MS = 450;
const RENDERER_READY_TIMEOUT_MS = 6000;

type SplashWindowMode = 'loading' | 'setup';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let splashShownAt = 0;
let mainWindowCreationPromise: Promise<BrowserWindow> | null = null;
let startupFlowPromise: Promise<void> | null = null;
let rendererReadyWebContentsId: number | null = null;
let resolveRendererSceneReady: (() => void) | null = null;

if (process.platform === 'win32') {
    app.setAppUserModelId(appMeta.appId);
}

process.on('message', (message) => {
    if (message !== 'electron-vite&type=hot-reload') {
        return;
    }

    for (const window of BrowserWindow.getAllWindows()) {
        if (!window.isDestroyed()) {
            window.webContents.reload();
        }
    }
});

function createRendererSceneReadyPromise(window: BrowserWindow): Promise<void> {
    rendererReadyWebContentsId = window.webContents.id;

    return new Promise<void>((resolve) => {
        resolveRendererSceneReady = resolve;
    });
}

async function canStartPackagedElectronApp(): Promise<boolean> {
    if (!app.isPackaged) {
        return true;
    }

    if (!canUseHostCommandChannel()) {
        return false;
    }

    try {
        await sendHostCommand('ping');
        return true;
    } catch (error) {
        console.error('LanternLauncher host channel validation failed.', error);
        return false;
    }
}

function clearRendererSceneReadyState(webContentsId?: number): void {
    if (webContentsId !== undefined && webContentsId !== rendererReadyWebContentsId) {
        return;
    }

    rendererReadyWebContentsId = null;
    resolveRendererSceneReady = null;
}

function markRendererSceneReady(webContentsId: number): void {
    if (webContentsId !== rendererReadyWebContentsId) {
        return;
    }

    const resolve = resolveRendererSceneReady;
    clearRendererSceneReadyState(webContentsId);
    resolve?.();
}

function isIgnorableNavigationError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const message = error.message.toLowerCase();
    return message.includes('err_aborted') || message.includes('object has been destroyed');
}

async function safelyLoadWindow(loadOperation: Promise<unknown>): Promise<void> {
    try {
        await loadOperation;
    } catch (error) {
        if (isIgnorableNavigationError(error)) {
            return;
        }

        throw error;
    }
}

function resolveBuiltRendererRootPath(): string {
    return path.join(app.getAppPath(), '.build', 'svelte', 'static');
}

function resolveSplashFilePath(): string {
    return path.join(resolveBuiltRendererRootPath(), 'splash', 'index.html');
}

function resolveSplashLoadingFilePath(): string {
    return path.join(resolveBuiltRendererRootPath(), 'splash-loading', 'index.html');
}

function resolveWindowIconPath(): string | undefined {
    if (app.isPackaged) {
        return undefined;
    }

    const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    return path.join(app.getAppPath(), 'build', iconFile);
}

function resolvePreloadPath(): string {
    return path.join(app.getAppPath(), '.build', 'dist', 'electron', 'preload.js');
}

function createSplashWindow(mode: SplashWindowMode): BrowserWindow {
    splashShownAt = Date.now();

    const window = new BrowserWindow({
        width: mode === 'loading' ? 460 : 760,
        height: mode === 'loading' ? 280 : 640,
        minWidth: mode === 'loading' ? 460 : 680,
        minHeight: mode === 'loading' ? 280 : 560,
        show: false,
        frame: mode === 'setup',
        resizable: mode === 'setup',
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        title: appMeta.title,
        autoHideMenuBar: true,
        backgroundColor: '#040404',
        center: true,
        alwaysOnTop: mode === 'loading',
        skipTaskbar: mode === 'loading',
        icon: resolveWindowIconPath(),
        webPreferences: {
            preload: resolvePreloadPath(),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    window.removeMenu();
    window.once('ready-to-show', () => {
        window.show();
    });

    window.once('closed', () => {
        if (splashWindow === window) {
            splashWindow = null;
        }
    });

    void loadSplashWindowContent(window, mode).catch((error) => {
        console.error('Splash window failed to load.', error);
    });

    return window;
}

function loadMainWindowContent(window: BrowserWindow): Promise<void> {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;

    if (devServerUrl) {
        return safelyLoadWindow(window.loadURL(devServerUrl));
    }

    return safelyLoadWindow(window.loadFile(path.join(resolveBuiltRendererRootPath(), 'index.html')));
}

function loadSplashWindowContent(window: BrowserWindow, mode: SplashWindowMode): Promise<void> {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    const splashUrlPath = mode === 'loading' ? '/splash-loading/' : '/splash/';

    if (devServerUrl) {
        return safelyLoadWindow(window.loadURL(new URL(splashUrlPath, devServerUrl).toString()));
    }

    return safelyLoadWindow(
        window.loadFile(mode === 'loading' ? resolveSplashLoadingFilePath() : resolveSplashFilePath())
    );
}

async function createMainWindow(): Promise<BrowserWindow> {
    const currentSplashWindow = splashWindow;
    let isCurrentMainWindowClosed = false;
    let isCurrentSplashWindowClosed = !currentSplashWindow || currentSplashWindow.isDestroyed();
    let revealTimer: ReturnType<typeof setTimeout> | null = null;

    const currentMainWindow = new BrowserWindow({
        show: false,
        frame: false,
        fullscreen: true,
        transparent: true,
        thickFrame: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: appMeta.title,
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        icon: resolveWindowIconPath(),
        webPreferences: {
            preload: resolvePreloadPath(),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    const currentMainWindowWebContentsId = currentMainWindow.webContents.id;

    const rendererSceneReady = createRendererSceneReadyPromise(currentMainWindow);

    let didRevealMainWindow = false;
    const revealMainWindow = () => {
        if (didRevealMainWindow) {
            return;
        }

        didRevealMainWindow = true;

        const remainingDelay = currentSplashWindow ? Math.max(0, SPLASH_MIN_VISIBLE_MS - (Date.now() - splashShownAt)) : 0;
        revealTimer = setTimeout(() => {
            revealTimer = null;

            if (isCurrentMainWindowClosed) {
                return;
            }

            currentMainWindow.show();
            currentMainWindow.focus();

            if (currentSplashWindow && !isCurrentSplashWindowClosed) {
                currentSplashWindow.close();
            }
        }, remainingDelay);
    };

    const rendererReadyTimeout = setTimeout(() => {
        clearRendererSceneReadyState(currentMainWindowWebContentsId);
        revealMainWindow();
    }, RENDERER_READY_TIMEOUT_MS);

    void rendererSceneReady.then(() => {
        clearTimeout(rendererReadyTimeout);
        revealMainWindow();
    });

    currentMainWindow.webContents.once('did-fail-load', () => {
        clearTimeout(rendererReadyTimeout);
        clearRendererSceneReadyState(currentMainWindowWebContentsId);
        revealMainWindow();
    });

    currentMainWindow.once('closed', () => {
        isCurrentMainWindowClosed = true;
        clearTimeout(rendererReadyTimeout);

        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }

        clearRendererSceneReadyState(currentMainWindowWebContentsId);

        if (mainWindow === currentMainWindow) {
            mainWindow = null;
        }

        if (currentSplashWindow && !isCurrentSplashWindowClosed) {
            currentSplashWindow.close();
        }
    });

    currentSplashWindow?.once('closed', () => {
        isCurrentSplashWindowClosed = true;
    });

    mainWindow = currentMainWindow;

    currentMainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    await loadMainWindowContent(currentMainWindow);
    return currentMainWindow;
}

async function openStartupFlow(): Promise<void> {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        return;
    }

    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.focus();
        return;
    }

    resetSplashStatusKey();
    setSplashStatusKey('splash.checkingSettings');

    const initialConfig = await readLauncherConfig();
    const shouldStartWithLoadingSplash = !!initialConfig.games.bloodborne.installPath;
    splashWindow = createSplashWindow(shouldStartWithLoadingSplash ? 'loading' : 'setup');

    const bootstrapState = await getLauncherBootstrapState();
    if (!bootstrapState.bloodborne.isValid) {
        if (shouldStartWithLoadingSplash) {
            splashWindow?.close();
            splashWindow = createSplashWindow('setup');
        }

        return;
    }

    await ensureShadps4UserDataSynced(bootstrapState);
    setSplashStatusKey('splash.checkingShadps4Availability');
    await validateShadps4Install(bootstrapState.config.emulator.shadps4);
    setSplashStatusKey('splash.openingMainMenu');
    await launchMainWindow();
}

function ensureStartupFlow(): void {
    if (startupFlowPromise) {
        return;
    }

    startupFlowPromise = openStartupFlow()
        .catch((error) => {
            setSplashStatusKey('splash.unexpectedError');
            console.error('Startup flow could not be opened.', error);
        })
        .finally(() => {
            startupFlowPromise = null;
        });
}

async function launchMainWindow(): Promise<void> {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        return;
    }

    if (mainWindowCreationPromise) {
        await mainWindowCreationPromise;
        return;
    }

    mainWindowCreationPromise = createMainWindow();

    try {
        await mainWindowCreationPromise;
    } finally {
        mainWindowCreationPromise = null;
    }
}

app.whenReady()
    .then(async () => {
        if (!(await canStartPackagedElectronApp())) {
            console.error('LanternLauncher Electron app must be started from the native host.');
            app.quit();
            return;
        }

        registerCommands();

        ipcMain.handle(PLATFORM_COMMANDS.RENDERER_SCENE_READY, (event) => {
            markRendererSceneReady(event.sender.id);
        });

        ipcMain.handle(PLATFORM_COMMANDS.COMPLETE_SPLASH_BOOTSTRAP, async () => {
            resetSplashStatusKey();
            let bootstrapState = await getLauncherBootstrapState();
            if (!bootstrapState.bloodborne.isValid) {
                throw new Error('Main menu cannot be opened before Bloodborne is configured.');
            }

            await ensureLatestShadps4Configured();
            bootstrapState = await getLauncherBootstrapState();
            await ensureShadps4UserDataSynced(bootstrapState);
            setSplashStatusKey('splash.openingMainMenu');
            await launchMainWindow();
        });

        ensureStartupFlow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                ensureStartupFlow();
            } else if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.focus();
            } else if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.focus();
            } else {
                ensureStartupFlow();
            }
        });
    })
    .catch((error) => {
        console.error('Electron main process failed to initialize.', error);
        app.quit();
    });

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
