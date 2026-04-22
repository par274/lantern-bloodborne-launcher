import { clipboard } from 'electron';

import { PLATFORM_COMMANDS } from '$lib/contracts/commands';

import { defineElectronCommand } from '../defineElectronCommand';

export default defineElectronCommand(PLATFORM_COMMANDS.READ_CLIPBOARD_TEXT, () => {
    return clipboard.readText();
});
