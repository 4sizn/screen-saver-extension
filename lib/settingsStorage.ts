import { storage } from 'wxt/utils/storage';

/**
 * Display settings for screen saver rendering
 */
export interface DisplaySettings {
  imageFit: 'cover' | 'contain';
  backgroundColor: string; // Hex format: '#000000'
}

/**
 * Persistent display settings stored in chrome.storage.sync
 * Automatically syncs across devices and browser sessions
 */
export const displaySettings = storage.defineItem<DisplaySettings>(
  'sync:displaySettings',
  {
    fallback: {
      imageFit: 'cover',
      backgroundColor: '#000000',
    },
  }
);
