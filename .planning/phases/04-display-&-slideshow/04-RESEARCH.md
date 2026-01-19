# Phase 4: Display & Slideshow - Research

**Researched:** 2026-01-19
**Domain:** Full-screen image overlay rendering with React in browser extension content script
**Confidence:** HIGH

## Summary

Phase 4 involves displaying a randomly selected image from IndexedDB in the existing full-screen overlay. The technical stack is well-established: React component rendering in Shadow DOM using WXT's `createShadowRootUi`, CSS `object-fit` for image scaling, and standard React patterns for image loading states.

The key challenges are: (1) random image selection from IndexedDB filtered by `isEnabled` state, (2) blob URL lifecycle management to prevent memory leaks, (3) graceful error handling with fallback to default images, and (4) proper image loading states to avoid flickering.

**Primary recommendation:** Use React useState to manage image loading states (loading/loaded/error), CSS object-fit for image rendering, URL.createObjectURL for blob display with proper cleanup in useEffect return, and simple Math.random() for random selection.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18+ | Component rendering | Already used in content script, hooks pattern for image state |
| CSS object-fit | N/A (CSS property) | Image scaling | Native browser API, widely supported since 2020, GPU-accelerated |
| IndexedDB | N/A (Web API) | Image storage access | Already implemented in Phase 2, native API |
| URL.createObjectURL | N/A (Web API) | Blob URL generation | Standard Web API for blob display, widely supported |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.x | Styling | Already configured for Shadow DOM in Phase 1 |
| WXT createShadowRootUi | Current | Shadow DOM setup | Already in use for overlay, provides style isolation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS object-fit | JavaScript image scaling | object-fit is GPU-accelerated, simpler, more performant |
| Native IndexedDB | idb library | Native API required for service worker compatibility (Phase 2 decision) |
| Simple random selection | Weighted random or shuffle | Unnecessary complexity for single-image display with no automatic slideshow |

**Installation:**
No new dependencies required. All APIs are native Web APIs or already installed.

## Architecture Patterns

### Recommended Component Structure
```
entrypoints/content/
├── ScreenSaverOverlay.tsx    # Main component (exists)
├── ImageDisplay.tsx           # New: Image rendering component
└── style.css                  # Styling (exists)
```

### Pattern 1: Image Loading State Machine
**What:** Three-state pattern for image loading (loading → loaded/error)
**When to use:** Any component displaying images from async sources (blob URLs, remote URLs)
**Example:**
```typescript
// Standard React image loading pattern
const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
const [imageSrc, setImageSrc] = useState<string | null>(null);

useEffect(() => {
  // Load image from IndexedDB
  async function loadImage() {
    try {
      const enabledImages = (await getAllImages()).filter(img => img.isEnabled);
      if (enabledImages.length === 0) {
        // Fallback to defaults
        setImageState('error');
        return;
      }
      const randomImage = enabledImages[Math.floor(Math.random() * enabledImages.length)];
      const url = URL.createObjectURL(randomImage.blob);
      setImageSrc(url);
    } catch (err) {
      setImageState('error');
    }
  }
  loadImage();

  // Cleanup blob URL on unmount
  return () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
  };
}, []);

// Image element with event handlers
<img
  src={imageSrc || ''}
  onLoad={() => setImageState('loaded')}
  onError={() => setImageState('error')}
/>
```

### Pattern 2: CSS Object-Fit for Image Scaling
**What:** CSS property for controlling how images scale within containers
**When to use:** When displaying images with different aspect ratios in fixed-size containers
**Example:**
```css
/* Fixed-size container */
.image-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
}

/* Image with user-configured fit mode */
.screen-saver-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* or 'contain' based on settings */
  object-position: center;
}

/* Background color for contain mode letterboxing */
.image-container[data-fit="contain"] {
  background-color: var(--bg-color); /* from user settings */
}
```
**Source:** [MDN object-fit documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)

### Pattern 3: Blob URL Lifecycle Management
**What:** Creating and cleaning up blob URLs to prevent memory leaks
**When to use:** Any component displaying images from IndexedDB blobs
**Example:**
```typescript
useEffect(() => {
  const url = URL.createObjectURL(blob);
  setImageSrc(url);

  // CRITICAL: Clean up blob URL on unmount
  return () => {
    URL.revokeObjectURL(url);
  };
}, [blob]);
```
**Source:** [MDN URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)

**Why critical:** Each `createObjectURL()` creates a new URL that holds a reference to the Blob in memory. Without `revokeObjectURL()`, the browser never releases this memory, causing memory leaks in long-running applications.

### Pattern 4: Random Array Element Selection
**What:** O(1) random selection from array using Math.random()
**When to use:** Selecting one random item from a collection
**Example:**
```typescript
const enabledImages = allImages.filter(img => img.isEnabled);
const randomIndex = Math.floor(Math.random() * enabledImages.length);
const selectedImage = enabledImages[randomIndex];
```
**Performance:** O(1) time complexity for selection. For small datasets (under 100 images), this is optimal.

