# Architecture Research: Browser Extension

**Domain:** Cross-browser extension (Chrome, Safari, Edge, Firefox)
**Researched:** 2026-01-19
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Extension UI Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Popup      │  │   Options    │  │   Content    │          │
│  │   (React)    │  │   Page       │  │   Script     │          │
│  │              │  │   (React)    │  │   (React)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    Message Passing                              │
│             (runtime.sendMessage / tabs.sendMessage)            │
│                           │                                     │
├───────────────────────────┼─────────────────────────────────────┤
│                           ▼                                     │
│                  ┌──────────────────┐                           │
│                  │  Service Worker  │                           │
│                  │  (Background)    │                           │
│                  │                  │                           │
│                  │  - Event handler │                           │
│                  │  - State manager │                           │
│                  │  - API bridge    │                           │
│                  └────────┬─────────┘                           │
│                           │                                     │
├───────────────────────────┼─────────────────────────────────────┤
│                           ▼                                     │
│                    Storage Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  chrome.     │  │  IndexedDB   │  │  File APIs   │          │
│  │  storage.    │  │  (for large  │  │  (if needed) │          │
│  │  local       │  │   images)    │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Service Worker** | Background event handler, API orchestrator, central message router | TypeScript module, no direct DOM access, event-driven lifecycle |
| **Popup** | Quick actions UI, extension icon click handler | React app (300x600px typical), short-lived, can access all extension APIs |
| **Options Page** | Full settings UI, persistent configuration | React app in full tab, saved to chrome.storage.sync or .local |
| **Content Script** | DOM manipulation on web pages, full-screen overlay injection | React components injected into page DOM, isolated context, limited API access |
| **Storage Layer** | Data persistence (settings, images, state) | chrome.storage.local (≤10MB), IndexedDB (unlimited with permission) |

## Recommended Project Structure

```
src/
├── manifest.json              # Extension configuration (Manifest V3)
├── background/                # Service Worker
│   ├── index.ts              # Entry point, event listeners
│   ├── messageRouter.ts      # Handles incoming messages
│   └── stateManager.ts       # Manages extension state
├── popup/                     # Popup UI
│   ├── index.tsx             # React entry point
│   ├── App.tsx               # Main popup component
│   └── components/           # UI components
├── options/                   # Settings page
│   ├── index.tsx             # React entry point
│   ├── App.tsx               # Main options component
│   └── components/           # Settings UI components
├── content/                   # Content scripts
│   ├── index.tsx             # Entry point, injection logic
│   ├── ScreenSaver.tsx       # Full-screen overlay component
│   └── contentBridge.ts      # Communication with background
├── shared/                    # Shared code
│   ├── types/                # TypeScript definitions
│   ├── storage/              # Storage abstraction
│   │   ├── chromeStorage.ts # chrome.storage wrapper
│   │   └── imageDB.ts        # IndexedDB for images
│   ├── messages/             # Message protocol definitions
│   └── constants.ts          # Shared constants
└── assets/                    # Static assets
    ├── icons/                # Extension icons
    └── styles/               # Global styles
```

### Structure Rationale

- **background/:** Service worker must be event-driven (no persistent state). All communication flows through here.
- **popup/ & options/:** Separate React apps with different lifecycles. Popup is ephemeral, options is persistent.
- **content/:** Isolated from page JavaScript. Uses React for UI but must inject carefully to avoid conflicts.
- **shared/:** Common code that all contexts need. Critical for message protocol and storage abstractions.

## Architectural Patterns

### Pattern 1: Message-Based Architecture

**What:** All communication between extension components uses Chrome's message passing APIs. Components never directly call each other.

**When to use:** Always, for all inter-component communication in browser extensions.

**Trade-offs:**
- **Pro:** Required by browser security model, enables loose coupling, supports async operations naturally
- **Con:** More verbose than direct function calls, requires careful message protocol design

**Example:**
```typescript
// Content script requests image list
chrome.runtime.sendMessage(
  { type: 'GET_IMAGES' },
  (response) => {
    setImages(response.images);
  }
);

// Background service worker responds
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_IMAGES') {
    getImagesFromStorage().then(images => {
      sendResponse({ images });
    });
    return true; // Keep channel open for async response
  }
});
```

### Pattern 2: Centralized State Management in Service Worker

**What:** Service worker maintains canonical state. UI components (popup, content script) are stateless views that request data on mount.

**When to use:** When multiple UI contexts need consistent data (e.g., settings used by both popup and content script).

**Trade-offs:**
- **Pro:** Single source of truth, prevents state desync, survives popup close/reopen
- **Con:** Adds latency (must message for data), service worker can be terminated (must persist to storage)

