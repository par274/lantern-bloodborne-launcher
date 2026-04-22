import type { DeepPartial, Shadps4CustomConfig } from './defaults';

export const QUALITY_BLOODBORNE_CUSTOM_CONFIG_PRESET: DeepPartial<Shadps4CustomConfig> = {
    GPU: {
        direct_memory_access_enabled: false,
        full_screen: true,
        full_screen_mode: 'Fullscreen (Borderless)',
        present_mode: 'Fifo',
        rcas_enabled: true,
        rcas_attenuation: 250,
        readbacks_mode: 0,
        vblank_frequency: 60,
        window_height: 2560,
        window_width: 1440
    },
    General: {
        extra_dmem_in_mbytes: 4096
    },
    Vulkan: {
        pipeline_cache_enabled: true
    }
};
