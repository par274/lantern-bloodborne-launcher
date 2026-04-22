import app from '$platform/app';

import { createI18n } from './createI18n';
import translations, { type AppLocale, type TranslationKey } from '../translations/translations';

const fallbackLocale: AppLocale = 'tr';

export const { locale, locales, t, setLocale, translate } = createI18n({
	translations,
	defaultLocale: app.defaults.lang,
	fallbackLocale
});

export type LocaleOption = {
	value: AppLocale;
	title: string;
};

export const localeOptions: LocaleOption[] = locales.map((value) => ({
	value,
	title: translations[value].title || value
}));

export function getLocaleTitle(nextLocale: string): string {
	const matchedOption = localeOptions.find(({ value }) => value === nextLocale);
	return matchedOption?.title ?? nextLocale;
}

export type { AppLocale, TranslationKey };
