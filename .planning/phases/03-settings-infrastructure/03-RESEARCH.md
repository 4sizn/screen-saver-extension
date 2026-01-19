# Phase 3: Settings Infrastructure - Research

**Researched:** 2026-01-19
**Domain:** Browser extension settings UI with persistent storage
**Confidence:** HIGH

## Summary

Settings infrastructure for browser extensions requires combining chrome.storage for settings persistence with React forms for UI. The standard approach uses chrome.storage.sync for user preferences (up to 100KB) which automatically syncs across devices, with chrome.storage.onChanged for real-time synchronization between extension components.

For this phase, the key technical challenge is managing three types of settings state: (1) image enable/disable toggles stored per-image in IndexedDB, (2) global display preferences (fit, background color) in chrome.storage.sync, and (3) UI state for the settings form. The existing WXT framework provides built-in storage abstractions with type safety, while the established Shadcn UI foundation from Phase 2 provides accessible form components.

**Primary recommendation:** Use WXT storage.defineItem() for typed settings management, add isEnabled boolean field to ImageRecord schema (IndexedDB version 2), and implement settings UI with Shadcn Switch components and react-colorful for color picking.

## Standard Stack

The established libraries/tools for settings infrastructure in browser extensions:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chrome.storage.sync | Native API | Settings persistence | Cross-device sync, 100KB quota, official Chrome API |
| WXT storage | Built-in | Storage abstraction | Type-safe wrapper, cross-browser, reduces boilerplate |
| IndexedDB | Native API | Per-image settings | Already in use (Phase 2), boolean flags for enable/disable |
| React controlled components | ^19.2.3 | Form state | Real-time validation, predictable state management |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-colorful | ^5.6.1 | Color picker | Tiny (2.8KB gzipped), accessible, shadcn-compatible |
| Shadcn Switch | Via CLI | Toggle controls | Accessible, keyboard navigation, ARIA support |
| chrome.storage.onChanged | Native API | Real-time sync | Synchronize settings across popup/options/background |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chrome.storage.sync | chrome.storage.local | Loses cross-device sync, no storage benefit (settings are small) |
| react-colorful | react-color | 13x larger bundle, more features but unnecessary for basic color picking |
| IndexedDB boolean field | Separate settings object | More complexity, denormalized data harder to maintain |

**Installation:**
```bash
npm install react-colorful
npx shadcn@latest add switch
```

## Architecture Patterns

### Recommended Settings Data Structure

**chrome.storage.sync schema:**
```typescript
// lib/settingsStorage.ts
interface DisplaySettings {
  imageFit: 'cover' | 'contain';
  backgroundColor: string; // hex format: '#000000'
}

const displaySettings = storage.defineItem<DisplaySettings>(
  'sync:displaySettings',
  {
    fallback: {
      imageFit: 'cover',
      backgroundColor: '#000000'
    }
  }
);
```

**IndexedDB schema update (version 2):**
```typescript
// lib/imageStorage.ts
export interface ImageRecord {
  id: string;
  blob: Blob;
  name: string;
  uploadedAt: number;
  order: number;
  isDefault: boolean;
  isEnabled: boolean; // NEW: Controls image rotation inclusion
}

// Migration in onupgradeneeded:
// Default existing images to isEnabled: true
```

### Pattern 1: Dual Storage Architecture
**What:** Settings split between chrome.storage.sync (global display preferences) and IndexedDB (per-image enable/disable state)
**When to use:** When combining global settings with per-entity configuration
**Example:**
```typescript
// Global settings - chrome.storage.sync
const displaySettings = storage.defineItem<DisplaySettings>(
  'sync:displaySettings',
  { fallback: { imageFit: 'cover', backgroundColor: '#000000' } }
);

// Per-image settings - IndexedDB
async function toggleImageEnabled(id: string): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const image = await new Promise<ImageRecord>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (image) {
    image.isEnabled = !image.isEnabled;
    await new Promise<void>((resolve, reject) => {
      const request = store.put(image);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```
