export { type Language, type Translations } from './types';
export { id } from './id';
export { en } from './en';

import { Language, Translations } from './types';
import { id } from './id';
import { en } from './en';

const translations: Record<Language, Translations> = { id, en };

export function getTranslations(language: Language): Translations {
  return translations[language];
}

export function getDefaultLanguage(): Language {
  if (typeof window === 'undefined') return 'id';
  const stored = localStorage.getItem('fintrack-language');
  if (stored === 'id' || stored === 'en') return stored;
  return 'id';
}

export function saveLanguage(language: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fintrack-language', language);
  }
}
