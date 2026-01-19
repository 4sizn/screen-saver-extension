# Stack Research

**Domain:** Cross-browser extensions with TypeScript, React, and Shadcn UI
**Researched:** 2026-01-19
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| WXT | ^0.20.x | Browser extension framework | Industry-leading framework in 2026. Framework-agnostic with superior HMR (even for service workers), active maintenance, auto-imports, and built-in multi-browser support (Chrome, Safari, Edge, Firefox). Vite-based for lightning-fast builds. |
| React | ^19.2.x | UI framework | Latest stable version (released Oct 2025). Modern hooks like `useEffectEvent` and `Activity` component. Fully compatible with Shadcn UI and WXT's React module. |
| TypeScript | ^5.8.x | Type system | Released Feb 2025. Improved performance in watch mode, better type checking for conditional returns, Node.js ESM support. 10x faster builds coming in v7 (Go rewrite). |
| Vite | ^6.x | Build tool | Bundler underlying WXT. Sub-50ms HMR, esbuild-powered transpilation (20-30x faster than tsc), optimized for React + TypeScript. |
| Tailwind CSS | ^4.x | Styling framework | CSS-first configuration (no more `tailwind.config.js`). Fully compatible with Shadcn UI v2026. Designed for modern browsers. |
| Shadcn UI | Latest | Component library | Copy-paste components built on Radix UI primitives. Supports Tailwind v4 and React 19. Accessible, customizable, not a dependency (you own the code). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| webextension-polyfill | ^0.12.x | Cross-browser API compatibility | Essential for Firefox/Safari compatibility. Converts Chrome's callback-based APIs to Promises. Auto-detected on Firefox (NO-OP there). |
| @thedutchcoder/postcss-rem-to-px | Latest | Convert rem to px | Required for Shadow DOM styling. Tailwind's default rem units break inside injected Shadow DOM contexts. Set baseValue: 16 in PostCSS config. |
| @wxt-dev/browser | Latest | Browser API types | Type-safe browser extension APIs. Auto-imported by WXT. Wrapper around webextension-polyfill with full TypeScript support. |
| tw-animate-css | Latest | Tailwind animations | Shadcn UI's recommended animation library (replaced tailwindcss-animate). Required for component animations. |
| Radix UI primitives | As needed | Accessible UI primitives | Shadcn UI is built on these. Installed per-component (Dialog, Dropdown, etc). Provides keyboard navigation and ARIA attributes. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Playwright | Cross-browser extension testing | Supports Chrome, Firefox, Safari via CDP. Load extensions using persistent browser contexts. Use TestingBot or BrowserStack for remote testing. |
| ESLint | Code linting | Configure for React 19 and TypeScript 5.8. WXT templates include sensible defaults. |
| Prettier | Code formatting | Integrates with Tailwind CSS (plugin available). Consistent formatting across team. |
| PostCSS | CSS processing | Required for Tailwind v4 and rem-to-px conversion. Configure in `postcss.config.js`. |

## Installation

