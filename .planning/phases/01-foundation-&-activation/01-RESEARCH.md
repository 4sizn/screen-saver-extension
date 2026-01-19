# Phase 1: Foundation & Activation - Research

**Researched:** 2026-01-19
**Domain:** Cross-browser extension with WXT, activation mechanics, icon badge, full-screen overlay
**Confidence:** HIGH

## Summary

Phase 1 establishes the cross-browser extension infrastructure using WXT framework with React and TypeScript, implements icon-click activation/deactivation, displays a basic full-screen overlay, handles ESC key deactivation, and provides visual state feedback via icon badge.

The standard approach uses WXT's file-based entrypoint system with a background service worker handling chrome.action.onClicked events, content scripts injecting React-based overlays with Shadow DOM isolation, and the chrome.action.setBadgeBackgroundColor API for visual state indication. Cross-browser compatibility is achieved through WXT's built-in browser abstraction and webextension-polyfill.

**Primary recommendation:** Use WXT framework with Shadow DOM for content script UI, CSS fixed positioning (NOT Fullscreen API) for overlay, and service worker-based state management. Test on all target browsers from day one.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| WXT | ^0.20.x | Browser extension framework | Industry-leading framework in 2026. Framework-agnostic with superior HMR (even for service workers), active maintenance, auto-imports, and built-in multi-browser support (Chrome, Safari, Edge, Firefox). Vite-based for lightning-fast builds. |
| React | ^19.2.x | UI framework | Latest stable version (released Oct 2025). Modern hooks, fully compatible with Shadcn UI and WXT's React module. |
| TypeScript | ^5.8.x | Type system | Released Feb 2025. Improved performance in watch mode, better type checking. |
| webextension-polyfill | ^0.12.x | Cross-browser API compatibility | Essential for Firefox/Safari compatibility. Converts Chrome's callback-based APIs to Promises. Auto-detected on Firefox. |
| Shadcn UI | Latest | Component library | Copy-paste components built on Radix UI primitives. Accessible, customizable, you own the code. |
| Tailwind CSS | ^4.x | Styling framework | CSS-first configuration. Fully compatible with Shadcn UI v2026. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @wxt-dev/browser | Latest | Browser API types | Type-safe browser extension APIs. Auto-imported by WXT. Wrapper around webextension-polyfill. |
| @thedutchcoder/postcss-rem-to-px | Latest | Convert rem to px | Required for Shadow DOM styling. Tailwind's default rem units break inside injected Shadow DOM contexts. Set baseValue: 16. |

**Installation:**
```bash
# Initialize new WXT project with React template
npm create wxt@latest screen-saver-web -- --template react-ts

# Core dependencies
npm install webextension-polyfill

# Shadcn UI (initialize)
npx shadcn@latest init

# PostCSS plugins for Shadow DOM
npm install -D @thedutchcoder/postcss-rem-to-px

# Dev dependencies
npm install -D @types/webextension-polyfill
```

## Architecture Patterns

### Recommended Project Structure
```
entrypoints/
├── background.ts              # Service worker (event handler)
├── content/                   # Content script (overlay injection)
│   ├── index.tsx             # Entry point
│   ├── ScreenSaverOverlay.tsx # Full-screen React component
│   └── style.css             # Overlay styles
└── options/                   # Settings page (Phase 3)
    └── index.html

lib/                          # Shared code
├── storage.ts                # Storage abstraction
├── messages.ts               # Message protocol
└── constants.ts              # Shared constants

components/
└── ui/                       # Shadcn UI components

public/
└── icon/                     # Extension icons
    ├── 16.png
    ├── 32.png
    ├── 48.png
    └── 128.png

wxt.config.ts                 # WXT configuration
```

### Pattern 1: WXT File-Based Entrypoints

**What:** WXT auto-discovers entrypoints from `entrypoints/` directory. No manual manifest.json editing required.

**When to use:** Always with WXT. It's the framework's core feature.

**Example:**
```typescript
// entrypoints/background.ts
export default defineBackground({
  type: 'module',
  main() {
    // Event listeners registered here
    browser.action.onClicked.addListener(handleIconClick);
  },
});
```

