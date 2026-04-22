import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { getSplashStatusSnapshot } from '../config/splashStatus';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.GET_SPLASH_STATUS, () => {
    return getSplashStatusSnapshot();
});