**Example:**
```typescript
// Service worker maintains state
let extensionState = {
  isActive: false,
  currentImages: [],
  settings: null
};

// On startup, restore from storage
chrome.storage.local.get(['state'], (result) => {
  extensionState = result.state || extensionState;
});

// Content script requests state on mount
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
  // Render with fresh state
});
```

### Pattern 3: Storage Abstraction Layer

**What:** Wrap storage APIs (chrome.storage, IndexedDB) behind async functions that handle serialization, errors, and quota limits.

**When to use:** Always. Raw storage APIs are verbose and error-prone.

**Trade-offs:**
- **Pro:** Easier testing, consistent error handling, can switch storage backends easily
- **Con:** One more layer of indirection

**Example:**
```typescript
// shared/storage/chromeStorage.ts
export async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// shared/storage/imageDB.ts
export async function saveImage(id: string, blob: Blob): Promise<void> {
  const db = await openImageDB();
  const tx = db.transaction('images', 'readwrite');
  await tx.objectStore('images').put({ id, blob, timestamp: Date.now() });
}
```

### Pattern 4: Content Script Isolation with Shadow DOM

**What:** Content scripts render UI into a Shadow DOM container to isolate styles from host page.

**When to use:** When injecting complex UI (like full-screen overlays) into arbitrary web pages.

**Trade-offs:**
- **Pro:** Prevents CSS conflicts, protects extension UI from page manipulation
- **Con:** More complex setup, slightly more code

**Example:**
```typescript
// content/index.tsx
function injectScreenSaver() {
  // Create isolated container
  const container = document.createElement('div');
  container.id = 'screen-saver-extension-root';
  document.body.appendChild(container);

  // Attach shadow root for style isolation
  const shadowRoot = container.attachShadow({ mode: 'open' });
  const reactRoot = document.createElement('div');
  shadowRoot.appendChild(reactRoot);

  // Inject styles into shadow DOM
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('content/styles.css');
  shadowRoot.appendChild(styleLink);

  // Render React component
  ReactDOM.render(<ScreenSaver />, reactRoot);
}
```

### Pattern 5: Cross-Browser Compatibility with Polyfill

**What:** Write code targeting Firefox's `browser.*` API (Promise-based) and use the official polyfill for Chrome compatibility.

**When to use:** Always, for cross-browser extensions targeting Firefox and Chrome/Edge.

**Trade-offs:**
- **Pro:** Cleaner Promise-based code, broad browser support, official Mozilla polyfill
- **Con:** Requires bundling polyfill (~20KB), slight runtime overhead

**Example:**
```typescript
// Install: npm install webextension-polyfill
import browser from 'webextension-polyfill';

// Works in all browsers (Promise-based)
async function getStoredImages() {
  const result = await browser.storage.local.get('images');
  return result.images || [];
}

// Message passing (Promise-based)
const response = await browser.runtime.sendMessage({ type: 'ACTIVATE' });
```

## Data Flow

### Request Flow: Activating Screen Saver

```
[User clicks popup button]
    ↓
[Popup] ─── sendMessage('ACTIVATE') ──→ [Service Worker]
                                              ↓
                                     [Validate state]
                                              ↓
                                     [Get active tab]
                                              ↓
[Content Script] ←── tabs.sendMessage ───────┘
    ↓
[Inject Shadow DOM]
    ↓
[Render full-screen overlay]
    ↓
[Request images] ─── sendMessage('GET_IMAGES') ──→ [Service Worker]
                                                          ↓
                                                  [Query IndexedDB]
                                                          ↓
[Display images] ←──────── response({ images }) ─────────┘
```

### State Management Flow

```
[chrome.storage.local]
    ↓ (on startup)
[Service Worker State]
    ↓ (subscribe via messages)
[UI Components] ←→ [User Actions] ──→ [Message to Service Worker]
                                           ↓
                                    [Update State]
                                           ↓
                                    [Persist to Storage]
                                           ↓
                                    [Broadcast to listeners]
```

### Key Data Flows

1. **Settings persistence:** User changes settings in Options page → Message to Service Worker → Saved to chrome.storage.sync → Broadcast to all UI components
2. **Image upload:** User selects file in Options page → Read as Blob → Message to Service Worker with base64 data → Store in IndexedDB → Update image list
3. **Screen saver activation:** Popup sends activate message → Service Worker injects content script (if not present) → Content script renders overlay → Requests images → Service Worker fetches from IndexedDB → Content script displays

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 images | chrome.storage.local sufficient (each image ~500KB), simple array storage |
| 10-100 images | Move to IndexedDB, request "unlimitedStorage" permission, lazy load images in content script |
| 100+ images | Paginated loading, thumbnail generation, background compression, consider cloud sync |

### Scaling Priorities