**Source:** [WXT Entrypoints Documentation](https://wxt.dev/guide/essentials/entrypoints.html)

### Pattern 2: Icon Click Without Popup

**What:** chrome.action.onClicked fires when icon is clicked, but ONLY if no popup is configured.

**When to use:** Toggle activation via icon click without showing UI.

**Key requirement:** Omit `default_popup` from manifest action configuration.

**Example:**
```typescript
// entrypoints/background.ts
browser.action.onClicked.addListener(async (tab) => {
  const isActive = await getActivationState(tab.id);

  if (isActive) {
    await deactivateScreenSaver(tab.id);
  } else {
    await activateScreenSaver(tab.id);
  }
});
```

**Sources:**
- [chrome.action API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/action)
- [action.onClicked - MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/action/onClicked)

### Pattern 3: Badge for Visual State

**What:** Display colored badge on extension icon to show active/inactive state.

**When to use:** Persistent visual indicator of extension state.

**Implementation:**
```typescript
// Set badge color (inactive: gray, active: green)
await browser.action.setBadgeBackgroundColor({
  color: '#6B7280',  // Gray for inactive
  tabId: tab.id
});

await browser.action.setBadgeText({
  text: ' ',  // Single space creates dot appearance
  tabId: tab.id
});

// Active state
await browser.action.setBadgeBackgroundColor({
  color: '#22C55E',  // Green for active
  tabId: tab.id
});
```

**Key details:**
- Badge text limited to ~4 characters
- Single space `' '` creates circular dot appearance
- Can be set per-tab (recommended) or globally
- Use hex colors or RGBA arrays
- Must set both backgroundColor AND text (empty string clears badge)

**Sources:**
- [chrome.action.setBadgeText() - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/action)
- [browserAction.setBadgeBackgroundColor() - MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setBadgeBackgroundColor)

### Pattern 4: Full-Screen Overlay with Shadow DOM

**What:** Inject React component into page as fixed-position overlay using WXT's createShadowRootUi.

**When to use:** Full-screen UI that must be isolated from page styles.

**CRITICAL: Do NOT use Fullscreen API** - it requires user interaction and will fail on programmatic activation.

**Example:**
```typescript
// entrypoints/content/index.tsx
import './style.css';
import ReactDOM from 'react-dom/client';
import ScreenSaverOverlay from './ScreenSaverOverlay';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'screen-saver-overlay',
      position: 'overlay',
      anchor: 'body',

      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<ScreenSaverOverlay />);
        return root;
      },

      onRemove: (root) => {
        root?.unmount();
      },
    });

    // Listen for activation messages
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'ACTIVATE') {
        ui.mount();
      } else if (message.type === 'DEACTIVATE') {
        ui.remove();
      }
    });
  },
});
```

**Overlay CSS:**
```css
/* entrypoints/content/style.css */
/* IMPORTANT: rem units converted to px by postcss plugin for Shadow DOM */
.overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2147483647; /* Maximum safe z-index */
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Why Shadow DOM:**
- Isolates extension styles from page CSS
- Prevents page JavaScript from manipulating extension UI
- Required for Tailwind CSS (rem units need conversion)

**Why CSS overlay NOT Fullscreen API:**
- Fullscreen API requires user interaction (requestFullscreen must be called from click handler)
- Programmatic activation (icon click, timer) will fail
- Security restrictions prevent extensions from bypassing this

**Sources:**
- [WXT Content Script UI](https://wxt.dev/guide/key-concepts/content-script-ui.html)
- [Fullscreen API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) (explains user interaction requirement)
- From PITFALLS.md: Fullscreen API User Interaction Requirement

### Pattern 5: ESC Key Deactivation

**What:** Listen for keyboard events in overlay to deactivate on ESC press.

**When to use:** Standard deactivation pattern for overlays.

**Example:**
```typescript
// entrypoints/content/ScreenSaverOverlay.tsx
import { useEffect } from 'react';

export default function ScreenSaverOverlay() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        browser.runtime.sendMessage({ type: 'DEACTIVATE' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="overlay-container">
      {/* Overlay content */}
    </div>
  );
}
```

**Key details:**
- Event listener on window, not just overlay element
- Clean up listener on unmount
- Send message to background to update badge state

### Pattern 6: Browser Notifications

**What:** Show system notification when screen saver activates.

**When to use:** Provide activation feedback to user.

**Example:**
```typescript
// entrypoints/background.ts
await browser.notifications.create({
  type: 'basic',
  iconUrl: browser.runtime.getURL('icon/48.png'),
  title: '스크린세이버 활성화',
  message: '화면 보호가 시작되었습니다. ESC 키를 눌러 종료하세요.',
  priority: 0  // Normal priority
});
```

**Permissions required:**
```json
{
  "permissions": ["notifications"]
}
```

**Key details:**
- Notification automatically dismissed after ~8 seconds (browser-dependent)
- On macOS, shows native system notification
- Silent on deactivation (per requirements)

**Sources:**
- [chrome.notifications API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/notifications)
- [Use the Notifications API - Chrome Developers](https://developer.chrome.com/docs/extensions/how-to/ui/notifications)

### Pattern 7: Audio Playback in Extensions

**What:** Play click sound when screen saver activates.

**When to use:** Audio feedback for activation.

**Example:**
```typescript
// entrypoints/background.ts
// Audio can play in background script (service worker)
const audio = new Audio(browser.runtime.getURL('sounds/click.mp3'));
audio.volume = 0.5;
await audio.play();
```

**Alternative with Web Audio API (more control):**
```typescript
const audioContext = new AudioContext();
const response = await fetch(browser.runtime.getURL('sounds/click.mp3'));
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(audioContext.destination);
source.start(0);
```

**Key details:**
- Audio files must be in `public/` directory
- Reference with `browser.runtime.getURL()`
- HTML5 Audio API works in service workers
- Web Audio API provides volume/effects control

**Sources:**
- [Play Sounds with JavaScript](https://flukeout.github.io/simple-sounds/)
- [How to Play a Sound Using JavaScript: Complete 2026 Guide](https://copyprogramming.com/howto/html-how-to-play-a-sound-using-javascript)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-browser API compatibility | Manual browser detection and conditional code | webextension-polyfill + WXT browser abstraction | Handles namespace differences (chrome.* vs browser.*), callback-to-promise conversion, browser-specific quirks. 20KB polyfill saves weeks of debugging. |
| Manifest generation | Manual manifest.json maintenance per browser | WXT file-based entrypoints | Auto-generates browser-specific manifests from entrypoint files. Eliminates duplicate manifest maintenance. |
| Shadow DOM setup for content scripts | Manual Shadow DOM creation and style injection | WXT's createShadowRootUi | Handles Shadow DOM lifecycle, style injection, HMR, and cleanup automatically. |
| rem to px conversion for Shadow DOM | Manual CSS calculation or inline styles | @thedutchcoder/postcss-rem-to-px | Shadow DOM rem units reference host page font-size, breaking layouts. Plugin converts at build time. |
| Message passing boilerplate | Manual sendMessage/onMessage handlers with callbacks | Type-safe message protocol wrapper | Prevent message type mismatches, ensure return true for async, handle errors consistently. |

**Key insight:** Browser extensions have unique architectural constraints (isolated contexts, async message passing, cross-browser quirks). Frameworks like WXT exist specifically to handle these. Don't reinvent solutions to framework-specific problems.

## Common Pitfalls

### Pitfall 1: Using Fullscreen API for Overlay

**What goes wrong:** Extension calls `requestFullscreen()` to create full-screen overlay. Works when testing with manual clicks, but fails when activated by icon click or timer. Console shows "Request for fullscreen was denied because Element.requestFullscreen() was not called from inside a short running user-generated event handler."

**Why it happens:** Security restriction prevents extensions from hijacking screen without explicit user interaction. Fullscreen API REQUIRES the call to originate from a user event handler (click, keypress) with "transient activation" (consumed within ~5 seconds).

**How to avoid:**
- Use CSS fixed positioning, NOT Fullscreen API
- Set `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647;`
- Accept that overlay appears within browser chrome (not truly fullscreen)
- Understand this is a security feature, not a bug

**Warning signs:**
- Testing only with manual clicks (works) but failing on programmatic triggers
- Console errors mentioning "user-generated event handler" or "transient activation"

**Source:** PITFALLS.md - Fullscreen API User Interaction Requirement

### Pitfall 2: CSS Stacking Context Issues

**What goes wrong:** Overlay has `z-index: 999999999` but appears BEHIND page content on some sites (Gmail, Facebook, Google Docs). Works on simple pages, fails on complex web apps.

**Why it happens:** CSS stacking contexts are atomic. If a page element creates a stacking context (e.g., `position: relative; z-index: 1`), child elements cannot escape that context regardless of z-index value.

**How to avoid:**
- Inject overlay directly into `document.body` (root level)
- Use `position: fixed` (not absolute)
- Set `z-index: 2147483647` (maximum safe integer)
- Test on complex sites with deep stacking contexts

**Warning signs:**
- Overlay visible on example.com but invisible on gmail.com
- DevTools shows element with correct styles but not rendering
- Overlay behind modal dialogs or sticky navigation

**Source:** PITFALLS.md - CSS Stacking Context Misunderstanding

### Pitfall 3: Manifest V3 Service Worker Lifecycle

**What goes wrong:** Background script uses `setInterval()` or stores state in global variables. Works during development but state is lost randomly, timers stop firing.

**Why it happens:** Manifest V3 service workers are event-driven and terminate after ~30 seconds of inactivity. Global variables are lost, timers are canceled.

**How to avoid:**
- Register event listeners at top level (not inside async functions)
- Store state in chrome.storage, not variables
- Use chrome.alarms API for periodic tasks, not setInterval
- Design for service worker restart mid-operation

**Warning signs:**
- Code works for first few minutes then stops
- State disappears after tab switch
- Using global variables for extension state

**Example (WRONG):**
```typescript
// BAD: Listener registered asynchronously
async function init() {
  await loadSettings();
  browser.action.onClicked.addListener(handler); // May miss events
}
init();
```

**Example (CORRECT):**
```typescript
// GOOD: Listener registered at top level
browser.action.onClicked.addListener(handler);

// Load settings separately
loadSettings().then(() => {
  console.log('Ready');
});
```

**Sources:**
- [Migrate to a service worker - Chrome Developers](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)
- WebSearch: "browser extension common mistakes pitfalls Manifest V3"

### Pitfall 4: Badge State Not Clearing

**What goes wrong:** Badge shows active state (green dot) but doesn't clear when user navigates to new page. Or badge overlays entire icon instead of appearing in corner (Firefox bug).

**Why it happens:** Tab-specific badge state is lost on navigation. Firefox had positioning bugs with badges. Badge API behavior varies across browsers.

**How to avoid:**
- Store badge state in background script, not per-tab
- Listen to `tabs.onUpdated` and restore badge on navigation
- Limit badge text to 4 characters (space: `' '` for dot)
- Test badge clearing in all browsers

**Warning signs:**
- Badge doesn't update on tab switch
- Badge text truncated or mispositioned
- Different appearance across browsers

**Source:** PITFALLS.md - Icon State Management Badge Issues

### Pitfall 5: Shadow DOM rem Units

**What goes wrong:** Tailwind CSS classes applied to Shadow DOM content render with wrong sizes. Text and spacing appear much larger or smaller than intended.

**Why it happens:** rem units in Shadow DOM reference the host page's root font-size, not the extension's. If page sets `html { font-size: 20px; }`, your 1rem becomes 20px instead of 16px.

**How to avoid:**
- Use @thedutchcoder/postcss-rem-to-px plugin
- Configure with baseValue: 16 (Tailwind default)
- Plugin converts rem to px at build time

**PostCSS config:**
```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    '@thedutchcoder/postcss-rem-to-px': {
      baseValue: 16
    }
  }
}
```

**Warning signs:**
- Tailwind spacing/fonts look wrong in overlay
- Different appearance on different websites
- Layout breaks on sites with custom root font-size

**Sources:**
- [Building Modern Cross Browser Web Extensions: Content Scripts and UI](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-content-scripts-and-ui/)
- STACK.md - PostCSS configuration

### Pitfall 6: Testing Only in Chrome

**What goes wrong:** Extension works perfectly in Chrome during development. Ship to Firefox and it doesn't load. Background scripts don't execute, APIs throw errors.

**Why it happens:** Chrome uses `chrome.*` namespace with callbacks (pre-121) or promises (121+). Firefox uses `browser.*` namespace with promises. Service worker vs background page differences. Manifest fields differ.

**How to avoid:**
- Test on all browsers from Phase 1, not before launch
- Use webextension-polyfill for Promise-based `browser.*` API
- WXT generates browser-specific manifests automatically
- Run `wxt dev -b firefox` and `wxt dev -b chrome` regularly

**Warning signs:**
- Only running `wxt dev` (defaults to Chrome)
- Using `chrome.*` APIs directly without polyfill
- Never loading extension in Firefox during development

**Source:** PITFALLS.md - Cross-Browser Manifest Compatibility

## Code Examples

Verified patterns from official sources:

### Complete Background Script (Service Worker)

```typescript
// entrypoints/background.ts
import { browser } from 'wxt/browser';