**Source:** [chrome.storage API documentation](https://developer.chrome.com/docs/extensions/reference/api/storage), [WXT storage patterns](https://wxt.dev/storage)

### Pattern 2: Settings Synchronization with onChanged
**What:** Use chrome.storage.onChanged to sync settings updates across extension components
**When to use:** When popup, options page, or background script need to react to settings changes
**Example:**
```typescript
// In content script or background
storage.watch<DisplaySettings>(
  'sync:displaySettings',
  (newValue, oldValue) => {
    console.log('Settings updated:', { newValue, oldValue });
    applyDisplaySettings(newValue);
  }
);
```
**Source:** [chrome.storage.onChanged documentation](https://developer.chrome.com/docs/extensions/reference/api/storage)

### Pattern 3: Controlled Form Components
**What:** React state drives form inputs, with controlled components for predictable updates
**When to use:** Settings forms with validation and real-time feedback
**Example:**
```typescript
// Source: React documentation pattern
function SettingsForm() {
  const [settings, setSettings] = useState<DisplaySettings>({
    imageFit: 'cover',
    backgroundColor: '#000000'
  });

  useEffect(() => {
    // Load on mount
    displaySettings.getValue().then(setSettings);
  }, []);

  const handleSave = async () => {
    await displaySettings.setValue(settings);
  };

  return (
    <div>
      <select
        value={settings.imageFit}
        onChange={(e) => setSettings(s => ({
          ...s,
          imageFit: e.target.value as 'cover' | 'contain'
        }))}
      >
        <option value="cover">Cover</option>
        <option value="contain">Contain</option>
      </select>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Don't use localStorage for settings:** chrome.storage.sync provides cross-device sync and doesn't require serialization
- **Don't store binary data in chrome.storage:** Use IndexedDB for blobs, chrome.storage for primitives/objects
- **Don't create separate enabled images array:** Storing `enabledImageIds: string[]` in chrome.storage duplicates IndexedDB data and creates sync issues
- **Don't forget default values in storage.defineItem:** Always provide fallback to avoid undefined state

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color picker UI | Custom RGB sliders and hex input | react-colorful | Accessibility (keyboard nav, ARIA), touch support, color format conversion, 2.8KB |
| Toggle switches | Styled checkbox | Shadcn Switch (Radix UI) | ARIA role="switch", keyboard interaction (Space to toggle), focus management |
| Debounced color input | Custom setTimeout logic | useEffect cleanup pattern | Prevents memory leaks, handles component unmount correctly |
| Storage change detection | Manual polling | chrome.storage.onChanged | Real-time, efficient, event-driven updates |
| Form validation | Custom error state | Controlled components + validation function | Predictable state, easier testing, standard React pattern |

**Key insight:** Accessibility for toggle switches and color pickers is complex. Browser APIs handle dozens of edge cases (screen readers, keyboard navigation, touch gestures, color format conversion) that custom implementations miss. The bundle size cost is minimal (2.8KB for color picker, already using Shadcn/Radix).

## Common Pitfalls

### Pitfall 1: IndexedDB Boolean Index Limitation
**What goes wrong:** Creating an index on the new `isEnabled` boolean field for filtering enabled images
**Why it happens:** IndexedDB cannot efficiently encode boolean values in standard indexes, requiring full table scan
**How to avoid:** Don't create index on boolean field. Filter in-memory after loading all images with `getAllImages().then(imgs => imgs.filter(i => i.isEnabled))`. With 15-50 images, in-memory filtering is negligible performance cost.
**Warning signs:** Query performance doesn't improve after adding `store.createIndex('isEnabled', 'isEnabled')`
**Source:** [IndexedDB boolean filtering issue](https://github.com/jurca/indexed-db.es6/issues/17)

### Pitfall 2: Missing Controlled Component Default Value
**What goes wrong:** Form input switches between controlled and uncontrolled state, causing React warning and state loss
**Why it happens:** Initial state is `undefined` instead of actual default value, then becomes defined after async load
**How to avoid:** Always initialize form state with concrete defaults matching the storage fallback. Use loading state during async fetch.
```typescript
// BAD
const [settings, setSettings] = useState<DisplaySettings>();

// GOOD
const [settings, setSettings] = useState<DisplaySettings>({
  imageFit: 'cover',
  backgroundColor: '#000000'
});
```
**Warning signs:** React warning "A component is changing an uncontrolled input to be controlled"
**Source:** [React Hook Form common mistakes](https://alexhooley.com/blog/react-hook-form-common-mistakes)

### Pitfall 3: IndexedDB Version Migration Data Loss
**What goes wrong:** Adding `isEnabled` field requires version bump to 2, but data isn't migrated properly
**Why it happens:** `onupgradeneeded` only creates structure, forgetting to set default `isEnabled: true` for existing images
**How to avoid:** In `onupgradeneeded`, after structure changes, iterate existing records and set defaults:
```typescript
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const tx = event.target.transaction;

  if (event.oldVersion < 2) {
    // Can't modify existing object store structure directly
    // Must migrate data if schema changes
    const store = tx.objectStore('images');

    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const record = cursor.value;
        if (record.isEnabled === undefined) {
          record.isEnabled = true; // Default to enabled
          cursor.update(record);
        }
        cursor.continue();
      }
    };
  }
};
```
**Warning signs:** Existing images don't appear in rotation after update
**Source:** [MDN IndexedDB version migration](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

### Pitfall 4: chrome.storage.sync Quota Exceeded
**What goes wrong:** Saving settings fails silently or throws QUOTA_BYTES_PER_ITEM error
**Why it happens:** Individual setting value exceeds 8KB limit (e.g., storing large color palette array)
**How to avoid:** Keep chrome.storage.sync for small primitives only. For this phase, `DisplaySettings` is ~50 bytes (well under limit). If adding features like custom color palettes, store in chrome.storage.local instead.
**Warning signs:** Settings don't persist, console error about quota
**Source:** [chrome.storage.sync limits](https://developer.chrome.com/docs/extensions/reference/api/storage)

### Pitfall 5: Color Picker Performance with Frequent onChange
**What goes wrong:** Color picker slider causes excessive re-renders and storage writes (60+ per second while dragging)
**Why it happens:** Controlled component updates state on every onChange, triggering save to chrome.storage on every pixel
**How to avoid:** Debounce storage writes, but keep UI state immediate:
```typescript
const [color, setColor] = useState('#000000');

