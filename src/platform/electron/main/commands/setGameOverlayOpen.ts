import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { defineElectronCommand } from '../defineElectronCommand';
import { setGameOverlayWindowOpen } from '../gameOverlayWindow';

export default defineElectronCommand(PLATFORM_COMMANDS.SET_GAME_OVERLAY_OPEN, async ({ open }) => {
    await setGameOverlayWindowOpen(open);
});