export default defineBackground({
  type: 'module',

  main() {
    // Track active tabs
    const activeTabs = new Set<number>();

    // Icon click handler
    browser.action.onClicked.addListener(async (tab) => {
      if (!tab.id) return;

      const isActive = activeTabs.has(tab.id);

      if (isActive) {
        // Deactivate
        activeTabs.delete(tab.id);

        // Update badge (gray)
        await browser.action.setBadgeBackgroundColor({
          color: '#6B7280',
          tabId: tab.id
        });

        // Send deactivate message to content script
        await browser.tabs.sendMessage(tab.id, { type: 'DEACTIVATE' });

      } else {
        // Activate
        activeTabs.add(tab.id);

        // Update badge (green)
        await browser.action.setBadgeBackgroundColor({
          color: '#22C55E',
          tabId: tab.id
        });
        await browser.action.setBadgeText({
          text: ' ',
          tabId: tab.id
        });

        // Send activate message to content script
        await browser.tabs.sendMessage(tab.id, { type: 'ACTIVATE' });

        // Show notification
        await browser.notifications.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('icon/48.png'),
          title: '스크린세이버 활성화',
          message: 'ESC 키를 눌러 종료하세요.',
        });

        // Play click sound
        const audio = new Audio(browser.runtime.getURL('sounds/click.mp3'));
        audio.volume = 0.5;
        await audio.play();
      }
    });

    // Clean up when tab closes
    browser.tabs.onRemoved.addListener((tabId) => {
      activeTabs.delete(tabId);
    });

    // Initialize badge on startup
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      tabs.forEach(tab => {
        if (tab.id) {
          browser.action.setBadgeBackgroundColor({
            color: '#6B7280',
            tabId: tab.id
          });
          browser.action.setBadgeText({
            text: ' ',
            tabId: tab.id
          });
        }
      });
    });
  },
});
```

**Source:** Synthesized from WXT entrypoints docs and chrome.action API docs

### Complete Content Script with Shadow DOM

```typescript
// entrypoints/content/index.tsx
import './style.css';
import ReactDOM from 'react-dom/client';
import ScreenSaverOverlay from './ScreenSaverOverlay';
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    let ui: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;

    // Create Shadow DOM UI
    ui = await createShadowRootUi(ctx, {
      name: 'screen-saver-overlay',
      position: 'overlay',
      anchor: 'body',

      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<ScreenSaverOverlay />);
        return root;
      },

      onRemove: (root) => {
        root?.unmount();
      },
    });

    // Listen for messages from background
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'ACTIVATE') {
        ui?.mount();
      } else if (message.type === 'DEACTIVATE') {
        ui?.remove();
      }
    });
  },
});
```

**Source:** [WXT Content Script UI](https://wxt.dev/guide/key-concepts/content-script-ui.html)

### Overlay Component with ESC Handler

```typescript
// entrypoints/content/ScreenSaverOverlay.tsx
import { useEffect } from 'react';
import { browser } from 'wxt/browser';