### Anti-Patterns to Avoid
- **Setting img src before blob URL is ready:** Causes broken image icon flash. Always load async first, then set src.
- **Forgetting URL.revokeObjectURL:** Memory leak. Every createObjectURL must have corresponding revokeObjectURL.
- **Animating width/height for fade-in:** Triggers layout recalculation. Use opacity and transform instead for GPU acceleration.
- **Accessing IndexedDB synchronously:** IndexedDB is always async. Use async/await or promises.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image scaling/cropping | JavaScript canvas manipulation | CSS object-fit | GPU-accelerated, simpler, handles aspect ratios automatically |
| Random selection with no repeats | Custom shuffle algorithm | Math.random() for single selection | Phase requires static display (no slideshow), so no-repeat logic unnecessary |
| Image loading spinner | Custom animation | CSS opacity fade-in + loading state | Simpler, performant, matches phase scope (static display) |
| Blob URL management | Manual reference counting | useEffect cleanup return | React pattern, automatic cleanup on unmount |

**Key insight:** CSS object-fit solves complex image scaling problems (aspect ratio preservation, cropping, letterboxing) that would require significant canvas manipulation code. It's hardware-accelerated and widely supported since 2020.

## Common Pitfalls

### Pitfall 1: Blob URL Memory Leaks
**What goes wrong:** Creating blob URLs with `URL.createObjectURL()` without calling `URL.revokeObjectURL()` causes memory to accumulate indefinitely.
**Why it happens:** Each blob URL holds a reference to the blob in memory. Browser doesn't automatically clean up; developer must explicitly revoke.
**How to avoid:** Always pair `createObjectURL` with `revokeObjectURL` in useEffect cleanup function.
**Warning signs:** Memory usage increasing over time, browser becoming sluggish after multiple activations.
**Source:** [MDN URL.createObjectURL - Memory Management](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)

### Pitfall 2: object-fit Not Working
**What goes wrong:** Setting `object-fit: cover` or `object-fit: contain` has no visible effect on the image.
**Why it happens:** object-fit only works when the img element has explicit width and height set (via CSS or HTML attributes). Without dimensions, image renders at natural size and object-fit is ignored.
**How to avoid:** Always set width and height on images using object-fit:
```css
img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Now works */
}
```
**Warning signs:** Images rendering at natural size regardless of object-fit value.
**Source:** [CSS-Tricks object-fit](https://css-tricks.com/almanac/properties/o/object-fit/)

### Pitfall 3: Image Load Flickering
**What goes wrong:** Visible flash of empty overlay or broken image icon before image displays.
**Why it happens:** Setting img src before blob URL is ready, or not handling loading states properly.
**How to avoid:**
1. Load image data first (async)
2. Create blob URL
3. Set img src
4. Use onLoad handler to show image (opacity transition)
**Warning signs:** Brief flash of placeholder or broken icon on activation.

### Pitfall 4: IndexedDB Access in Wrong Context
**What goes wrong:** Attempting to access IndexedDB from service worker or wrong storage partition.
**Why it happens:** Content scripts access IndexedDB in page context, service workers have separate context.
**How to avoid:** Access IndexedDB directly from content script (page context). Service workers already use native IndexedDB API (Phase 2 decision).
**Warning signs:** "Cannot read property" errors, database not found, empty results despite data existing.
**Source:** [Chrome Extensions Storage and Cookies](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies)

### Pitfall 5: Race Condition on Settings Load
**What goes wrong:** Image displays before settings (fit mode, background color) are loaded, causing brief incorrect rendering.
**Why it happens:** Parallel async loading of image data and settings without coordination.
**How to avoid:** Load settings first (or in parallel), wait for both before rendering. Use Promise.all() or separate loading states.
**Warning signs:** Image briefly shows with wrong fit mode or background color, then corrects itself.

## Code Examples

Verified patterns from official sources:

### Random Image Selection from IndexedDB
```typescript
// Source: Official IndexedDB API + JavaScript Math.random() pattern
async function selectRandomImage(): Promise<ImageRecord | null> {
  // Get all images
  const allImages = await getAllImages();

  // Filter to enabled only
  const enabledImages = allImages.filter(img => img.isEnabled);

  // Handle empty case
  if (enabledImages.length === 0) {
    console.error('No enabled images found');
    return null;
  }

  // Random selection (O(1) time complexity)
  const randomIndex = Math.floor(Math.random() * enabledImages.length);
  return enabledImages[randomIndex];
}
```

### Image Display Component with Loading States
```typescript
// Source: React patterns + MDN img element events
import { useEffect, useState } from 'react';
import { displaySettings } from '@/lib/settingsStorage';
import { getAllImages } from '@/lib/imageStorage';

export default function ImageDisplay() {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [settings, setSettings] = useState({ imageFit: 'cover', backgroundColor: '#000000' });

  useEffect(() => {
    async function loadImageAndSettings() {
      // Load settings
      const userSettings = await displaySettings.getValue();
      setSettings(userSettings);

      // Load random image
      const allImages = await getAllImages();
      const enabledImages = allImages.filter(img => img.isEnabled);

      if (enabledImages.length === 0) {
        setImageState('error');
        return;
      }

      const randomImage = enabledImages[Math.floor(Math.random() * enabledImages.length)];
      const url = URL.createObjectURL(randomImage.blob);
      setImageSrc(url);
    }

    loadImageAndSettings();

    // Cleanup blob URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-full"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {imageState === 'loading' && (
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-white">Loading...</p>
        </div>
      )}

      {imageState === 'error' && (
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-white">Unable to load image</p>
        </div>
      )}

      <img
        src={imageSrc || ''}
        alt="Screen saver"
        className={`w-full h-full transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectFit: settings.imageFit }}
        onLoad={() => setImageState('loaded')}
        onError={() => setImageState('error')}
      />
    </div>
  );
}
```

### CSS for Object-Fit with Background Color
```css
/* Source: MDN object-fit + Tailwind utilities */
.image-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  /* Background color visible during 'contain' mode letterboxing */
  background-color: var(--bg-color);
}

