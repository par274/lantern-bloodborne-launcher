import type { PlatformCommand, PlatformCommandPayload, PlatformCommandResult } from '$lib/contracts/commands';

export type ElectronGameEvent =
    | {
            type: 'overlay-opened';
            inputMode?: 'xbox' | 'dualsense';
      }
    | {
            type: 'overlay-closed';
      }
    | {
            type: 'overlay-hint';
      }
    | {
            type: 'session-ended';
            exitCode: number | null;
      };

export interface ElectronRendererBridge {
    invoke: <T extends PlatformCommand>(
        command: T,
        payload: PlatformCommandPayload<T>
    ) => Promise<PlatformCommandResult<T>>;
    onGameEvent: (handler: (event: ElectronGameEvent) => void) => () => void;
}
