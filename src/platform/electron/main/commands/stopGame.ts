import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { defineElectronCommand } from '../defineElectronCommand';
import { closeGameOverlayWindowAfterGameEnd } from '../gameOverlayWindow';
import { canUseHostCommandChannel, sendHostCommand } from '../hostCommandClient';

export default defineElectronCommand(PLATFORM_COMMANDS.STOP_GAME, async () => {
    if (!canUseHostCommandChannel()) {
        return;
    }

    await sendHostCommand('stop-game');
    closeGameOverlayWindowAfterGameEnd();
});
