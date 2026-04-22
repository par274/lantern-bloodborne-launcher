export interface Shadps4CustomConfig {
    Audio: {
        audio_backend: number;
        openal_main_output_device: string;
        openal_mic_device: string;
        openal_padSpk_output_device: string;
        sdl_main_output_device: string;
        sdl_mic_device: string;
        sdl_padSpk_output_device: string;
    };
    Debug: {
        debug_dump: boolean;
        log_enabled: boolean;
        separate_logging_enabled: boolean;
        shader_collect: boolean;
    };
    GPU: {
        copy_gpu_buffers: boolean;
        direct_memory_access_enabled: boolean;
        dump_shaders: boolean;
        fsr_enabled: boolean;
        full_screen: boolean;
        full_screen_mode: string;
        hdr_allowed: boolean;
        null_gpu: boolean;
        patch_shaders: boolean;
        present_mode: string;
        rcas_attenuation: number;
        rcas_enabled: boolean;
        readback_linear_images_enabled: boolean;
        readbacks_mode: number;
        vblank_frequency: number;
        window_height: number;
        window_width: number;
    };
    General: {
        connected_to_network: boolean;
        dev_kit_mode: boolean;
        discord_rpc_enabled: boolean,
        extra_dmem_in_mbytes: number;
        identical_log_grouped: boolean;
        log_filter: string;
        log_type: string;
        neo_mode: boolean;
        psn_signed_in: boolean;
        show_splash: boolean;
        trophy_notification_duration: number;
        trophy_notification_side: string;
        trophy_popup_disabled: boolean;
        volume_slider: number;
    };
    Input: {
        background_controller_input: boolean;
        camera_id: number;
        cursor_hide_timeout: number;
        cursor_state: number;
        motion_controls_enabled: boolean;
        usb_device_backend: number;
    };
    Vulkan: {
        gpu_id: number;
        pipeline_cache_archived: boolean;
        pipeline_cache_enabled: boolean;
        renderdoc_enabled: boolean;
        vkcrash_diagnostic_enabled: boolean;
        vkguest_markers: boolean;
        vkhost_markers: boolean;
        vkvalidation_core_enabled: boolean;
        vkvalidation_enabled: boolean;
        vkvalidation_gpu_enabled: boolean;
        vkvalidation_sync_enabled: boolean;
    };
}

export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const BLOODBORNE_CUSTOM_CONFIG_DEFAULTS: Shadps4CustomConfig = {
    Audio: {
        audio_backend: 0,
        openal_main_output_device: 'Default Device',
        openal_mic_device: 'Default Device',
        openal_padSpk_output_device: 'Default Device',
        sdl_main_output_device: 'Default Device',
        sdl_mic_device: 'Default Device',
        sdl_padSpk_output_device: 'Default Device'
    },
    Debug: {
        debug_dump: false,
        log_enabled: true,
        separate_logging_enabled: false,
        shader_collect: false
    },
    GPU: {
        copy_gpu_buffers: false,
        direct_memory_access_enabled: false,
        dump_shaders: false,
        fsr_enabled: false,
        full_screen: true,
        full_screen_mode: 'Fullscreen (Borderless)',
        hdr_allowed: false,
        null_gpu: false,
        patch_shaders: false,
        present_mode: 'Fifo',
        rcas_attenuation: 250,
        rcas_enabled: true,
        readback_linear_images_enabled: false,
        readbacks_mode: 0,
        vblank_frequency: 60,
        window_height: 1080,
        window_width: 1920
    },
    General: {
        connected_to_network: false,
        dev_kit_mode: false,
        discord_rpc_enabled: true,
        extra_dmem_in_mbytes: 8196,
        identical_log_grouped: true,
        log_filter: '',
        log_type: 'sync',
        neo_mode: false,
        psn_signed_in: false,
        show_splash: true,
        trophy_notification_duration: 6.0,
        trophy_notification_side: 'right',
        trophy_popup_disabled: false,
        volume_slider: 100
    },
    Input: {
        background_controller_input: false,
        camera_id: -1,
        cursor_hide_timeout: 1,
        cursor_state: 1,
        motion_controls_enabled: true,
        usb_device_backend: 0
    },
    Vulkan: {
        gpu_id: -1,
        pipeline_cache_archived: false,
        pipeline_cache_enabled: true,
        renderdoc_enabled: false,
        vkcrash_diagnostic_enabled: false,
        vkguest_markers: false,
        vkhost_markers: false,
        vkvalidation_core_enabled: true,
        vkvalidation_enabled: false,
        vkvalidation_gpu_enabled: false,
        vkvalidation_sync_enabled: false
    }
};

export function createBloodborneCustomConfigDefaults(): Shadps4CustomConfig {
    return structuredClone(BLOODBORNE_CUSTOM_CONFIG_DEFAULTS);
}
