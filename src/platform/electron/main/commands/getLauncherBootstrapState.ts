import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.GET_LAUNCHER_BOOTSTRAP_STATE, async () => {
    return getLauncherBootstrapState();
});
