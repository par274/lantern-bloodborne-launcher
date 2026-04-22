import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { saveLauncherLocale } from '../config/launcherConfig';
import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.SAVE_LAUNCHER_LOCALE, async ({ locale }) => {
    return saveLauncherLocale(locale);
});
