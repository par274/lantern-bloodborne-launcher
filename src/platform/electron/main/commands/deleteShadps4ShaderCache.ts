import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { deleteShadps4ShaderCache } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.DELETE_SHADPS4_SHADER_CACHE, async () => {
    return deleteShadps4ShaderCache(await getLauncherBootstrapState());
});
