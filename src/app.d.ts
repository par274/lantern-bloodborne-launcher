import type { AppPlatform } from '$lib/contracts/platform';
import type { ElectronRendererBridge } from './platform/electron/renderer/bridge';

declare global {
    const __APP_PLATFORM__: AppPlatform;

    namespace App {
    }

    interface Window {
        electronAPI?: ElectronRendererBridge;
    }
}

export {};
