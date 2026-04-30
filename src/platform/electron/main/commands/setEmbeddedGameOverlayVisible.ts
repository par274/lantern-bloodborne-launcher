import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { defineElectronCommand } from '../defineElectronCommand';
import { canUseHostCommandChannel, sendHostCommand } from '../hostCommandClient';

export default defineElectronCommand(PLATFORM_COMMANDS.SET_EMBEDDED_GAME_OVERLAY_VISIBLE, async ({ visible }) => {
    if (!canUseHostCommandChannel()) {
        return;
    }

    await sendHostCommand('set-game-overlay-visible', [visible ? 'true' : 'false']);
});
