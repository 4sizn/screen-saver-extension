import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface ImageRecord {
  id: string; // UUID
  blob: Blob; // Image binary data
  name: string; // Original filename
  uploadedAt: number; // Timestamp
  order: number; // Display order (0-based)
  isDefault: boolean; // True for bundled defaults
}

// IndexedDB schema definition
interface ScreenSaverDB extends DBSchema {
  images: {
    key: string;
    value: ImageRecord;
    indexes: { order: number; isDefault: number };
  };
}

const DB_NAME = 'screen-saver-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// Singleton database promise to avoid multiple connections
let dbPromise: Promise<IDBPDatabase<ScreenSaverDB>> | null = null;

/**
 * Initialize and open the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<ScreenSaverDB>> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = openDB<ScreenSaverDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object store with keyPath 'id'
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

      // Create indexes for sorting and filtering
      store.createIndex('order', 'order', { unique: false });
      store.createIndex('isDefault', 'isDefault', { unique: false });
    },
  });

  return dbPromise;
}

/**
 * Save an image to IndexedDB
 * @param id - Unique identifier (UUID)
 * @param blob - Image binary data
 * @param name - Original filename
 * @param isDefault - True for bundled default images
 */
export async function saveImage(
  id: string,
  blob: Blob,
  name: string,
  isDefault = false
): Promise<void> {
  const db = await initDB();

  // Get current max order value
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const allImages = await store.getAll();
  await tx.done;

  // Auto-assign order as next available position
  const maxOrder = allImages.length > 0
    ? Math.max(...allImages.map(img => img.order))
    : -1;
  const order = maxOrder + 1;

  // Create image record
  const imageRecord: ImageRecord = {
    id,
    blob,
    name,
    uploadedAt: Date.now(),
    order,
    isDefault,
  };

  // Save to database
  await db.put(STORE_NAME, imageRecord);
}

/**
 * Get a single image by ID
 * @param id - Image identifier
 */
export async function getImage(id: string): Promise<ImageRecord | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

/**
 * Get all images sorted by order index
 */
export async function getAllImages(): Promise<ImageRecord[]> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('order');
  const images = await index.getAll();
  await tx.done;
  return images;
}

/**
 * Delete an image from IndexedDB
 * @param id - Image identifier
 * @throws Error if attempting to delete a default image
 */
export async function deleteImage(id: string): Promise<void> {
  const db = await initDB();

  // Check if image is a default
  const image = await db.get(STORE_NAME, id);
  if (image?.isDefault) {
    throw new Error('Cannot delete default images');
  }

  await db.delete(STORE_NAME, id);
}

/**
 * Reorder images by updating order field based on array position
 * @param imageIds - Array of image IDs in desired order
 */
export async function reorderImages(imageIds: string[]): Promise<void> {
  const db = await initDB();

  // Use a transaction to ensure all updates complete atomically
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Update order field for each image
  for (let i = 0; i < imageIds.length; i++) {
    const id = imageIds[i];
    const image = await store.get(id);

    if (image) {
      image.order = i;
      await store.put(image);
    }
  }

  await tx.done;
}

// Initialize database on module load
initDB().catch(err => {
  console.error('Failed to initialize IndexedDB:', err);
});
