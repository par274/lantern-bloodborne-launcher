import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron';

import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import {
    getLauncherBootstrapState,
    saveBloodborneInstallPath,
    validateBloodborneInstallPath
} from '../config/launcherConfig';
import { defineElectronCommand } from '../defineElectronCommand';
import { resetSplashStatusKey, setSplashStatusKey } from '../config/splashStatus';

export default defineElectronCommand(PLATFORM_COMMANDS.PICK_BLOODBORNE_DIRECTORY, async () => {
    setSplashStatusKey('splash.checkingSettings');
    const currentState = await getLauncherBootstrapState();
    const activeWindow = BrowserWindow.getFocusedWindow();
    const dialogOptions: OpenDialogOptions = {
        title: 'Select Bloodborne folder',
        buttonLabel: 'Select Folder',
        properties: ['openDirectory'],
        defaultPath: currentState.bloodborne.installPath ?? undefined
    };

    setSplashStatusKey('splash.selectingFolder');
    const result = activeWindow
        ? await dialog.showOpenDialog(activeWindow, dialogOptions)
        : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || result.filePaths.length === 0) {
        resetSplashStatusKey();
        return {
            canceled: true,
            bootstrapState: currentState,
            selection: null
        };
    }

    const selectedPath = result.filePaths[0];
    setSplashStatusKey('splash.validatingBloodbornePath');
    const selection = await validateBloodborneInstallPath(selectedPath);

    if (!selection.isValid) {
        resetSplashStatusKey();
        return {
            canceled: false,
            bootstrapState: currentState,
            selection
        };
    }

    setSplashStatusKey('splash.savingLauncherConfig');
    const bootstrapState = await saveBloodborneInstallPath(selectedPath);
    setSplashStatusKey('splash.validationReady');
    return {
        canceled: false,
        bootstrapState,
        selection: bootstrapState.bloodborne
    };
});