1. **First bottleneck:** chrome.storage.local quota (10MB). Solution: Move images to IndexedDB, keep only metadata in chrome.storage.local.
2. **Second bottleneck:** Content script memory with many large images. Solution: Lazy load images (only load what's displayed), preload next image in background.
3. **Third bottleneck:** Service worker termination losing state. Solution: Persist all critical state to storage immediately, restore on wake.

## Anti-Patterns

### Anti-Pattern 1: Direct DOM Manipulation Without Isolation

**What people do:** Content scripts inject UI directly into page DOM without Shadow DOM or unique class prefixes.

**Why it's wrong:**
- Host page CSS can break extension UI
- Extension CSS can break host page
- Page JavaScript can manipulate extension UI
- Namespace collisions with IDs and classes

**Do this instead:**
- Use Shadow DOM for style isolation (recommended)
- Or use highly specific class prefixes (e.g., `__screen-saver-ext-overlay`)
- Or inject iframe with extension page (more isolation but more overhead)

### Anti-Pattern 2: Storing Large Data in chrome.storage

**What people do:** Store image Blobs or base64-encoded images in chrome.storage.local.

**Why it's wrong:**
- 10MB quota exceeded quickly (20-30 images max)
- Slow serialization/deserialization
- chrome.storage.sync has even stricter limits (100KB per item)

**Do this instead:**
- Store images in IndexedDB (can store Blobs directly)
- Store only metadata (filename, upload date, ID) in chrome.storage
- Request "unlimitedStorage" permission for production use

### Anti-Pattern 3: Long-Running Background Scripts

**What people do:** Write service worker code expecting it to run continuously (e.g., setInterval for periodic tasks).

**Why it's wrong:**
- Service workers are event-driven and can be terminated at any time
- Manifest V3 requires service workers (no persistent background pages)
- Memory waste and battery drain

**Do this instead:**
- Use chrome.alarms API for periodic tasks (survives service worker termination)
- Store state in chrome.storage, restore on service worker wake
- Design for idempotency (service worker may restart mid-operation)

### Anti-Pattern 4: Synchronous Message Handlers

**What people do:** Use sendResponse() synchronously in message handlers that need to query storage or perform async operations.

**Why it's wrong:**
- sendResponse() only works synchronously or if you return true
- Forgetting `return true` causes response to fail silently
- Promise-based handlers are cleaner but Chrome support is recent

**Do this instead:**
```typescript
// Bad: Doesn't work (sendResponse called after handler returns)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  getDataFromStorage().then(data => {
    sendResponse({ data }); // Too late!
  });
});

// Good: Return true to keep channel open
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  getDataFromStorage().then(data => {
    sendResponse({ data });
  });
  return true; // Keep channel open for async
});

// Better: Use webextension-polyfill for Promise-based handlers
browser.runtime.onMessage.addListener(async (msg) => {
  const data = await getDataFromStorage();
  return { data }; // Automatically handled
});
```

### Anti-Pattern 5: Separate Manifest Files Per Browser

**What people do:** Maintain completely separate manifest.json files for each browser.

**Why it's wrong:**
- Duplicate maintenance burden
- Easy to introduce inconsistencies
- Most fields are identical across browsers

**Do this instead:**
- Start with single manifest targeting Manifest V3 standard
- Use build tool (e.g., Vite, webpack) to inject browser-specific fields at build time
- Only override truly different fields (e.g., `browser_specific_settings` for Firefox)

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    {
      name: 'manifest-transform',
      generateBundle() {
        const baseManifest = JSON.parse(readFileSync('src/manifest.json'));

        // Firefox-specific additions
        if (process.env.TARGET === 'firefox') {
          baseManifest.browser_specific_settings = {
            gecko: { id: 'screen-saver@example.com' }
          };
        }

        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(baseManifest, null, 2)
        });
      }
    }
  ]
});
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| IndexedDB | Direct API access in all contexts | Available in service worker, popup, options, content scripts |
| chrome.storage API | Wrapper in shared/storage | Use .sync for user preferences (synced across devices), .local for images/state |
| chrome.tabs API | Service worker only | Content scripts must message service worker to manipulate tabs |
| chrome.action API | Service worker only | Used to set badge text, icon, enable/disable extension button |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Popup ↔ Service Worker | runtime.sendMessage() | Popup closes when focus lost, must re-query state on open |
| Options ↔ Service Worker | runtime.sendMessage() | Options page can stay open, consider long-lived connection |
| Content Script ↔ Service Worker | runtime.sendMessage() (from CS), tabs.sendMessage() (to CS) | Content script has sender.tab metadata |
| Content Script ↔ Host Page | window.postMessage() only | Never share chrome.* APIs with host page (security risk) |
| Service Worker ↔ Storage | Direct async/await | Service worker can access all storage APIs directly |

