import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getLauncherBootstrapState } from '../config/launcherConfig';
import { saveShadps4GeneralSettings } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.SAVE_SHADPS4_GENERAL_SETTINGS, async (settings) => {
    return saveShadps4GeneralSettings(await getLauncherBootstrapState(), settings);
});