// Immediate UI update
const handleColorChange = (newColor: string) => {
  setColor(newColor);
};

// Debounced storage write
useEffect(() => {
  const timer = setTimeout(() => {
    displaySettings.setValue({ ...settings, backgroundColor: color });
  }, 300); // 300ms debounce

  return () => clearTimeout(timer);
}, [color]);
```
**Warning signs:** Settings page feels laggy during color picking, console shows many storage API calls
**Source:** [React debouncing best practices](https://www.developerway.com/posts/debouncing-in-react)

### Pitfall 6: object-fit Misunderstanding with Background Color
**What goes wrong:** User sets background color but it never shows, or shows unexpectedly with transparent images
**Why it happens:**
- `cover` mode crops image to fill container - background never visible
- `contain` mode shows background in letterbox/pillarbox areas
- Transparent PNGs show background color through transparent regions in both modes
**How to avoid:** In settings UI, show visual preview demonstrating when background color applies. Add help text: "Background color appears in letterbox areas (contain mode) or behind transparent images"
**Warning signs:** User reports "background color setting doesn't work"
**Source:** [CSS object-fit behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit)

## Code Examples

Verified patterns from official sources:

### WXT Storage Definition
```typescript
// lib/settingsStorage.ts
import { storage } from 'wxt/storage';

export interface DisplaySettings {
  imageFit: 'cover' | 'contain';
  backgroundColor: string;
}

export const displaySettings = storage.defineItem<DisplaySettings>(
  'sync:displaySettings',
  {
    fallback: {
      imageFit: 'cover',
      backgroundColor: '#000000'
    }
  }
);
```
**Source:** [WXT storage documentation](https://wxt.dev/storage)

### Shadcn Switch with Controlled State
```typescript
// entrypoints/options/components/ImageToggle.tsx
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ImageToggleProps {
  imageId: string;
  imageName: string;
  isEnabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}

export function ImageToggle({ imageId, imageName, isEnabled, onToggle }: ImageToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={imageId}>{imageName}</Label>
      <Switch
        id={imageId}
        checked={isEnabled}
        onCheckedChange={(checked) => onToggle(imageId, checked)}
      />
    </div>
  );
}
```
**Source:** Shadcn UI pattern with Radix UI primitives

### react-colorful Integration
```typescript
// entrypoints/options/components/ColorPicker.tsx
import { HexColorPicker } from 'react-colorful';
import { useState, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [color, setColor] = useState(value);

  // Debounce external onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(color);
    }, 300);
    return () => clearTimeout(timer);
  }, [color, onChange]);

  return (
    <div className="space-y-2">
      <HexColorPicker color={color} onChange={setColor} />
      <input
        type="text"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="font-mono text-sm"
        pattern="^#[0-9A-Fa-f]{6}$"
      />
    </div>
  );
}
```
**Source:** [react-colorful npm package](https://www.npmjs.com/package/react-colorful)

### IndexedDB Schema Migration to Version 2
```typescript
// lib/imageStorage.ts update
const DB_VERSION = 2; // Increment from 1

