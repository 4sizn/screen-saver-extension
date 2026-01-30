/**
 * i18n utility for getting localized messages
 * Uses chrome.i18n API to get messages from _locales
 */
export function getMessage(key: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

/**
 * Get the current UI locale
 */
export function getUILanguage(): string {
  return chrome.i18n.getUILanguage();
}
