import { en } from './en';
import { tr } from './tr';

const translations = {
    tr,
    en
} as const satisfies Record<string, typeof tr>;

export type AppLocale = keyof typeof translations;
export type TranslationKey = keyof typeof tr;

export default translations;
