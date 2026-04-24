import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { readShadps4UpdateChangelog } from '../config/shadps4';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.GET_SHADPS4_UPDATE_CHANGELOG, async () => {
    return readShadps4UpdateChangelog();
});
