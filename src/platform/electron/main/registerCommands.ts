import { ipcMain } from 'electron';

import type { ElectronCommandHandler } from './defineElectronCommand';

type CommandModule = {
    default?: ElectronCommandHandler;
};

const commandModules = import.meta.glob('./commands/*.ts', {
    eager: true
}) as Record<string, CommandModule>;

let commandsRegistered = false;

export function registerCommands(): void {
    if (commandsRegistered) {
        return;
    }

    commandsRegistered = true;

    const registeredCommands = new Set<string>();

    for (const [modulePath, module] of Object.entries(commandModules)) {
        const commandDefinition = module.default;

        if (!commandDefinition) {
            throw new Error(`Default command export was not found in ${modulePath}.`);
        }

        if (registeredCommands.has(commandDefinition.command)) {
            throw new Error(`Electron command "${commandDefinition.command}" is registered more than once.`);
        }

        registeredCommands.add(commandDefinition.command);

        ipcMain.handle(commandDefinition.command, async (_event, payload) => {
            return commandDefinition.handle(payload as never);
        });
    }
}
