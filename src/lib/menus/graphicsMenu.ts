import type { TranslationKey } from '$lib/translations/translations';

import type { MenuNode } from '$lib/components/AppMenu.svelte';

export type GraphicsPresetSelection = 'ultra-quality' | 'quality' | 'performance' | 'ultra-performance' | 'custom';
export type GraphicsReadbacksMode = 'disabled' | 'relaxed';
export type GraphicsResolutionOption = '1080p' | '1440p' | '2160p';
export type GraphicsExtraDmemOption = 2048 | 4096 | 8196 | 12288 | 16384;

export type GraphicsMenuState = {
	presetId: GraphicsPresetSelection;
	custom: {
		readbacksMode: GraphicsReadbacksMode;
		resolution: GraphicsResolutionOption;
		extraDmemInMegabytes: GraphicsExtraDmemOption;
		pipelineCacheEnabled: boolean;
	};
	directMemoryAccessEnabled: boolean;
};

type GraphicsMenuOptions = {
	state: GraphicsMenuState;
	selectPreset: (presetId: Exclude<GraphicsPresetSelection, 'custom'>) => void;
	applyCustomSetting: (update: () => void) => void;
};

export function createDefaultGraphicsMenuState(): GraphicsMenuState {
	return {
		presetId: 'quality',
		custom: {
			readbacksMode: 'relaxed',
			resolution: '1080p',
			extraDmemInMegabytes: 8196,
			pipelineCacheEnabled: true
		},
		directMemoryAccessEnabled: false
	};
}

export function resolveGraphicsPresetValueKey(state: GraphicsMenuState): TranslationKey {
	switch (state.presetId) {
		case 'ultra-quality':
			return 'menu.system.graphics.presets.ultraQuality';
		case 'quality':
			return 'menu.system.graphics.presets.quality';
		case 'performance':
			return 'menu.system.graphics.presets.performance';
		case 'ultra-performance':
			return 'menu.system.graphics.presets.ultraPerformance';
		case 'custom':
			return 'menu.system.graphics.custom';
	}

	return 'menu.system.graphics.presets.quality';
}

function resolveToggleValueKey(isEnabled: boolean): TranslationKey {
	return isEnabled ? 'menu.state.enabled' : 'menu.state.disabled';
}

function resolveReadbacksModeValueKey(mode: GraphicsReadbacksMode): TranslationKey {
	return mode === 'relaxed' ? 'menu.state.readbacks.relaxed' : 'menu.state.disabled';
}

function resolveResolutionValueKey(resolution: GraphicsResolutionOption): TranslationKey {
	switch (resolution) {
		case '1080p':
			return 'menu.state.resolution1080p';
		case '1440p':
			return 'menu.state.resolution1440p';
		case '2160p':
			return 'menu.state.resolution2160p';
	}

	return 'menu.state.resolution1080p';
}

function resolveExtraDmemValueKey(value: GraphicsExtraDmemOption): TranslationKey {
	switch (value) {
		case 2048:
			return 'menu.state.extraDmem2048';
		case 4096:
			return 'menu.state.extraDmem4096';
		case 8196:
			return 'menu.state.extraDmem8196';
		case 12288:
			return 'menu.state.extraDmem12288';
		case 16384:
			return 'menu.state.extraDmem16384';
	}

	return 'menu.state.extraDmem8196';
}

function resolvePresetActiveValueKey(state: GraphicsMenuState, presetId: GraphicsPresetSelection): TranslationKey | null {
	return state.presetId === presetId ? 'menu.state.active' : null;
}

function createBooleanDropdown(
	value: boolean,
	onChange: (value: boolean) => void | Promise<void>
): NonNullable<Extract<MenuNode, { dropdown: unknown }>['dropdown']> {
	return [
		{
			labelKey: 'menu.state.enabled',
			valueKey: value ? 'menu.state.active' : null,
			action: () => onChange(true)
		},
		{
			labelKey: 'menu.state.disabled',
			valueKey: !value ? 'menu.state.active' : null,
			action: () => onChange(false)
		}
	];
}

function resolveGraphicsPresetDescriptionKey(state: GraphicsMenuState): TranslationKey {
	switch (state.presetId) {
		case 'ultra-quality':
			return 'menu.description.graphics.presets.ultraQuality';
		case 'quality':
			return 'menu.description.graphics.presets.quality';
		case 'performance':
			return 'menu.description.graphics.presets.performance';
		case 'ultra-performance':
			return 'menu.description.graphics.presets.ultraPerformance';
		case 'custom':
			return 'menu.description.graphics.custom';
	}

	return 'menu.description.graphics.presets.quality';
}