```bash
# Initialize new WXT project with React template
npm create wxt@latest screen-saver-web -- --template react-ts

# Core dependencies (if manual setup)
npm install react@^19.2 react-dom@^19.2
npm install webextension-polyfill

# Shadcn UI (initialize)
npx shadcn@latest init

# Tailwind v4 + animations
npm install tailwindcss@^4 tw-animate-css

# PostCSS plugins
npm install -D @thedutchcoder/postcss-rem-to-px

# Dev dependencies
npm install -D wxt@^0.20 vite@^6 typescript@^5.8
npm install -D @types/webextension-polyfill
npm install -D eslint prettier
npm install -D playwright
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| WXT | Plasmo | AVOID - appears in maintenance mode with minimal maintainers (2026). React-focused but slower Parcel bundler. Community recommends migrating to WXT. |
| WXT | CRXJS | Only if you need minimal, lightweight Vite plugin without framework opinions. Lacks file-based routing, manifest conventions, and publishing tools. Beta version required for MV3. |
| chrome.storage.local | IndexedDB | Use IndexedDB for complex data structures, offline functionality, or datasets > 10MB. Otherwise chrome.storage.local is simpler and extension-optimized. |
| webextension-polyfill | Direct chrome.* API | Only if targeting Chrome exclusively. Polyfill adds <5KB and enables Promise-based APIs across all browsers. |
| Tailwind v4 | Tailwind v3 | Only if stuck on legacy codebase. v4 is CSS-first, faster, and required for latest Shadcn UI components. Migration path exists. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Plasmo | Maintenance mode as of 2026. Minimal active development, slow Parcel bundler. Community migrating away. | WXT - actively maintained, faster Vite-based builds, multi-framework support. |
| Create React App (CRA) | Deprecated. No longer recommended by React team. Slow builds, no Vite integration. | Vite + WXT template (includes React setup). |
| tailwindcss-animate | Deprecated by Shadcn UI in 2026. | tw-animate-css (new default). |
| Web SQL | Removed from browsers. Never standardized. | IndexedDB or chrome.storage.local. |
| localStorage for extensions | Limited to 5MB, synchronous (blocks UI), not accessible in service workers. | chrome.storage.local (10MB, async, service worker compatible). |
| Manifest V2 | Chrome deprecated Jan 2024, removing support in 2025-2026. Firefox/Safari following. | Manifest V3 (WXT supports both, defaults to V3). |

## Stack Patterns by Variant

**If storing images locally (your use case):**
- Use chrome.storage.local with "unlimitedStorage" permission for metadata
- Use IndexedDB for actual image Blobs (can handle large binary data efficiently)
- Convert images to base64 only for display, not storage
- Because: chrome.storage.local has 10MB limit, IndexedDB can use 50% of available disk

**If injecting UI into web pages (content scripts):**
- Use Shadow DOM to isolate styles
- Convert Tailwind's rem to px with @thedutchcoder/postcss-rem-to-px
- Because: rem units in Shadow DOM reference host page's root font-size, breaking your layout

**If supporting Firefox:**
- Use webextension-polyfill (it's a NO-OP on Firefox but enables Promise APIs)
- Use background pages (Firefox retains these, Chrome uses service workers)
- Test `browser.*` namespace directly on Firefox before adding polyfill
- Because: Firefox uses `browser.*` with Promises natively, Chrome uses `chrome.*` with callbacks

**If supporting Safari:**
- Test with Safari Technology Preview (extension support evolving)
- Use browser-specific manifest settings via `browser_specific_settings`
- Plan for 24-48 hour App Store review times
- Because: Safari extension ecosystem lags Chrome/Firefox but catching up

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19.2 | Shadcn UI latest | Fully compatible. Shadcn updated for React 19 in late 2025. |
| Tailwind v4 | Shadcn UI latest | Requires Shadcn CLI canary for v4 support. CSS-first config required. |
| WXT 0.20.x | Vite 6.x | Built on Vite 6. Use matching Vite plugins. |
| TypeScript 5.8 | React 19.2 | Fully compatible. Use @types/react@^19.2. |
| webextension-polyfill 0.12.x | Chrome 121+ | Chrome 121+ has native Promise support for extension APIs. Polyfill still recommended for Firefox/Safari. |
| WXT 0.20.x | Node.js >= 18 | Minimum Node.js 18 required. Recommend Node.js 20+ for best performance. |

## Browser-Specific Considerations

### Manifest V3 Differences

| Browser | Service Worker | Background Page | Notes |
|---------|---------------|-----------------|-------|
| Chrome | Required | Deprecated | Extension service workers only. No persistent background. |
| Firefox | Optional | Supported | Retains background pages. Service workers optional. |
| Safari | Optional | Supported | Supports both patterns. |
| Edge | Required | Deprecated | Same as Chrome (Chromium-based). |

### Storage Limits

| Browser | chrome.storage.local | IndexedDB | Notes |
|---------|---------------------|-----------|-------|
| Chrome | 10MB (unlimited with permission) | ~50% disk space | Request "unlimitedStorage" permission. |
| Firefox | 10MB (unlimited with permission) | 10GB max (10% of disk, whichever smaller) | Best-effort mode. |
| Safari | Similar to Chrome | May auto-delete if storage low | Test quota management carefully. |

## Configuration Examples

### PostCSS Config (rem-to-px for Shadow DOM)

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    '@thedutchcoder/postcss-rem-to-px': {
      baseValue: 16 // Tailwind default
    }
  }
}
```

