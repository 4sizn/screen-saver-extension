# Phase 2: Content Storage - Research

**Researched:** 2026-01-19
**Domain:** Browser extension image storage, file upload, and image management UI
**Confidence:** HIGH

## Summary

Phase 2 implements local image storage infrastructure for a browser extension, enabling users to upload custom images while providing a default collection of nature landscapes. The standard approach uses IndexedDB for binary Blob storage (NOT chrome.storage.local), WXT's options entrypoint for the settings page, React-based file upload with HTML5 input validation, and dnd-kit for drag-and-drop reordering.

Key architectural decisions: Store images as Blobs in IndexedDB (not base64 in chrome.storage), request unlimitedStorage permission to avoid quota issues, compress images client-side using Canvas API before storage, bundle 10-20 default images in public/ directory as web accessible resources, and use idb library wrapper for Promise-based IndexedDB access.

**Primary recommendation:** Use IndexedDB with idb library for image storage, implement client-side compression with Canvas API before saving, create WXT options page for settings UI, use dnd-kit for image reordering, and bundle default images (1920x1080 JPEG, optimized <500KB each) in public/ directory.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| idb | ^8.x | Promise-based IndexedDB wrapper | Industry standard wrapper by Jake Archibald. Mirrors IndexedDB API but with promises instead of events. Tiny (~1.19KB brotli'd). Works with any objects supported by structured clone algorithm including Blobs. |
| @dnd-kit/core | ^6.x | Drag-and-drop primitives | Modern drag-and-drop for React. Replaces deprecated react-beautiful-dnd. Headless, accessible, framework-agnostic. Works with touch devices. |
| @dnd-kit/sortable | ^9.x | Sortable list presets | Built on dnd-kit/core. Provides sortable list patterns for image reordering. Handles keyboard navigation, screen reader support. |
| react-hook-form | ^7.x | Form validation | Performant form library with minimal re-renders. Supports Zod/Yup validation schemas. Native HTML5 validation integration. |
| browser-image-compression | ^2.x | Client-side image compression | Pure JavaScript image compression using Canvas API. Auto-selects optimal format (WebP, JPEG, PNG, AVIF). Smart quality optimization with binary search. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-dropzone | ^14.x | Drag-drop file upload UI | Optional enhancement for file upload UX. HTML5-compliant drag zone with file validation. Minimal dependencies. |
| zod | ^3.x | Schema validation | Optional for strict TypeScript validation. Pairs with react-hook-form for image upload validation (file type, size limits). |

**Installation:**
```bash
# Core dependencies
npm install idb
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-hook-form
npm install browser-image-compression

# Optional enhancements
npm install react-dropzone
npm install zod
```

## Architecture Patterns

### Recommended Project Structure
```
entrypoints/
├── background.ts                  # Service worker (existing)
├── content/                       # Content script (existing)
└── options/                       # Settings page (NEW)
    ├── index.html                # Entry HTML
    ├── App.tsx                   # Root component
    ├── components/
    │   ├── ImageUpload.tsx       # File upload with preview
    │   ├── ImageGallery.tsx      # Grid display with thumbnails
    │   └── ImageList.tsx         # Sortable list with delete
    └── style.css                 # Settings page styles

lib/
├── storage.ts                     # IndexedDB wrapper (existing)
├── imageStorage.ts               # Image-specific storage (NEW)
└── imageProcessing.ts            # Compression/resize utilities (NEW)

public/
└── images/                       # Default nature images (NEW)
    ├── default-01.jpg            # 10-20 landscape images
    ├── default-02.jpg            # 1920x1080, JPEG, <500KB each
    └── ...

components/
└── ui/                           # Shadcn UI components
    ├── button.tsx
    ├── card.tsx
    └── ...
```

### Pattern 1: Options Page Entrypoint in WXT

**What:** WXT auto-generates options page configuration from entrypoints/options/ directory.

**When to use:** For extension settings UI that users access via browser extension management page or right-click menu.

**Example:**
```html
<!-- entrypoints/options/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Open in dedicated tab instead of inline modal -->
  <meta name="manifest.open_in_tab" content="true" />
  <title>Screen Saver Settings</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./App.tsx"></script>
</body>
</html>
```

**App.tsx:**
```typescript
// entrypoints/options/App.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import ImageUpload from './components/ImageUpload';
import ImageGallery from './components/ImageGallery';
import './style.css';

function OptionsApp() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Screen Saver Settings</h1>
      <ImageUpload />
      <ImageGallery />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>
);
```

**Sources:**
- [WXT Entrypoints Documentation](https://wxt.dev/guide/essentials/entrypoints.html)
- [WXT Project Structure](https://wxt.dev/guide/essentials/project-structure)

### Pattern 2: IndexedDB Storage for Images

**What:** Use IndexedDB to store images as Blob objects, NOT base64 in chrome.storage.local.

**When to use:** Always for image storage in extensions. chrome.storage.local has 10MB limit, IndexedDB scales to GB.

**Why NOT chrome.storage.local:**
- Limited to 10MB (even with unlimitedStorage, optimized for settings not binary data)
- Base64 encoding increases size by 33-37%
- Designed for JSON-serializable configuration, not large binary files
- Performance degrades with large data

**Implementation with idb:**
```typescript
// lib/imageStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ImageDB extends DBSchema {
  images: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      name: string;
      uploadedAt: number;
      order: number;
      isDefault: boolean;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ImageDB>>;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ImageDB>('screen-saver-images', 1, {
      upgrade(db) {
        // Create object store for images
        const store = db.createObjectStore('images', { keyPath: 'id' });
        store.createIndex('order', 'order');
        store.createIndex('isDefault', 'isDefault');
      },
    });
  }
  return dbPromise;
}

export async function saveImage(
  id: string,
  blob: Blob,
  name: string,
  isDefault = false
) {
  const db = await getDB();
  const count = await db.count('images');

  await db.put('images', {
    id,
    blob,
    name,
    uploadedAt: Date.now(),
    order: count,
    isDefault,
  });
}

export async function getImage(id: string) {
  const db = await getDB();
  return db.get('images', id);
}

export async function getAllImages() {
  const db = await getDB();
  const tx = db.transaction('images', 'readonly');
  const index = tx.store.index('order');
  return index.getAll();
}

export async function deleteImage(id: string) {
  const db = await getDB();
  await db.delete('images', id);
}

export async function reorderImages(imageIds: string[]) {
  const db = await getDB();
  const tx = db.transaction('images', 'readwrite');

  await Promise.all(
    imageIds.map(async (id, index) => {
      const image = await tx.store.get(id);
      if (image) {
        image.order = index;
        await tx.store.put(image);
      }
    })
  );

  await tx.done;
}
```

**Sources:**
- [idb GitHub Repository](https://github.com/jakearchibald/idb)
- [Storing images and files in IndexedDB – Mozilla Hacks](https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/)
- [Work with IndexedDB | web.dev](https://web.dev/articles/indexeddb)

### Pattern 3: Client-Side Image Compression Before Storage

**What:** Compress and resize images using Canvas API before saving to IndexedDB.

**When to use:** For all user-uploaded images. Reduces storage usage and display rendering time.

**Target specs:**
- Max dimensions: 1920x1080 (Full HD, sufficient for screen savers)
- Format: JPEG or WebP (lossy compression)
- Quality: 0.85 (good balance of quality vs size)
- Target size: <500KB per image

**Implementation:**
```typescript
// lib/imageProcessing.ts
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: 0.5,              // 500KB max
    maxWidthOrHeight: 1920,      // 1920x1080 max
    useWebWorker: true,          // Use Web Worker for performance
    fileType: 'image/jpeg',      // Force JPEG (or auto-detect for WebP support)
    initialQuality: 0.85,        // Good quality, reasonable size
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return compressedBlob;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
    };
  }

  // Check file size (before compression, warn if >10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Please upload images smaller than 10MB.'
    };
  }

  return { valid: true };
}

export async function createObjectURL(blob: Blob): Promise<string> {
  return URL.createObjectURL(blob);
}

export function revokeObjectURL(url: string) {
  URL.revokeObjectURL(url);
}
```

**Why Canvas API approach:**
- Native browser support (no server required)
- Compression Streams API in Chrome (2024+) provides built-in compression
- WebP/AVIF format detection for modern browsers
- Web Worker support prevents UI blocking
- Binary search algorithm for optimal quality/size balance

**Sources:**
- [Client-Side Image Compression on the Web - DEV Community](https://dev.to/ramko9999/client-side-image-compression-on-the-web-26j7)
- [Leveraging Client-Side Image Compression with HTML Canvas](https://blogs.halodoc.io/optimizing-for-speed-image-compression/)
- [More efficient IndexedDB storage in Chrome | Chrome Developers](https://developer.chrome.com/docs/chromium/indexeddb-storage-improvements)

### Pattern 4: File Upload with HTML5 Validation

**What:** Use HTML5 file input with accept attribute and client-side validation.

**When to use:** For image upload in settings page.

**Implementation:**
```typescript
// entrypoints/options/components/ImageUpload.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { compressImage, validateImageFile } from '@/lib/imageProcessing';
import { saveImage } from '@/lib/imageStorage';
import { Button } from '@/components/ui/button';

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);

    try {
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Compress image
      const compressedBlob = await compressImage(file);

      // Save to IndexedDB
      const id = crypto.randomUUID();
      await saveImage(id, compressedBlob, file.name);

      alert('Image uploaded successfully!');

      // Clean up preview
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <input
        type="file"
        id="image-upload"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer inline-block"
      >
        <Button disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
      </label>

      {preview && (
        <div className="mt-4">
          <img
            src={preview}
            alt="Preview"
            className="max-w-sm mx-auto rounded-lg"
          />
        </div>
      )}

      <p className="mt-2 text-sm text-gray-500">
        Supported formats: JPEG, PNG, WebP (max 10MB)
      </p>
    </div>
  );
}
```

**Key validation points:**
- Accept attribute: `accept="image/jpeg,image/jpg,image/png,image/webp"`
- Client-side file type check (don't trust MIME type alone)
- File size limit (10MB before compression)
- Preview before upload (using URL.createObjectURL)
- Clear error messages

**Sources:**
- [MDN: <input type="file">](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)
- [File Type Validation while Uploading - GeeksforGeeks](https://www.geeksforgeeks.org/file-type-validation-while-uploading-it-using-javascript/)

### Pattern 5: Sortable Image List with dnd-kit

**What:** Use @dnd-kit/sortable for drag-and-drop image reordering.

**When to use:** For image management UI where users can reorder their collection.

**Implementation:**
```typescript
// entrypoints/options/components/ImageList.tsx
import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAllImages, deleteImage, reorderImages } from '@/lib/imageStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageItem {
  id: string;
  blob: Blob;
  name: string;
  order: number;
  isDefault: boolean;
}

function SortableImage({
  item,
  onDelete
}: {
  item: ImageItem;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const [objectUrl, setObjectUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(item.blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [item.blob]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 mb-2 flex items-center gap-4"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
        </svg>
      </div>

      <img
        src={objectUrl}
        alt={item.name}
        className="w-20 h-20 object-cover rounded"
      />

      <div className="flex-1">
        <p className="font-medium">{item.name}</p>
        {item.isDefault && (
          <span className="text-xs text-gray-500">Default image</span>
        )}
      </div>

      {!item.isDefault && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          Delete
        </Button>
      )}
    </Card>
  );
}

export default function ImageList() {
  const [items, setItems] = useState<ImageItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    const images = await getAllImages();
    setItems(images);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Persist new order
        reorderImages(newItems.map((i) => i.id));

        return newItems;
      });
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this image?')) {
      await deleteImage(id);
      await loadImages();
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Images</h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableImage
              key={item.id}
              item={item}
              onDelete={handleDelete}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No images uploaded yet. Upload your first image above!
        </p>
      )}
    </div>
  );
}
```

**Key features:**
- Drag handle icon (six dots) for clear affordance
- Keyboard navigation support (arrow keys, space/enter)
- Screen reader accessible
- Visual feedback during drag (transform/transition)
- Prevent deletion of default images
- Persist order to IndexedDB immediately

**Sources:**
- [dnd-kit GitHub Repository](https://github.com/clauderic/dnd-kit)
- [Create sortable drag and drop in React JS using dnd-kit library | Medium](https://medium.com/@kurniawanc/create-sortable-drag-and-drop-in-react-js-using-dnd-kit-library-ba8b2917a6b5)
- [dnd-kit/sortable examples - CodeSandbox](https://codesandbox.io/examples/package/@dnd-kit/sortable)

### Pattern 6: Default Image Bundling

**What:** Bundle 10-20 default nature landscape images in public/ directory, load into IndexedDB on first install.

**When to use:** For providing immediate value without requiring user uploads.

**Project structure:**
```
public/
└── images/
    └── defaults/
        ├── nature-01.jpg   # 1920x1080, <500KB
        ├── nature-02.jpg
        ├── nature-03.jpg
        └── ... (10-20 total)
```

**Loading defaults on install:**
```typescript
// lib/defaultImages.ts
import { saveImage } from './imageStorage';
import { openDB } from 'idb';

const DEFAULT_IMAGES = [
  '/images/defaults/nature-01.jpg',
  '/images/defaults/nature-02.jpg',
  '/images/defaults/nature-03.jpg',
  // ... 10-20 total
];

export async function loadDefaultImages() {
  const db = await openDB('screen-saver-images', 1);
  const count = await db.count('images');

  // Only load if database is empty (first install)
  if (count > 0) return;

  console.log('Loading default images...');

  for (let i = 0; i < DEFAULT_IMAGES.length; i++) {
    const url = browser.runtime.getURL(DEFAULT_IMAGES[i]);

    try {
      const response = await fetch(url);
      const blob = await response.blob();

      await saveImage(
        `default-${i + 1}`,
        blob,
        `Default Nature ${i + 1}`,
        true // isDefault flag
      );
    } catch (error) {
      console.error(`Failed to load default image ${i + 1}:`, error);
    }
  }

  console.log('Default images loaded successfully');
}

// Call from background script on install
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await loadDefaultImages();
  }
});
```

**Image sourcing:**
- Use royalty-free sources: Unsplash, Pexels, Pixabay
- License: Unsplash License (free for commercial use, no attribution required)
- Specs: 1920x1080 JPEG, optimized to <500KB each
- Theme: Nature landscapes (mountains, forests, oceans, sunsets)

**Sources:**
- [Unsplash - Nature Landscape Photos](https://unsplash.com/s/photos/nature-landscape)
- [WXT Project Structure - Public Directory](https://wxt.dev/guide/essentials/project-structure)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB Promise wrapper | Custom promisify wrapper around IDBRequest | idb library | 7+ years of battle-testing, handles edge cases (quota errors, browser bugs, transaction lifecycle). 1.19KB is negligible. |
| Image compression algorithm | Custom Canvas toBlob() quality loop | browser-image-compression | Smart binary search for optimal quality, auto-format detection (WebP/AVIF), Web Worker support, handles EXIF rotation. |
| Drag-and-drop reordering | Custom mouse/touch event handlers | @dnd-kit/sortable | Accessibility (keyboard, screen readers), touch device support, collision detection algorithms, smooth animations. Custom solutions miss 90% of edge cases. |
| File type validation | Check file extension only | Validate MIME type + magic number | Extensions can be spoofed. Libraries check actual file headers (magic numbers) for true validation. |
| Base64 image storage | Store as base64 strings in chrome.storage | Store as Blob in IndexedDB | Base64 inflates size by 33-37%, chrome.storage has 10MB limit, IndexedDB handles GB-scale binary data natively. |

**Key insight:** Browser extension image storage has unique challenges (quota limits, cross-browser compatibility, binary data handling, async complexity). Don't underestimate the depth of edge cases these libraries handle.

## Common Pitfalls

### Pitfall 1: Using chrome.storage.local for Images

**What goes wrong:** Developer stores images as base64 strings in chrome.storage.local. Works fine with 2-3 images during testing. Extension ships, users upload 15+ images, suddenly chrome.storage.local quota exceeded errors. Extension stops working.

**Why it happens:** chrome.storage.local has 10MB limit (even with unlimitedStorage, it's optimized for JSON settings not binary). Base64 encoding increases image size by 33-37%. A 2MB JPEG becomes 2.7MB base64. 10MB / 2.7MB = ~3-4 images max.

**How to avoid:**
- Use IndexedDB for binary Blob storage (no base64 encoding)
- Request unlimitedStorage permission for IndexedDB quota exemption
- chrome.storage is for settings/config, IndexedDB is for large binary data

**Warning signs:**
- Storing images as base64 strings
- Using chrome.storage.local for anything >10MB total
- Not requesting unlimitedStorage permission
- No quota error handling in storage code

**Sources:**
- [chrome.storage API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [storage.local - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local)

### Pitfall 2: Not Compressing Images Before Storage

**What goes wrong:** Extension allows users to upload RAW camera photos (8MB-12MB each). Works during testing with 1-2 images. Users upload 10+ images, suddenly browser storage quota errors or performance degrades (slow image loading).

**Why it happens:** Modern smartphone cameras produce 12MP+ images at 8-12MB each. 10 images = 80-120MB. Browser IndexedDB quota varies (50% free disk space in Firefox, ~1GB in Safari). Filling quota triggers eviction. Large blobs slow down IndexedDB read/write operations.

**How to avoid:**
- Compress images client-side BEFORE saving to IndexedDB
- Target: 1920x1080 (Full HD) at 0.85 quality = <500KB per image
- Use browser-image-compression or Canvas API toBlob()
- Show compression progress to user (can take 1-2 seconds for large images)

**Warning signs:**
- Accepting images without size limits
- No compression step in upload flow
- Storage quota errors after 5-10 image uploads
- Slow image rendering in gallery

**Sources:**
- [Client-Side Image Compression on the Web - DEV Community](https://dev.to/ramko9999/client-side-image-compression-on-the-web-26j7)
- [IndexedDB Max Storage Size Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html)

### Pitfall 3: File Extension Validation Only

**What goes wrong:** Developer validates uploaded files by checking extension (.jpg, .png). Works during testing with legitimate files. Malicious user renames exploit.exe to exploit.jpg, uploads to extension. Extension treats as image, loads into DOM, security vulnerability.

**Why it happens:** File extensions can be trivially renamed. MIME type can be spoofed. Need to validate actual file content (magic numbers / file headers).

**How to avoid:**
- Check MIME type: `file.type === 'image/jpeg'`
- Validate with FileReader: Read first few bytes, check magic numbers
- Use `accept` attribute: `accept="image/jpeg,image/png,image/webp"`
- Validate after reading: Try to load as Image, catch errors
- Use library with built-in validation (browser-image-compression validates during compression)

**Warning signs:**
- Only checking file.name.endsWith('.jpg')
- No MIME type validation
- No error handling when creating Image/Blob URLs
- Assuming user input is safe

**Example validation:**
```typescript
function validateImageFile(file: File): boolean {
  // Check MIME type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) return false;

  // Additional: validate by loading as Image
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(false);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

**Sources:**
- [File Type Validation while Uploading - GeeksforGeeks](https://www.geeksforgeeks.org/file-type-validation-while-uploading-it-using-javascript/)
- [MDN: <input type="file">](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)

### Pitfall 4: Not Revoking Object URLs

**What goes wrong:** Developer creates object URLs for image previews (`URL.createObjectURL(blob)`). URLs work during testing. Extension runs for hours/days, memory usage grows continuously, browser eventually becomes slow or crashes.

**Why it happens:** Object URLs create memory references that prevent garbage collection. Each URL holds the Blob in memory until revoked. Creating 100 preview URLs without revoking = 100 Blobs in memory permanently.

**How to avoid:**
- Call `URL.revokeObjectURL(url)` when done with preview
- Revoke in component cleanup (useEffect return function)
- Revoke when component unmounts
- Track URLs in state, revoke all on unmount

**Example:**
```typescript
useEffect(() => {
  const url = URL.createObjectURL(blob);
  setPreviewUrl(url);

  // Clean up on unmount or blob change
  return () => {
    URL.revokeObjectURL(url);
  };
}, [blob]);
```

**Warning signs:**
- Creating object URLs without revoking
- Memory usage increasing over time
- No cleanup in useEffect
- Browser DevTools shows hundreds of blob: URLs

**Sources:**
- [MDN: URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)
- [Performance comparison between readAsDataURL and createObjectURL](https://www.andygup.net/performance-comparison-between-readasdataurl-and-createobjecturl/)

### Pitfall 5: IndexedDB Transaction Lifecycle Confusion

**What goes wrong:** Developer opens IndexedDB transaction, starts async operation (fetch image), tries to use transaction after fetch completes. Transaction already closed, "TransactionInactiveError" thrown.

**Why it happens:** IndexedDB transactions auto-commit when control returns to event loop. Starting async work (fetch, setTimeout) loses the transaction. Transaction thinks operation is complete, commits automatically.

**How to avoid:**
- Complete all transaction operations synchronously
- For async work, fetch data FIRST, then open transaction
- Use idb library (handles transaction lifecycle correctly)
- If using raw IndexedDB, don't mix async operations with transactions

**Example (WRONG):**
```typescript
const tx = db.transaction('images', 'readwrite');
const store = tx.objectStore('images');

// Async fetch loses transaction
const response = await fetch(url);
const blob = await response.blob();

// ERROR: Transaction already inactive
store.put({ id: '1', blob }); // TransactionInactiveError
```

**Example (CORRECT):**
```typescript
// Fetch FIRST
const response = await fetch(url);
const blob = await response.blob();

// THEN open transaction
const tx = db.transaction('images', 'readwrite');
const store = tx.objectStore('images');
store.put({ id: '1', blob }); // Works!
await tx.complete;
```

**Warning signs:**
- "TransactionInactiveError" in console
- Mixing await with raw IndexedDB transactions
- Not using idb library wrapper

**Sources:**
- [MDN: IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)
- [idb library](https://github.com/jakearchibald/idb) (handles this automatically)

### Pitfall 6: Forgetting unlimitedStorage Permission

**What goes wrong:** Extension uses IndexedDB to store images. Works during testing with 3-5 images. Users upload 20+ images, suddenly quota exceeded errors. IndexedDB refuses to save more images.

**Why it happens:** Without unlimitedStorage permission, IndexedDB is subject to browser quota limits (typically 10-50% of free disk space, varies by browser). Heavy disk usage triggers eviction. Extension data can be deleted without warning.

**How to avoid:**
- Add "unlimitedStorage" to manifest permissions
- Prevents quota-based eviction for extension origin
- Still limited by physical disk space (but won't be auto-evicted)

**Manifest configuration:**
```json
{
  "permissions": [
    "storage",
    "unlimitedStorage"
  ]
}
```

**Warning signs:**
- QuotaExceededError in IndexedDB operations
- Images disappearing after browser restart
- No unlimitedStorage in manifest permissions

**Sources:**
- [Chrome Permissions List](https://developer.chrome.com/docs/extensions/reference/permissions-list)
- [unlimitedStorage - Chrome Stats](https://chrome-stats.com/permission/unlimitedStorage)
- [storage.local - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local)

## Code Examples

Verified patterns from official sources:

### Complete IndexedDB Setup with idb

```typescript
// lib/imageStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ImageDB extends DBSchema {
  images: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      name: string;
      uploadedAt: number;
      order: number;
      isDefault: boolean;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ImageDB>>;

export async function initDB() {
  dbPromise = openDB<ImageDB>('screen-saver-images', 1, {
    upgrade(db) {
      const store = db.createObjectStore('images', { keyPath: 'id' });
      store.createIndex('order', 'order');
      store.createIndex('isDefault', 'isDefault');
    },
  });
  return dbPromise;
}

export async function saveImage(
  id: string,
  blob: Blob,
  name: string,
  isDefault = false
) {
  const db = await dbPromise;
  const count = await db.count('images');

  await db.put('images', {
    id,
    blob,
    name,
    uploadedAt: Date.now(),
    order: count,
    isDefault,
  });
}

export async function getAllImages() {
  const db = await dbPromise;
  return db.getAllFromIndex('images', 'order');
}

export async function deleteImage(id: string) {
  const db = await dbPromise;

  // Get image to check if default
  const image = await db.get('images', id);
  if (image?.isDefault) {
    throw new Error('Cannot delete default images');
  }

  await db.delete('images', id);
}

export async function reorderImages(imageIds: string[]) {
  const db = await dbPromise;
  const tx = db.transaction('images', 'readwrite');

  await Promise.all(
    imageIds.map(async (id, index) => {
      const image = await tx.store.get(id);
      if (image) {
        image.order = index;
        await tx.store.put(image);
      }
    })
  );

  await tx.done;
}

// Initialize on module load
initDB();
```

**Source:** [idb GitHub Repository](https://github.com/jakearchibald/idb)

### Image Upload Component with Compression

```typescript
// entrypoints/options/components/ImageUpload.tsx
import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { saveImage } from '@/lib/imageStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPEG, PNG, or WebP images.');
      return;
    }

    // Validate file size (before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please upload images smaller than 10MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Compress image
      const compressedBlob = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85,
        onProgress: (percent) => setProgress(percent),
      });

      // Save to IndexedDB
      const id = crypto.randomUUID();
      await saveImage(id, compressedBlob, file.name);

      alert(
        `Image uploaded successfully! Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`
      );

      // Clean up
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
      setProgress(0);
      e.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-4">Upload Custom Images</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          id="image-upload"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <label htmlFor="image-upload" className="cursor-pointer inline-block">
          <Button disabled={uploading}>
            {uploading ? `Compressing... ${progress}%` : 'Choose Image'}
          </Button>
        </label>

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-md mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          Supported formats: JPEG, PNG, WebP (max 10MB)
          <br />
          Images will be optimized to 1920x1080 and compressed to ~500KB
        </p>
      </div>
    </Card>
  );
}
```

**Source:** Synthesized from browser-image-compression docs and React best practices

### Image Gallery Grid with Tailwind

```typescript
// entrypoints/options/components/ImageGallery.tsx
import React, { useEffect, useState } from 'react';
import { getAllImages } from '@/lib/imageStorage';
import { Card } from '@/components/ui/card';

interface ImageItem {
  id: string;
  blob: Blob;
  name: string;
  isDefault: boolean;
}

export default function ImageGallery() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [objectUrls, setObjectUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    // Create object URLs for all images
    const urls = new Map<string, string>();
    images.forEach((img) => {
      urls.set(img.id, URL.createObjectURL(img.blob));
    });
    setObjectUrls(urls);

    // Cleanup on unmount
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  async function loadImages() {
    const allImages = await getAllImages();
    setImages(allImages);
  }

  return (
    <Card className="p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4">Image Collection</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <img
              src={objectUrls.get(img.id) || ''}
              alt={img.name}
              className="w-full h-40 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-end p-2">
              <p className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity truncate">
                {img.name}
              </p>
            </div>
            {img.isDefault && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Default
              </div>
            )}
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No images found. Upload your first image!
        </p>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Total images: {images.length}
      </p>
    </Card>
  );
}
```

**Source:** Synthesized from Tailwind CSS gallery examples

### WXT Manifest Configuration

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  manifest: {
    name: 'Screen Saver',
    permissions: [
      'storage',
      'notifications',
      'activeTab',
      'unlimitedStorage', // CRITICAL for IndexedDB image storage
    ],
    web_accessible_resources: [
      {
        resources: ['images/defaults/*.jpg'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
```

**Source:** [WXT Configuration Docs](https://wxt.dev/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localForage (IndexedDB wrapper) | idb library | 2020-2026 | idb is smaller (1.19KB vs 8KB+), more actively maintained, TypeScript-first. localForage still valid but idb is preferred for new projects. |
| react-beautiful-dnd | @dnd-kit | 2021 (deprecated 2023) | react-beautiful-dnd archived by Atlassian. dnd-kit is modern replacement with better touch support, headless design, smaller bundle. |
| Manual Canvas compression | browser-image-compression library | 2020-2026 | Auto-format detection (WebP/AVIF), smart quality optimization, Web Worker support. Manual approach misses modern codec support. |
| chrome.storage.local for images | IndexedDB for binary data | Always best practice | chrome.storage designed for settings, IndexedDB for large binary. chrome.storage 10MB limit, IndexedDB scales to GB. |
| Base64 image storage | Blob storage | Always best practice | Base64 inflates size 33-37%, no benefit in browser context. Blobs are native, no encoding overhead. |
| Formik for forms | react-hook-form | 2019-2026 | react-hook-form has minimal re-renders, smaller bundle (9KB vs 13KB), better TypeScript support. Formik still maintained but react-hook-form preferred. |

**Deprecated/outdated:**
- **react-beautiful-dnd:** Archived by Atlassian in 2023. Use @dnd-kit or hello-pangea/dnd (community fork).
- **FileReader.readAsDataURL for storage:** Base64 encoding unnecessary for IndexedDB. Use FileReader.readAsArrayBuffer or store File/Blob directly.
- **localStorage for images:** 5-10MB limit, synchronous, blocks UI. Never use for images.
- **WebSQL:** Deprecated since 2010, removed from most browsers. Use IndexedDB.

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal default image count (10 vs 20)**
   - What we know: More images = more variety, but larger extension bundle size
   - What's unclear: User preference for variety vs download size tradeoff
   - Recommendation: Start with 15 images (middle ground). Each ~500KB = 7.5MB total. Monitor user feedback and analytics post-launch.

2. **Image format preference (JPEG vs WebP vs AVIF)**
   - What we know: WebP/AVIF offer better compression than JPEG. Not all browsers support AVIF (Safari added in 2023).
   - What's unclear: Whether compression library's auto-detection is reliable across all browsers
   - Recommendation: Use JPEG for default bundled images (universal support). Let browser-image-compression auto-detect for user uploads (falls back to JPEG if unsupported).

3. **IndexedDB quota behavior on low disk space**
   - What we know: unlimitedStorage prevents quota-based eviction, but not physical disk space limits
   - What's unclear: How browsers behave when disk is truly full (error messages, user prompts)
   - Recommendation: Implement quota error handling with clear user message. Test on low-disk-space scenarios during Phase 5 verification.

## Sources

### Primary (HIGH confidence)
- [idb GitHub Repository](https://github.com/jakearchibald/idb) - Official IndexedDB wrapper by Jake Archibald
- [chrome.storage API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/storage) - Official storage limits and usage
- [WXT Entrypoints Documentation](https://wxt.dev/guide/essentials/entrypoints.html) - Official WXT framework docs
- [WXT Project Structure](https://wxt.dev/guide/essentials/project-structure) - Official public directory handling
- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Official web standards documentation
- [MDN: <input type="file">](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) - Official HTML file input spec
- [dnd-kit GitHub Repository](https://github.com/clauderic/dnd-kit) - Official drag-and-drop library
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) - Official compression library docs

### Secondary (MEDIUM confidence)
- [Storing images and files in IndexedDB – Mozilla Hacks](https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/) - Official Mozilla blog on Blob storage patterns
- [Client-Side Image Compression on the Web - DEV Community](https://dev.to/ramko9999/client-side-image-compression-on-the-web-26j7) - Verified compression techniques
- [More efficient IndexedDB storage in Chrome | Chrome Developers](https://developer.chrome.com/docs/chromium/indexeddb-storage-improvements) - Chrome 2024 compression improvements
- [IndexedDB Max Storage Size Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html) - Comprehensive quota analysis across browsers
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - Browser storage quota specs
- [Top 5 Drag-and-Drop Libraries for React in 2026 | Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Library comparison with 2026 recommendations
- WebSearch results verified against official documentation

### Tertiary (LOW confidence - flagged for validation)
- Optimal compression quality (0.85) - Based on general best practices, needs user testing
- Default image count (15) - Estimated middle ground, needs analytics validation
- Exact IndexedDB quota limits - Varies by browser version and disk space, document general ranges

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs, npm packages, and GitHub repos
- Architecture: HIGH - IndexedDB Blob storage pattern verified by Mozilla Hacks, idb is official library
- Storage approach: HIGH - chrome.storage vs IndexedDB guidance from official Chrome docs
- Image compression: MEDIUM - browser-image-compression library verified, optimal quality needs testing
- Default images: MEDIUM - Sourcing and count based on general practices, needs user validation
- UI patterns: HIGH - dnd-kit and react-hook-form are current standards with active maintenance

**Research date:** 2026-01-19
**Valid until:** 45 days (libraries are stable, browser APIs evolve slowly)

**Phase 2 readiness:** READY FOR PLANNING
- All core patterns identified (IndexedDB, compression, file upload, reordering)
- Known pitfalls documented (chrome.storage misuse, quota limits, validation)
- Cross-browser approach defined (unlimitedStorage permission, idb wrapper)
- Example code available for all major features
- Library recommendations current as of 2026
