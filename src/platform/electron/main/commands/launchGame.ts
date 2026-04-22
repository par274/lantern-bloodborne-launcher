import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { BrowserWindow } from 'electron';

import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { defineElectronCommand } from '../defineElectronCommand';

let activeGameProcess: ChildProcess | null = null;

function getLauncherWindows(): BrowserWindow[] {
    return BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed());
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

function clearActiveGameProcess(processRef?: ChildProcess): void {
    if (processRef && activeGameProcess !== processRef) {
        return;
    }

    activeGameProcess = null;
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

export default defineElectronCommand(PLATFORM_COMMANDS.LAUNCH_GAME, async () => {
    if (activeGameProcess && activeGameProcess.exitCode === null && !activeGameProcess.killed) {
        return;
    }

    const bootstrapState = await getLauncherBootstrapState();
    const bloodbornePath = bootstrapState.bloodborne.titleId;
    const shadps4Path = bootstrapState.emulator.shadps4.executablePath;

    if (!bootstrapState.bloodborne.isValid || !bloodbornePath) {
        throw new Error('Bloodborne path is not ready for launch.');
    }

    if (!bootstrapState.emulator.shadps4.isAvailable || !shadps4Path) {
        throw new Error('shadPS4 is not ready for launch.');
    }

    const processRef = spawn(shadps4Path, [bloodbornePath], {
        cwd: path.dirname(shadps4Path),
        detached: false,
        stdio: 'ignore',
        windowsHide: false
    });
    activeGameProcess = processRef;

    processRef.once('exit', () => {
        clearActiveGameProcess(processRef);
        showLauncherWindows();
    });

    processRef.once('error', () => {
        clearActiveGameProcess(processRef);
        showLauncherWindows();
    });

    await waitForProcessSpawn(processRef);
    hideLauncherWindows();
});
