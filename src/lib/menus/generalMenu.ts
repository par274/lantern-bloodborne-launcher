import type { Shadps4GeneralSettings } from '$lib/contracts/commands';
import type { TranslationKey } from '$lib/translations/translations';

import type { MenuNode } from '$lib/components/AppMenu.svelte';

type GeneralSettingsUpdate = Partial<Shadps4GeneralSettings>;

type GeneralMenuOptions = {
	settings: Shadps4GeneralSettings;
	trophyKeyInputValue: string;
	applySettings: (update: GeneralSettingsUpdate) => void | Promise<void>;
	setTrophyKeyInputValue: (value: string) => void | Promise<void>;
	submitTrophyKey: () => void | Promise<void>;
	requestShaderCacheDelete: () => void | Promise<void>;
	shaderCacheDeleteProgress?: number | null;
	shaderCacheDeleteStatusKey?: TranslationKey | null;
};

const CONSOLE_LANGUAGE_OPTIONS = [
	{ value: 0, labelKey: 'menu.state.consoleLanguage.japanese' },
	{ value: 1, labelKey: 'menu.state.consoleLanguage.englishUs' },
	{ value: 2, labelKey: 'menu.state.consoleLanguage.french' },
	{ value: 3, labelKey: 'menu.state.consoleLanguage.spanish' },
	{ value: 4, labelKey: 'menu.state.consoleLanguage.german' },
	{ value: 5, labelKey: 'menu.state.consoleLanguage.italian' },
	{ value: 6, labelKey: 'menu.state.consoleLanguage.dutch' },
	{ value: 7, labelKey: 'menu.state.consoleLanguage.portuguesePt' },
	{ value: 8, labelKey: 'menu.state.consoleLanguage.russian' },
	{ value: 9, labelKey: 'menu.state.consoleLanguage.korean' },
	{ value: 10, labelKey: 'menu.state.consoleLanguage.chineseTraditional' },
	{ value: 11, labelKey: 'menu.state.consoleLanguage.chineseSimplified' },
	{ value: 12, labelKey: 'menu.state.consoleLanguage.finnish' },
	{ value: 13, labelKey: 'menu.state.consoleLanguage.swedish' },
	{ value: 14, labelKey: 'menu.state.consoleLanguage.danish' },
	{ value: 15, labelKey: 'menu.state.consoleLanguage.norwegian' },
	{ value: 16, labelKey: 'menu.state.consoleLanguage.polish' },
	{ value: 17, labelKey: 'menu.state.consoleLanguage.portugueseBr' },
	{ value: 18, labelKey: 'menu.state.consoleLanguage.englishGb' },
	{ value: 19, labelKey: 'menu.state.consoleLanguage.turkish' },
	{ value: 20, labelKey: 'menu.state.consoleLanguage.spanishLa' },
	{ value: 21, labelKey: 'menu.state.consoleLanguage.arabic' },
	{ value: 22, labelKey: 'menu.state.consoleLanguage.frenchCa' },
	{ value: 23, labelKey: 'menu.state.consoleLanguage.czech' },
	{ value: 24, labelKey: 'menu.state.consoleLanguage.hungarian' },
	{ value: 25, labelKey: 'menu.state.consoleLanguage.greek' },
	{ value: 26, labelKey: 'menu.state.consoleLanguage.romanian' },
	{ value: 27, labelKey: 'menu.state.consoleLanguage.thai' },
	{ value: 28, labelKey: 'menu.state.consoleLanguage.vietnamese' },
	{ value: 29, labelKey: 'menu.state.consoleLanguage.indonesian' },
	{ value: 30, labelKey: 'menu.state.consoleLanguage.ukrainian' }
] as const satisfies ReadonlyArray<{ value: number; labelKey: TranslationKey }>;
const TROPHY_DURATION_OPTIONS = [6, 1000, 3000, 5000, 6000, 8000, 10000] as const;
const TROPHY_SIDE_OPTIONS = [
	{ value: 'right', labelKey: 'menu.state.trophySide.right' },
	{ value: 'left', labelKey: 'menu.state.trophySide.left' },
	{ value: 'top-left', labelKey: 'menu.state.trophySide.topLeft' },
	{ value: 'top-right', labelKey: 'menu.state.trophySide.topRight' },
	{ value: 'bottom-left', labelKey: 'menu.state.trophySide.bottomLeft' },
	{ value: 'bottom-right', labelKey: 'menu.state.trophySide.bottomRight' }
] as const satisfies ReadonlyArray<{ value: string; labelKey: TranslationKey }>;

export function createDefaultGeneralSettings(): Shadps4GeneralSettings {
	return {
		consoleLanguage: 19,
		discordRpcEnabled: true,
		trophyNotificationDuration: 6,
		trophyNotificationSide: 'right',
		trophyPopupDisabled: false,
		volumeSlider: 100,
		releaseTrophyKey: ''
	};
}

function resolveToggleValueKey(isEnabled: boolean): TranslationKey {
	return isEnabled ? 'menu.state.enabled' : 'menu.state.disabled';
}

