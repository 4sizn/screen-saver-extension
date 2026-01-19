export interface ImageRecord {
  id: string; // UUID
  blob: Blob; // Image binary data
  name: string; // Original filename
  uploadedAt: number; // Timestamp
  order: number; // Display order (0-based)
  isDefault: boolean; // True for bundled defaults
}

const DB_NAME = 'screen-saver-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// Singleton database promise to avoid multiple connections
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize and open the IndexedDB database using native API
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store with keyPath 'id'
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

      // Create indexes for sorting and filtering
      store.createIndex('order', 'order', { unique: false });
      store.createIndex('isDefault', 'isDefault', { unique: false });
    };
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

  const allImages = await new Promise<ImageRecord[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

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
  const writeTx = db.transaction(STORE_NAME, 'readwrite');
  const writeStore = writeTx.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = writeStore.put(imageRecord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single image by ID
 * @param id - Image identifier
 */
export async function getImage(id: string): Promise<ImageRecord | undefined> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all images sorted by order index
 */
export async function getAllImages(): Promise<ImageRecord[]> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('order');

  return new Promise((resolve, reject) => {
    const request = index.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an image from IndexedDB
 * @param id - Image identifier
 * @throws Error if attempting to delete a default image
 */
export async function deleteImage(id: string): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Check if image is a default
  const image = await new Promise<ImageRecord | undefined>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (image?.isDefault) {
    throw new Error('Cannot delete default images');
  }

  await new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Reorder images by updating order field based on array position
 * @param imageIds - Array of image IDs in desired order
 */
export async function reorderImages(imageIds: string[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Update order field for each image
  for (let i = 0; i < imageIds.length; i++) {
    const id = imageIds[i];

    const image = await new Promise<ImageRecord | undefined>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (image) {
      image.order = i;
      await new Promise<void>((resolve, reject) => {
        const request = store.put(image);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}
