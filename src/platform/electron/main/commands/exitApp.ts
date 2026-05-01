import { app } from 'electron';

import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { defineElectronCommand } from '../defineElectronCommand';
import { suspendGameOverlayWindow } from '../gameOverlayWindow';
import { canUseHostCommandChannel, sendHostCommand } from '../hostCommandClient';

export default defineElectronCommand(PLATFORM_COMMANDS.APP_EXIT, async () => {
    suspendGameOverlayWindow();

    if (canUseHostCommandChannel()) {
        await sendHostCommand('exit-host-after-game').catch((error) => {
            console.warn('Lantern host shutdown request failed.', error);
        });
    }

    app.quit();
    return;
});
