import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { saveBloodbornePatchEnablement } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.SAVE_BLOODBORNE_PATCH_ENABLEMENT, async (state) => {
    return saveBloodbornePatchEnablement(await getLauncherBootstrapState(), state);
});
