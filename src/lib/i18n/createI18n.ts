import { derived, writable, type Readable, type Writable } from 'svelte/store';

type TranslationDictionary = Record<string, Record<string, string>>;
type TranslationVars = Record<string, string | number | boolean | null | undefined>;

type LocaleOf<T extends TranslationDictionary> = Extract<keyof T, string>;
type KeyOf<T extends TranslationDictionary> = Extract<keyof T[LocaleOf<T>], string>;

type TranslateFn<T extends TranslationDictionary> = (key: KeyOf<T>, vars?: TranslationVars) => string;

export interface I18nInstance<T extends TranslationDictionary> {
	locale: Writable<LocaleOf<T>>;
	locales: LocaleOf<T>[];
	t: Readable<TranslateFn<T>>;
	setLocale: (nextLocale: string) => void;
	translate: (locale: string, key: KeyOf<T>, vars?: TranslationVars) => string;
}

export interface CreateI18nOptions<T extends TranslationDictionary> {
	translations: T;
	defaultLocale: string;
	fallbackLocale?: LocaleOf<T>;
}

function replaceVariables(text: string, vars: TranslationVars = {}): string {
	let output = text;

	for (const [key, value] of Object.entries(vars)) {
		const regex = new RegExp(`{{${key}}}`, 'g');
		output = output.replace(regex, String(value ?? ''));
	}

	return output;
}

export function createI18n<const T extends TranslationDictionary>({
	translations,
	defaultLocale,
	fallbackLocale
}: CreateI18nOptions<T>): I18nInstance<T> {
	const locales = Object.keys(translations) as LocaleOf<T>[];

	if (locales.length === 0) {
		throw new Error('createI18n requires at least one locale.');
	}

	const resolvedFallbackLocale = fallbackLocale && locales.includes(fallbackLocale) ? fallbackLocale : locales[0];

	function resolveLocale(nextLocale: string): LocaleOf<T> {
		return locales.includes(nextLocale as LocaleOf<T>) ? (nextLocale as LocaleOf<T>) : resolvedFallbackLocale;
	}

	function translate(activeLocale: string, key: KeyOf<T>, vars: TranslationVars = {}): string {
		if (!key) {
			throw new Error('no key provided to $t()');
		}

		const locale = resolveLocale(activeLocale);
		const dictionary = translations[locale];

		if (!dictionary) {
			throw new Error(`no translations found for locale "${locale}"`);
		}

		const fallbackDictionary = translations[resolvedFallbackLocale];
		const text = dictionary[key] ?? fallbackDictionary?.[key];

		if (!text) {
			throw new Error(`no translation found for ${locale}.${key}`);
		}

		return replaceVariables(text, vars);
	}

	const locale = writable<LocaleOf<T>>(resolveLocale(defaultLocale));
	const t = derived(locale, ($locale) => (key: KeyOf<T>, vars: TranslationVars = {}) => translate($locale, key, vars));

	return {
		locale,
		locales,
		t,
		setLocale(nextLocale: string) {
			locale.set(resolveLocale(nextLocale));
		},
		translate
	};
}
