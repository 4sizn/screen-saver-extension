/**
 * Translation system for options page
 * Loads messages.json files and provides translation based on user settings
 */

import enMessages from '@/public/_locales/en/messages.json';
import koMessages from '@/public/_locales/ko/messages.json';
import jaMessages from '@/public/_locales/ja/messages.json';
import deMessages from '@/public/_locales/de/messages.json';

export type Locale = 'en' | 'ko' | 'ja' | 'de';

type Messages = typeof enMessages;

const translations: Record<Locale, Messages> = {
  en: enMessages,
  ko: koMessages,
  ja: jaMessages,
  de: deMessages,
};

/**
 * Get translated message for a given locale
 */
export function getTranslation(locale: Locale, key: keyof Messages): string {
  const messages = translations[locale];
  const entry = messages[key];
  return entry?.message || key;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): Locale[] {
  return ['en', 'ko', 'ja', 'de'];
}
