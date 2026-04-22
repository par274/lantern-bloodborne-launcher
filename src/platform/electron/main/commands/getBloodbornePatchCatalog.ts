import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { readBloodbornePatchCatalog } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.GET_BLOODBORNE_PATCH_CATALOG, async () => {
    return readBloodbornePatchCatalog(await getLauncherBootstrapState());
});
