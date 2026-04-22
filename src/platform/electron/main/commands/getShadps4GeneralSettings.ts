import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { readShadps4GeneralSettings } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.GET_SHADPS4_GENERAL_SETTINGS, async () => {
    return readShadps4GeneralSettings(await getLauncherBootstrapState());
});
