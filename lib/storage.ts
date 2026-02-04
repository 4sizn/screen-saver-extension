import { browser } from 'wxt/browser';

// Storage key for active tabs state
const STORAGE_KEY = 'activeTabs';

/**
 * Get activation state for a tab
 * Uses chrome.storage.session to persist state across service worker restarts
 */
export async function getActivationState(tabId: number): Promise<boolean> {
  try {
    const result = await browser.storage.session.get(STORAGE_KEY);
    const activeTabs: number[] = (result[STORAGE_KEY] as number[] | undefined) || [];
    return activeTabs.includes(tabId);
  } catch (error) {
    console.error('[storage] Error getting activation state:', error);
    return false;
  }
}

/**
 * Set activation state for a tab
 */
export async function setActivationState(tabId: number, active: boolean): Promise<void> {
  try {
    const result = await browser.storage.session.get(STORAGE_KEY);
    let activeTabs: number[] = (result[STORAGE_KEY] as number[] | undefined) || [];

    if (active) {
      if (!activeTabs.includes(tabId)) {
        activeTabs.push(tabId);
      }
    } else {
      activeTabs = activeTabs.filter(id => id !== tabId);
    }

    await browser.storage.session.set({ [STORAGE_KEY]: activeTabs });
  } catch (error) {
    console.error('[storage] Error setting activation state:', error);
  }
}

/**
 * Clear state for a closed tab
 */
export async function clearTabState(tabId: number): Promise<void> {
  await setActivationState(tabId, false);
}