## Cross-Browser Compatibility Strategy

### Manifest V3 as Common Ground

All target browsers (Chrome 88+, Firefox 109+, Safari 15.4+, Edge 88+) support Manifest V3. This provides the best compatibility foundation.

### API Namespace Strategy

**Recommended approach:**

1. Install webextension-polyfill: `npm install webextension-polyfill`
2. Import as `browser` in all code
3. Write Promise-based code (cleaner than callbacks)
4. Polyfill handles Chrome's `chrome.*` namespace automatically

```typescript
// Works in all browsers
import browser from 'webextension-polyfill';

// All async operations return Promises
const tabs = await browser.tabs.query({ active: true });
const data = await browser.storage.local.get('key');
```

### Browser-Specific Considerations

| Browser | Key Differences | Mitigation |
|---------|-----------------|------------|
| **Chrome** | Uses chrome.* namespace, callback-based (pre-121) | Use webextension-polyfill |
| **Firefox** | Uses browser.* namespace, stricter CSP | Default target, most restrictive (good baseline) |
| **Safari** | Requires App Store distribution, different packaging | Build as separate target, additional permissions may be needed |
| **Edge** | Based on Chromium, identical to Chrome | Same build as Chrome |

### Testing Strategy

1. **Develop on Firefox** (strictest APIs, best devtools for extensions)
2. **Test on Chrome** (largest user base)
3. **Test on Safari** (most different, catches edge cases)
4. **Edge** usually works if Chrome works

## Production Considerations

### Permission Strategy

**Minimum permissions for screen saver extension:**

```json
{
  "permissions": [
    "storage",           // For chrome.storage.local and .sync
    "activeTab"          // For injecting into current tab
  ],
  "optional_permissions": [
    "unlimitedStorage"   // For large image collections
  ]
}
```

**Avoid requesting:**
- `tabs` permission (privacy concern, use `activeTab` instead)
- `<all_urls>` host permission (security red flag, use `activeTab`)

### Content Security Policy

Manifest V3 enforces strict CSP:
- No inline scripts
- No `eval()`
- No remote code execution
- All code must be bundled with extension

**For React + TypeScript:**
- Use Vite or webpack to bundle
- Ensure no dynamic `eval()` in dependencies
- Inline styles are OK (CSP applies to `<script>`, not `<style>`)

### Build Order for This Project

**Recommended build order based on dependencies:**

1. **Storage layer** (`shared/storage/`) - Foundation for everything
2. **Message protocol** (`shared/messages/`) - Defines communication contracts
3. **Service worker** (`background/`) - Central coordinator
4. **Options page** (`options/`) - Needed to upload images before testing content script
5. **Content script** (`content/`) - Depends on images existing in storage
6. **Popup** (`popup/`) - Last, as it's just a trigger mechanism

**Rationale:**
- Options page needed first to populate images
- Content script depends on storage + service worker + images
- Popup is simplest component (just sends activate message)

## Sources

### Official Documentation (HIGH confidence)
- [Chrome Extensions: Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Chrome: Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [Chrome: Content Scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Chrome: Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [Chrome: Action API](https://developer.chrome.com/docs/extensions/reference/api/action)
- [Mozilla: Build Cross-Browser Extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension)
- [Mozilla: Content Scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
- [Mozilla: Options Pages](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Options_pages)
- [Mozilla: Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage)

### Modern Development (MEDIUM confidence)
- [Building Browser Extensions in 2025: Tools and Architecture](https://nitiweb.net/blog/browser-extension-development-2025)
- [Build Chrome Extensions with React and Vite in 2025](https://arg-software.medium.com/building-a-chrome-extension-with-react-and-vite-a-modern-developers-guide-83f98ee937ed)
- [The 2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
- [Building Modern Cross Browser Web Extensions: Background Scripts and Messaging](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-background-scripts-and-messaging/)

### Community Resources (MEDIUM confidence)
- [Understanding Chrome Extensions Background Scripts](https://m2kdevelopments.medium.com/4-understanding-chrome-extensions-background-scripts-a28dc496b434)
- [How to Communicate Between Content Script, Popup, and Background](https://saisandeepvaddi.com/blog/how-to-communicate-between-content-script-popup-background-in-web-extensions)
- [Understanding Chrome Extensions Storage](https://m2kdevelopments.medium.com/12-understanding-chrome-extensions-storage-93f0e3daa67e)
- [Local vs Sync vs Session: Which Chrome Extension Storage Should You Use?](https://dev.to/notearthian/local-vs-sync-vs-session-which-chrome-extension-storage-should-you-use-5ec8)

---
*Architecture research for: Cross-browser screen saver extension*
*Researched: 2026-01-19*