### WXT Config (React + Multi-browser)

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Screen Saver',
    permissions: ['storage', 'unlimitedStorage'],
    // WXT automatically generates browser-specific manifests
  }
});
```

### TypeScript Config (React 19 + WXT)

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "types": ["@wxt-dev/module-react/virtual", "wxt/client"]
  }
}
```

### Shadcn UI Config (Tailwind v4)

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

## Publishing Workflow

### Browser-Specific Build Commands

```bash
# Chrome
wxt build -b chrome
wxt zip -b chrome

# Firefox (with source code)
wxt build -b firefox
wxt zip -b firefox --firefox-source

# Safari
wxt build -b safari
# Manual submission via App Store Connect

# Edge
wxt build -b edge
wxt zip -b edge
```

### Store Requirements

| Store | Review Time | Fee | Notes |
|-------|-------------|-----|-------|
| Chrome Web Store | <1 hour | $5 one-time | Fastest approval. 2FA required. |
| Firefox Add-ons | Seconds - hours | Free | Automated review for common patterns. 2FA required. |
| Edge Add-ons | No SLA (hours-days) | Free | Uses Chrome Web Store metadata. 2FA required. |
| Safari App Store | 24-48 hours | $99/year | Manual review. Requires Developer account. |

## Testing Strategy

### Playwright Setup for Extensions

```typescript
// tests/extension.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test('load extension', async ({ context }) => {
  const extensionPath = path.join(__dirname, '../.output/chrome-mv3');

  // Chrome/Edge only (CDP required)
  const browserContext = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  // Test extension functionality
  const page = await browserContext.newPage();
  await page.goto('https://example.com');
  // ... test scenarios
});
```

### Cross-Browser Testing

```bash
# Local testing
wxt dev -b chrome   # Chrome with HMR
wxt dev -b firefox  # Firefox with HMR
wxt dev -b safari   # Safari (macOS only)

# Automated testing
npm run test:chrome   # Playwright on Chrome
npm run test:firefox  # Playwright on Firefox (via TestingBot)
npm run test:safari   # Manual testing required
```

## Sources

**HIGH Confidence:**
- [WXT Official Docs](https://wxt.dev/) - Framework features, installation, configuration
- [WXT Framework Comparison](https://wxt.dev/guide/resources/compare) - WXT vs Plasmo vs CRXJS analysis
- [MDN: Build Cross-Browser Extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension) - Browser compatibility best practices
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2) - Official release notes
- [TypeScript 5.8 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) - Official release announcement
- [Shadcn UI Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) - Compatibility documentation
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) - Official API reference

**MEDIUM Confidence:**
- [2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) - Industry analysis, verified with official docs
- [WXT React Shadcn Boilerplate](https://github.com/imtiger/wxt-react-shadcn-tailwindcss-chrome-extension) - Real-world implementation example
- [Building Modern Extensions: Shadow DOM](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-content-scripts-and-ui/) - PostCSS rem-to-px solution
- [Playwright Extension Testing](https://playwright.dev/docs/chrome-extensions) - Official Playwright docs

**LOW Confidence (flagged for validation):**
- Plasmo maintenance status - community reports, not official statement
- Specific storage limits across browsers - may vary by version/configuration
- Safari extension review times - anecdotal, no official SLA

---
*Stack research for: Cross-browser screen saver extension with TypeScript, React, and Shadcn UI*
*Researched: 2026-01-19*
*Researcher: GSD Project Researcher*
