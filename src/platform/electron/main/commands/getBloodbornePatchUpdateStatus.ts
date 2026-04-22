import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getBloodbornePatchUpdateStatus } from '../config/shadps4UserData';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.GET_BLOODBORNE_PATCH_UPDATE_STATUS, () => {
    return getBloodbornePatchUpdateStatus();
});
