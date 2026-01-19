import { saveImage } from './imageStorage';
import { browser } from 'wxt/browser';

// TODO: Replace placeholder images with real Unsplash nature images
export const DEFAULT_IMAGES = [
  '/images/defaults/nature-01.jpg',
  '/images/defaults/nature-02.jpg',
  '/images/defaults/nature-03.jpg',
  '/images/defaults/nature-04.jpg',
  '/images/defaults/nature-05.jpg',
  '/images/defaults/nature-06.jpg',
  '/images/defaults/nature-07.jpg',
  '/images/defaults/nature-08.jpg',
  '/images/defaults/nature-09.jpg',
  '/images/defaults/nature-10.jpg',
  '/images/defaults/nature-11.jpg',
  '/images/defaults/nature-12.jpg',
  '/images/defaults/nature-13.jpg',
  '/images/defaults/nature-14.jpg',
  '/images/defaults/nature-15.jpg',
];

/**
 * Load default images into IndexedDB on first install
 * Only loads if database is empty (prevents duplicates)
 */
export async function loadDefaultImages() {
  const { openDB } = await import('idb');
  const db = await openDB('screen-saver-images', 1);
  const count = await db.count('images');

  // Only load if database is empty (first install)
  if (count > 0) {
    console.log('Default images already loaded, skipping');
    return;
  }

  console.log('Loading default images...');

  for (let i = 0; i < DEFAULT_IMAGES.length; i++) {
    const path = DEFAULT_IMAGES[i];
    const url = browser.runtime.getURL(path as any);

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      await saveImage(
        `default-${i + 1}`,
        blob,
        `Default Nature ${i + 1}`,
        true // isDefault flag - prevents deletion
      );

      console.log(`Loaded default image ${i + 1}/${DEFAULT_IMAGES.length}`);
    } catch (error) {
      console.error(`Failed to load default image ${i + 1}:`, error);
    }
  }

  console.log('Default images loaded successfully');
}
