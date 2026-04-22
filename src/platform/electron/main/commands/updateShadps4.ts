import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { ensureLatestShadps4Configured } from '../config/shadps4';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.UPDATE_SHADPS4, async () => {
    await ensureLatestShadps4Configured();
    return getLauncherBootstrapState();
});
