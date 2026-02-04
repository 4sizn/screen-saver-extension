import { browser } from 'wxt/browser';

/**
 * i18n utility for getting localized messages
 * Uses browser.i18n API to get messages from _locales
 */
export function getMessage(key: string, substitutions?: string | string[]): string {
  return browser.i18n.getMessage(key as any, substitutions as any) || key;
}

/**
 * Get the current UI locale
 */
export function getUILanguage(): string {
  return browser.i18n.getUILanguage();
}
