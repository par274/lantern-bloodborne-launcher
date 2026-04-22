import { app } from 'electron';

import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.APP_EXIT, async () => {
    app.quit();
    return;
});