export interface ImageRecord {
  id: string;
  blob: Blob;
  name: string;
  uploadedAt: number;
  order: number;
  isDefault: boolean;
  isEnabled: boolean; // NEW field
}

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
      const tx = (event.target as IDBOpenDBRequest).transaction!;

      // Version 1: Initial schema (already exists)
      if (event.oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('order', 'order', { unique: false });
        store.createIndex('isDefault', 'isDefault', { unique: false });
      }

      // Version 2: Add isEnabled field
      if (event.oldVersion < 2) {
        const store = tx.objectStore(STORE_NAME);

        // Migrate existing records to have isEnabled: true
        store.openCursor().onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const record = cursor.value;
            if (record.isEnabled === undefined) {
              record.isEnabled = true; // Default existing images to enabled
              cursor.update(record);
            }
            cursor.continue();
          }
        };
      }
    };
  });

  return dbPromise;
}
```
**Source:** [MDN IndexedDB version upgrades](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage | chrome.storage.sync | MV3 era (2021+) | Cross-device sync, no serialization needed, quota management |
| Manual change detection | storage.watch() / onChanged | WXT 0.19+ (2024) | Real-time synchronization, less boilerplate |
| react-color (13KB) | react-colorful (2.8KB) | v5.0 (2021+) | No CSS import, 80% smaller, TypeScript native |
| Uncontrolled forms | Controlled components | React 16.8+ hooks | Predictable state, easier validation |
| Boolean index queries | In-memory filtering | IndexedDB limitation | Accepted pattern for small datasets (<1000 items) |

**Deprecated/outdated:**
- chrome.storage without prefixes in WXT - WXT requires `local:`, `sync:`, etc. prefixes
- react-colorful v4 CSS imports - v5+ includes styles automatically
- IndexedDB wrapper libraries (idb, dexie) - Native API required for service worker compatibility (Phase 2 decision)

## Open Questions

Things that couldn't be fully resolved:

1. **Color picker placement in UI**
   - What we know: react-colorful provides HexColorPicker component, ~100px square default size
   - What's unclear: Whether to show inline, in popover, or full-width. User context says "Claude's discretion" for color picker implementation
   - Recommendation: Start with inline placement (always visible), add popover in Phase 5 if users request it. Inline is simpler, no click-to-open required.

2. **Settings save pattern (auto-save vs explicit)**
   - What we know: chrome.storage is fast (<10ms for small values), storage.watch enables real-time sync
   - What's unclear: User expectation - should changes save immediately (Google Drive style) or require "Save" button (traditional form)
   - Recommendation: Immediate auto-save for toggles (user expects instant effect), 300ms debounced auto-save for color picker (avoid excessive writes during drag). Display subtle "Saved" indicator for user confidence. No "Save" button needed - reduces cognitive load.

3. **Visual treatment for enabled/disabled images**
   - What we know: ImageList already renders images, has delete button for user-uploaded images
   - What's unclear: Should disabled images show opacity/grayscale overlay, or is switch control sufficient?
   - Recommendation: Switch control only (no visual treatment on image). Visual overlay creates confusion - does it mean "disabled" or "bad quality"? Switch clearly indicates state, and preview doesn't need to change.

## Sources

### Primary (HIGH confidence)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) - Official Chrome documentation
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) - Official MDN Web Docs
- [WXT Storage](https://wxt.dev/storage) - Official WXT framework documentation
- [React Documentation](https://react.dev/learn/managing-state) - Official React documentation

### Secondary (MEDIUM confidence)
- [react-colorful npm](https://www.npmjs.com/package/react-colorful) - Package documentation
- [IndexedDB boolean filtering](https://github.com/jurca/indexed-db.es6/issues/17) - GitHub issue discussing limitation
- [Shadcn UI Switch](https://www.shadcn.io/ui/switch) - Component documentation
- [React Hook Form pitfalls](https://alexhooley.com/blog/react-hook-form-common-mistakes) - Best practices article

### Tertiary (LOW confidence)
- WebSearch results on storage patterns (2026) - Multiple sources agree on chrome.storage.sync for settings
- WebSearch results on React debouncing (2026) - Consistent pattern across multiple sources
- Community discussions on color picker libraries - react-colorful widely recommended for 2026

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation for chrome.storage, WXT, IndexedDB. Established patterns.
- Architecture: HIGH - Patterns verified in official docs (WXT, Chrome, MDN). Already using IndexedDB from Phase 2.
- Pitfalls: MEDIUM - Boolean index limitation verified in GitHub issue. Other pitfalls based on common React/storage patterns but not specific to this exact use case.

**Research date:** 2026-01-19
**Valid until:** Approximately 60 days (stable technologies, but check for WXT framework updates)
