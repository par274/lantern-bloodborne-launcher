import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { defineElectronCommand } from '../defineElectronCommand';
import { canUseHostCommandChannel, sendHostCommand } from '../hostCommandClient';

export default defineElectronCommand(PLATFORM_COMMANDS.TOGGLE_GAME_PAUSE, async () => {
    if (!canUseHostCommandChannel()) {
        return;
    }

    await sendHostCommand('toggle-game-pause');
});
