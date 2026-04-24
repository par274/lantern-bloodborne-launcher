import {
    createBloodborneCustomConfigDefaults,
    type DeepPartial,
    type Shadps4CustomConfig
} from './defaults';
import { PERFORMANCE_BLOODBORNE_CUSTOM_CONFIG_PRESET } from './performance';
import { QUALITY_BLOODBORNE_CUSTOM_CONFIG_PRESET } from './quality';
import { ULTRA_PERFORMANCE_BLOODBORNE_CUSTOM_CONFIG_PRESET } from './ultra-performance';
import { ULTRA_QUALITY_BLOODBORNE_CUSTOM_CONFIG_PRESET } from './ultra-quality';

export const SHADPS4_CUSTOM_CONFIG_PRESET_IDS = [
    'quality',
    'ultra-quality',
    'performance',
    'ultra-performance'
] as const;

export type Shadps4CustomConfigPresetId = (typeof SHADPS4_CUSTOM_CONFIG_PRESET_IDS)[number];

const SHADPS4_CUSTOM_CONFIG_PRESETS: Record<
    Shadps4CustomConfigPresetId,
    DeepPartial<Shadps4CustomConfig>
> = {
    quality: QUALITY_BLOODBORNE_CUSTOM_CONFIG_PRESET,
    'ultra-quality': ULTRA_QUALITY_BLOODBORNE_CUSTOM_CONFIG_PRESET,
    performance: PERFORMANCE_BLOODBORNE_CUSTOM_CONFIG_PRESET,
    'ultra-performance': ULTRA_PERFORMANCE_BLOODBORNE_CUSTOM_CONFIG_PRESET
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeRecordValues(baseValue: unknown, patchValue: unknown): unknown {
    if (!isRecord(baseValue) || !isRecord(patchValue)) {
        return structuredClone(patchValue);
    }

    const mergedRecord: Record<string, unknown> = {
        ...baseValue
    };

    for (const [entryKey, entryValue] of Object.entries(patchValue)) {
        if (entryValue === undefined) {
            continue;
        }

        mergedRecord[entryKey] = mergeRecordValues(mergedRecord[entryKey], entryValue);
    }

    return mergedRecord;
}

function mergeShadps4CustomConfig(
    baseConfig: Shadps4CustomConfig,
    ...patches: Array<DeepPartial<Shadps4CustomConfig> | null | undefined>
): Shadps4CustomConfig {
    let resolvedConfig = structuredClone(baseConfig);

    for (const patch of patches) {
        if (!patch) {
            continue;
        }

        resolvedConfig = mergeRecordValues(resolvedConfig, patch) as Shadps4CustomConfig;
    }

    return resolvedConfig;
}

export function resolveBloodborneCustomConfig(options?: {
    baseConfig?: DeepPartial<Shadps4CustomConfig> | null;
    presetId?: Shadps4CustomConfigPresetId | null;
    overrides?: DeepPartial<Shadps4CustomConfig> | null;
}): Shadps4CustomConfig {
    const presetId = options?.presetId ?? 'quality';
    const presetConfig = SHADPS4_CUSTOM_CONFIG_PRESETS[presetId];

    return mergeShadps4CustomConfig(
        createBloodborneCustomConfigDefaults(),
        options?.baseConfig ?? undefined,
        presetConfig,
        options?.overrides ?? undefined
    );
}
