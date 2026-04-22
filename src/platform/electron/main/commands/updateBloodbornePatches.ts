import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { updateBloodbornePatchFile } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.UPDATE_BLOODBORNE_PATCHES, async () => {
    return updateBloodbornePatchFile(await getLauncherBootstrapState());
});
