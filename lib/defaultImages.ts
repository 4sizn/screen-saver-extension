import { saveImage, initDB } from './imageStorage';
import { browser } from 'wxt/browser';

// TODO: Replace placeholder images with real Unsplash nature images
export const DEFAULT_IMAGES = [
  'images/defaults/nature-01.jpg',
  'images/defaults/nature-02.jpg',
  'images/defaults/nature-03.jpg',
  'images/defaults/nature-04.jpg',
  'images/defaults/nature-05.jpg',
  'images/defaults/nature-06.jpg',
  'images/defaults/nature-07.jpg',
  'images/defaults/nature-08.jpg',
  'images/defaults/nature-09.jpg',
  'images/defaults/nature-10.jpg',
  'images/defaults/nature-11.jpg',
  'images/defaults/nature-12.jpg',
  'images/defaults/nature-13.jpg',
  'images/defaults/nature-14.jpg',
  'images/defaults/nature-15.jpg',
];

/**
 * Load default images into IndexedDB on first install
 *
 * This function checks if the database is empty and only loads defaults
 * if no images exist. This ensures defaults are loaded exactly once on
 * first extension install.
 */
export async function loadDefaultImages(): Promise<void> {
  console.log('[loadDefaultImages] Function called');

  const db = await initDB();
  console.log('[loadDefaultImages] Database initialized:', db.name, 'version:', db.version);

  // Count existing images
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction('images', 'readonly');
    const store = tx.objectStore('images');
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  console.log('[loadDefaultImages] Current image count in DB:', count);

  // Only load if database is empty (first install)
  if (count > 0) {
    console.log('[loadDefaultImages] Default images already loaded, skipping');
    return;
  }

  console.log('[loadDefaultImages] Starting to load', DEFAULT_IMAGES.length, 'default images...');

  for (let i = 0; i < DEFAULT_IMAGES.length; i++) {
    const imagePath = DEFAULT_IMAGES[i];
    // Cast to any for browser.runtime.getURL - WXT's type system expects PublicPath
    // but our paths are dynamically generated strings
    const url = browser.runtime.getURL(imagePath as any);
    console.log(`[loadDefaultImages] Image ${i + 1}: path="${imagePath}" url="${url}"`);

    try {
      const response = await fetch(url);
      console.log(`[loadDefaultImages] Image ${i + 1}: fetch response status=${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log(`[loadDefaultImages] Image ${i + 1}: blob received, size=${blob.size} bytes, type=${blob.type}`);

      // Use predictable IDs for default images (default-1, default-2, etc.)
      await saveImage(
        `default-${i + 1}`,
        blob,
        `Default Nature ${i + 1}`,
        true // isDefault flag prevents deletion
      );

      console.log(`[loadDefaultImages] Image ${i + 1}/${DEFAULT_IMAGES.length} saved to IndexedDB`);
    } catch (error) {
      console.error(`[loadDefaultImages] Failed to load image ${i + 1}:`, error instanceof Error ? error.message : String(error), error);
    }
  }

  console.log('[loadDefaultImages] All default images loaded successfully');
}