function resolveTrophySideValueKey(side: string): TranslationKey | null {
	return TROPHY_SIDE_OPTIONS.find((option) => option.value === side)?.labelKey ?? null;
}

function resolveConsoleLanguageValueKey(languageId: number): TranslationKey | null {
	return CONSOLE_LANGUAGE_OPTIONS.find((option) => option.value === languageId)?.labelKey ?? null;
}

function createBooleanSubmenu(
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

function createNumberOptions(
	values: readonly number[],
	currentValue: number,
	formatLabel: (value: number) => string,
	onChange: (value: number) => void | Promise<void>
): NonNullable<Extract<MenuNode, { dropdown: unknown }>['dropdown']> {
	const options = [...new Set([currentValue, ...values])];

	return options.map((value) => ({
		labelText: formatLabel(value),
		valueKey: value === currentValue ? 'menu.state.active' : null,
		action: () => onChange(value)
	}));
}

export function createGeneralMenuTree({
	settings,
	trophyKeyInputValue,
	applySettings,
	setTrophyKeyInputValue,
	submitTrophyKey,
	requestShaderCacheDelete,
	shaderCacheDeleteProgress = null,
	shaderCacheDeleteStatusKey = null
}: GeneralMenuOptions): readonly MenuNode[] {
	return [
		{
			labelKey: 'menu.system.general.consoleLanguage',
			descriptionKey: 'generalSettings.consoleLanguage.description',
			valueKey: resolveConsoleLanguageValueKey(settings.consoleLanguage),
			valueText: resolveConsoleLanguageValueKey(settings.consoleLanguage) ? null : String(settings.consoleLanguage),
			dropdown: CONSOLE_LANGUAGE_OPTIONS.map((option) => ({
				labelKey: option.labelKey,
				valueKey: settings.consoleLanguage === option.value ? 'menu.state.active' : null,
				valueText: String(option.value),
				action: () => applySettings({ consoleLanguage: option.value })
			}))
		},
		{
			labelKey: 'menu.system.general.discordRpc',
			descriptionKey: 'generalSettings.discord.description',
			valueKey: resolveToggleValueKey(settings.discordRpcEnabled),
			dropdown: createBooleanSubmenu(settings.discordRpcEnabled, (value) => applySettings({ discordRpcEnabled: value }))
		},
		{
			labelKey: 'menu.system.general.trophyKey',
			descriptionKey: 'generalSettings.trophy.key.description',
			valueKey: settings.releaseTrophyKey ? 'menu.state.configured' : 'menu.state.notConfigured',
			inputDropdown: {
				value: trophyKeyInputValue,
				placeholderKey: 'generalSettings.trophy.key.placeholder',
				onInput: setTrophyKeyInputValue,
				onSubmit: submitTrophyKey
			}
		},
		{
			labelKey: 'menu.system.general.trophyPopupDisabled',
			descriptionKey: 'generalSettings.trophy.disablePopup.description',
			valueKey: resolveToggleValueKey(settings.trophyPopupDisabled),
			dropdown: createBooleanSubmenu(settings.trophyPopupDisabled, (value) => applySettings({ trophyPopupDisabled: value }))
		},
		{
			labelKey: 'menu.system.general.trophyPopupSide',
			descriptionKey: 'generalSettings.trophy.side.description',
			valueKey: resolveTrophySideValueKey(settings.trophyNotificationSide),
			dropdown: TROPHY_SIDE_OPTIONS.map((option) => ({
				labelKey: option.labelKey,
				valueKey: settings.trophyNotificationSide === option.value ? 'menu.state.active' : null,
				action: () => applySettings({ trophyNotificationSide: option.value })
			}))
		},
		{
			labelKey: 'menu.system.general.trophyPopupDuration',
			descriptionKey: 'generalSettings.trophy.duration.description',
			valueText: `${settings.trophyNotificationDuration} ms`,
			dropdown: createNumberOptions(
				TROPHY_DURATION_OPTIONS,
				settings.trophyNotificationDuration,
				(value) => `${value} ms`,
				(value) => applySettings({ trophyNotificationDuration: value })
			)
		},
		{
			labelKey: 'menu.system.general.volume',
			descriptionKey: 'generalSettings.volume.description',
			valueText: `${settings.volumeSlider}%`,
			rangeDropdown: {
				value: settings.volumeSlider,
				min: 0,
				max: 200,
				step: 1,
				unit: '%',
				onChange: (value) => applySettings({ volumeSlider: value })
			}
		},
		{
			labelKey: 'menu.system.general.deleteShaderCache',
			descriptionKey: 'generalSettings.shaderCache.description',
			valueKey: shaderCacheDeleteStatusKey,
			progress:
				shaderCacheDeleteProgress === null
					? null
					: {
						value: shaderCacheDeleteProgress,
						labelKey: shaderCacheDeleteStatusKey
					},
			action: requestShaderCacheDelete
		}
	];
}
