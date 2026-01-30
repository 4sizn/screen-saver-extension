import { useState, useEffect } from 'react';
import { languageSettings } from './settingsStorage';
import { getTranslation, type Locale } from './translations';

/**
 * React hook for translation
 * Reads user's language preference from storage and provides translation function
 */
export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    // Load saved language preference
    languageSettings.getValue().then((settings) => {
      if (settings?.locale) {
        setLocale(settings.locale);
      }
    });

    // Listen for language changes
    const unwatch = languageSettings.watch((newSettings) => {
      if (newSettings?.locale) {
        setLocale(newSettings.locale);
      }
    });

    return unwatch;
  }, []);

  const t = (key: string): string => {
    return getTranslation(locale, key as any);
  };

  return { t, locale };
}
