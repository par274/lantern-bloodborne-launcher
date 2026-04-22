import type { AppPlatform, PlatformApi } from '$lib/contracts/platform';

import { platformApi as electronPlatformApi } from '../electron/renderer/api';
import { platformApi as mobilePlatformApi } from '../mobile/renderer/api';
import { platformApi as webPlatformApi } from '../web/renderer/api';

const platformApis: Record<AppPlatform, PlatformApi> = {
    electron: electronPlatformApi,
    mobile: mobilePlatformApi,
    web: webPlatformApi
};

export const currentPlatform = __APP_PLATFORM__;
export const platformApi = platformApis[currentPlatform];