export default function ScreenSaverOverlay() {
  useEffect(() => {
    // ESC key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Notify background to deactivate
        browser.runtime.sendMessage({ type: 'DEACTIVATE' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="overlay-container">
      <div className="placeholder-content">
        <p className="text-white text-2xl">Screen Saver Active</p>
        <p className="text-white/70 text-sm mt-2">Press ESC to exit</p>
      </div>
    </div>
  );
}
```

### Overlay Styles (with rem-to-px conversion)

```css
/* entrypoints/content/style.css */
.overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2147483647;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
}
```

### WXT Configuration

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
      'activeTab'
    ],
    action: {
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
      default_title: 'Toggle Screen Saver',
      // NO default_popup - required for onClicked to fire
    },
  },
});
```

**Source:** [WXT Configuration](https://wxt.dev/)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Plasmo framework | WXT framework | 2025-2026 | Plasmo entering maintenance mode. WXT has faster builds (Vite vs Parcel), framework-agnostic, and more active development. Community migrating to WXT. |
| Manifest V2 | Manifest V3 | Chrome: Jan 2024 deprecated, 2025-2026 removing support | Service workers replace persistent background pages. Stricter CSP, host permissions model. All new extensions must use V3. |
| chrome.* callbacks | Promises (chrome 121+) or webextension-polyfill | Chrome 121: Nov 2023 | Chrome now supports promises natively. Polyfill still recommended for cross-browser compatibility. |
| tailwindcss-animate | tw-animate-css | 2026 | Shadcn UI switched to tw-animate-css as default animation library. |
| Separate manifest per browser | Single manifest with WXT | WXT adoption 2024-2026 | WXT auto-generates browser-specific manifests from single source. Eliminates duplicate maintenance. |

**Deprecated/outdated:**
- **Fullscreen API for programmatic overlays:** Security restrictions prevent use in extensions. Use CSS fixed positioning.
- **localStorage in service workers:** Not available. Use chrome.storage or IndexedDB.
- **Persistent background pages (MV2):** Replaced by event-driven service workers in MV3.
- **Direct chrome.* API usage:** Recommended to use webextension-polyfill for cross-browser compatibility.

## Open Questions

Things that couldn't be fully resolved:

1. **Badge dot appearance across browsers**
   - What we know: Single space `' '` as badge text creates small dot appearance in Chrome
   - What's unclear: Exact visual appearance in Firefox, Safari, Edge (may vary)
   - Recommendation: Test badge rendering on all browsers in Phase 1. May need different badge text per browser (e.g., `'•'` dot character as fallback).

2. **Audio playback in service workers**
   - What we know: HTML5 Audio API and Web Audio API both work in background scripts
   - What's unclear: Cross-browser consistency, particularly Safari's audio playback restrictions
   - Recommendation: Test audio playback in all browsers. Consider making sound optional if Safari has restrictions.

3. **Shadow DOM performance at scale**
   - What we know: Shadow DOM provides style isolation for content scripts
   - What's unclear: Performance impact on low-end devices or complex pages
   - Recommendation: Monitor performance in Phase 4 when rendering images. Shadow DOM itself is lightweight.

## Sources

### Primary (HIGH confidence)
- [WXT Entrypoints Documentation](https://wxt.dev/guide/essentials/entrypoints.html) - Official WXT docs
- [WXT Content Script UI](https://wxt.dev/guide/key-concepts/content-script-ui.html) - Shadow DOM patterns
- [chrome.action API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/action) - Badge API, onClicked
- [chrome.notifications API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/notifications) - Notification API
- [MDN: Build a cross-browser extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension) - Cross-browser best practices
- [MDN: Chrome incompatibilities](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities) - API differences
- PITFALLS.md - Project-specific pitfalls research (HIGH confidence)
- STACK.md - Project-specific stack research (HIGH confidence)
- ARCHITECTURE.md - Project-specific architecture research (HIGH confidence)

### Secondary (MEDIUM confidence)
- [The 2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) - Industry analysis
- [Building Modern Cross Browser Web Extensions: Content Scripts and UI](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-content-scripts-and-ui/) - Shadow DOM rem-to-px solution
- [How to Play a Sound Using JavaScript: Complete 2026 Guide](https://copyprogramming.com/howto/html-how-to-play-a-sound-using-javascript) - Audio playback patterns
- WebSearch results verified against official documentation

### Tertiary (LOW confidence - flagged for validation)
- Badge dot visual consistency across browsers - needs empirical testing
- Safari audio playback restrictions in service workers - needs testing
- Specific browser versions for API feature support - may vary by update

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official documentation and 2026 sources
- Architecture: HIGH - WXT patterns from official docs, cross-browser patterns from MDN
- Pitfalls: HIGH - Verified through official docs (MDN, Chrome Developers) and project PITFALLS.md
- Badge API: HIGH - Official Chrome and Firefox documentation
- Audio playback: MEDIUM - Verified patterns but cross-browser consistency needs testing

**Research date:** 2026-01-19
**Valid until:** 60 days (stack is stable, WXT 0.20.x and React 19.2.x are current)

**Phase 1 readiness:** READY FOR PLANNING
- All core patterns identified
- Known pitfalls documented
- Cross-browser approach defined
- Example code available