export function createGraphicsMenuTree({ state, selectPreset, applyCustomSetting }: GraphicsMenuOptions): readonly MenuNode[] {
	return [
		{
			labelKey: 'menu.system.graphics.presets',
			descriptionKey: resolveGraphicsPresetDescriptionKey(state),
			valueKey: resolveGraphicsPresetValueKey(state),
			dropdown: [
				{
					labelKey: 'menu.system.graphics.presets.ultraQuality',
					valueKey: resolvePresetActiveValueKey(state, 'ultra-quality'),
					action: () => selectPreset('ultra-quality')
				},
				{
					labelKey: 'menu.system.graphics.presets.quality',
					valueKey: resolvePresetActiveValueKey(state, 'quality'),
					action: () => selectPreset('quality')
				},
				{
					labelKey: 'menu.system.graphics.presets.performance',
					valueKey: resolvePresetActiveValueKey(state, 'performance'),
					action: () => selectPreset('performance')
				},
				{
					labelKey: 'menu.system.graphics.presets.ultraPerformance',
					valueKey: resolvePresetActiveValueKey(state, 'ultra-performance'),
					action: () => selectPreset('ultra-performance')
				}
			]
		},
		{
			labelKey: 'menu.system.graphics.custom',
			descriptionKey: 'menu.description.graphics.custom',
			valueKey: resolvePresetActiveValueKey(state, 'custom'),
			sub: [
				{
					labelKey: 'menu.system.graphics.custom.readbacks',
					descriptionKey: 'menu.description.graphics.custom.readbacks',
					valueKey: resolveReadbacksModeValueKey(state.custom.readbacksMode),
					dropdown: [
						{
							labelKey: 'menu.state.readbacks.relaxed',
							valueKey: state.custom.readbacksMode === 'relaxed' ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.readbacksMode = 'relaxed';
								})
						},
						{
							labelKey: 'menu.state.disabled',
							valueKey: state.custom.readbacksMode === 'disabled' ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.readbacksMode = 'disabled';
								})
						}
					]
				},
				{
					labelKey: 'menu.system.graphics.custom.resolution',
					descriptionKey: 'menu.description.graphics.custom.resolution',
					valueKey: resolveResolutionValueKey(state.custom.resolution),
					dropdown: [
						{
							labelKey: 'menu.state.resolution1080p',
							valueKey: state.custom.resolution === '1080p' ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.resolution = '1080p';
								})
						},
						{
							labelKey: 'menu.state.resolution1440p',
							valueKey: state.custom.resolution === '1440p' ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.resolution = '1440p';
								})
						},
						{
							labelKey: 'menu.state.resolution2160p',
							valueKey: state.custom.resolution === '2160p' ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.resolution = '2160p';
								})
						}
					]
				},
				{
					labelKey: 'menu.system.graphics.custom.extraDmem',
					descriptionKey: 'menu.description.graphics.custom.extraDmem',
					valueKey: resolveExtraDmemValueKey(state.custom.extraDmemInMegabytes),
					dropdown: [
						{
							labelKey: 'menu.state.extraDmem2048',
							valueKey: state.custom.extraDmemInMegabytes === 2048 ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.extraDmemInMegabytes = 2048;
								})
						},
						{
							labelKey: 'menu.state.extraDmem4096',
							valueKey: state.custom.extraDmemInMegabytes === 4096 ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.extraDmemInMegabytes = 4096;
								})
						},
						{
							labelKey: 'menu.state.extraDmem8196',
							valueKey: state.custom.extraDmemInMegabytes === 8196 ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.extraDmemInMegabytes = 8196;
								})
						},
						{
							labelKey: 'menu.state.extraDmem12288',
							valueKey: state.custom.extraDmemInMegabytes === 12288 ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.extraDmemInMegabytes = 12288;
								})
						},
						{
							labelKey: 'menu.state.extraDmem16384',
							valueKey: state.custom.extraDmemInMegabytes === 16384 ? 'menu.state.active' : null,
							action: () =>
								applyCustomSetting(() => {
									state.custom.extraDmemInMegabytes = 16384;
								})
						}
					]
				},
				{
					labelKey: 'menu.system.graphics.custom.pipelineCache',
					descriptionKey: 'menu.description.graphics.custom.pipelineCache',
					valueKey: resolveToggleValueKey(state.custom.pipelineCacheEnabled),
					dropdown: createBooleanDropdown(state.custom.pipelineCacheEnabled, (value) =>
						applyCustomSetting(() => {
							state.custom.pipelineCacheEnabled = value;
						})
					)
				}
			]
		},
		{
			labelKey: 'menu.system.graphics.directMemoryAccess',
			descriptionKey: 'menu.description.graphics.directMemoryAccess',
			valueKey: resolveToggleValueKey(state.directMemoryAccessEnabled),
			dropdown: createBooleanDropdown(state.directMemoryAccessEnabled, (value) =>
				applyCustomSetting(() => {
					state.directMemoryAccessEnabled = value;
				})
			)
		}
	];
}
