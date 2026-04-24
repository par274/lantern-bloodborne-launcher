import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { syncBloodbornePatchEnablement } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.SYNC_BLOODBORNE_PATCH_ENABLEMENT, async () => {
    return syncBloodbornePatchEnablement(await getLauncherBootstrapState());
});