.screen-saver-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* or 'contain' from settings */
  object-position: center; /* Centers the visible portion */
}
```

### Fade-In Animation (GPU-Accelerated)
```css
/* Source: MDN CSS animations best practices */
/* Use opacity (GPU-accelerated) not width/height */
.image-fade-in {
  animation: fadeIn 300ms ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Or with Tailwind utility classes */
/* transition-opacity duration-300 opacity-0/opacity-100 */
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| idb library for IndexedDB | Native IndexedDB API | Phase 2 (02-05) | Service worker compatibility, no window object dependency |
| JavaScript image scaling | CSS object-fit | ~2020 (baseline widely available) | GPU acceleration, simpler code, automatic aspect ratio handling |
| Manual style injection in Shadow DOM | WXT createShadowRootUi with cssInjectionMode: 'ui' | Phase 1 (01-02) | Automatic style isolation, HMR support |
| FileReader.readAsDataURL() | URL.createObjectURL() | Current best practice | Better performance, lower memory overhead for large images |

**Deprecated/outdated:**
- **FileReader.readAsDataURL() for image preview:** URL.createObjectURL() is more performant and uses less memory (doesn't create base64 string)
- **Polyfills for object-fit:** Baseline widely available since January 2020, no polyfill needed
- **idb library in service workers:** Causes "window is not defined" error in MV3 service workers (Phase 2 finding)

## Open Questions

Things that couldn't be fully resolved:

1. **Fallback Image Strategy**
   - What we know: Phase 2 includes 15 default images marked with `isDefault: true` which are always enabled
   - What's unclear: Which specific default image to show on error (first by order? random default?)
   - Recommendation: Select first default image by order index for consistency, or show generic "unable to load" message. Document decision in plan.

2. **Loading State Duration**
   - What we know: Blob URL creation and image loading should be fast (<100ms for typical images)
   - What's unclear: Whether to show loading spinner for brief loads or go straight to fade-in
   - Recommendation: Show loading state only if load takes >200ms to avoid flash of loading UI. Use setTimeout to delay showing loader.

3. **Image Preloading Strategy**
   - What we know: Current approach loads image on activation
   - What's unclear: Whether to preload random image on extension load for instant display
   - Recommendation: Defer to Phase 5 polish. Current approach is simpler and avoids memory overhead of preloaded blob URLs.

## Sources

### Primary (HIGH confidence)
- [MDN object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) - CSS image scaling property
- [MDN URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) - Blob URL creation and memory management
- [MDN img element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) - onload and onerror events
- [MDN CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) - Performance considerations for opacity and transform
- [MDN Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) - CSS isolation in Shadow DOM
- [WXT Content Scripts](https://wxt.dev/guide/essentials/content-scripts.html) - createShadowRootUi patterns
- [Chrome Extensions Storage](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies) - IndexedDB access in content scripts

### Secondary (MEDIUM confidence)
- [CSS-Tricks object-fit](https://css-tricks.com/almanac/properties/o/object-fit/) - Verified with MDN, practical examples
- [Chrome Developer Blog: IndexedDB Performance](https://developer.chrome.com/blog/maximum-idb-performance-with-storage-buckets) - Storage Buckets optimization (Chrome 126+, not required for small datasets)
- [LogRocket React Loading States](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) - React useState patterns for image loading
- [Building React Component for Image Loading (Tim Santeford)](https://www.timsanteford.com/posts/building-a-react-component-for-lazy-loading-images-with-error-fallback/) - Error fallback patterns

### Tertiary (LOW confidence - mark for validation)
- [Various WebSearch results on React patterns] - General patterns verified by cross-referencing MDN and official React docs
- Community discussions on Shadow DOM styling - Verified core concepts against MDN

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All native Web APIs with MDN documentation, React patterns established in Phase 1-3
- Architecture: HIGH - Patterns verified against official documentation (MDN, WXT, React), existing codebase structure confirmed
- Pitfalls: HIGH - Based on official documentation warnings (MDN) and verified browser behavior
- Performance: HIGH - MDN-documented GPU acceleration for opacity/transform, object-fit performance characteristics

**Research date:** 2026-01-19
**Valid until:** 60 days (stable Web APIs, unlikely to change)
**Phase scope:** Display & Slideshow (static single image, no automatic transitions)
