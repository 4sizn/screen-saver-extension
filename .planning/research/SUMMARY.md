# Project Research Summary

**Project:** Cross-browser screen saver web extension
**Domain:** Browser extensions with TypeScript, React, and Shadcn UI
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

This is a cross-browser screen saver extension that displays full-screen image slideshows activated by clicking the extension icon. Based on comprehensive research, the recommended approach uses WXT framework with React 19 and Shadcn UI, storing images in IndexedDB rather than chrome.storage, and implementing a CSS-based full-viewport overlay instead of the Fullscreen API (which requires user interaction that conflicts with screen saver behavior).

The critical architectural decision is to use a message-based architecture with the service worker as the central coordinator, content scripts only for UI injection, and strict separation of concerns between UI and storage layers. This approach avoids the three most severe pitfalls discovered in research: Fullscreen API restrictions, storage quota limits, and cross-browser compatibility issues.

Key risks include memory leaks from improperly managed image objects (mitigate with URL.revokeObjectURL and extended testing), CSS stacking context conflicts on complex web pages (mitigate with Shadow DOM isolation and maximum z-index), and Safari distribution requirements that add 2-4 weeks to timeline (defer to post-MVP or budget accordingly).

## Key Findings

### Recommended Stack

WXT is the clear winner for browser extension frameworks in 2026, offering Vite-based builds with superior HMR (even for service workers), framework-agnostic architecture, and built-in multi-browser support. React 19.2 provides the UI foundation with modern hooks, fully compatible with Shadcn UI's latest components. TypeScript 5.8 delivers improved watch mode performance and better type checking.

**Core technologies:**
- **WXT ^0.20.x**: Browser extension framework — Industry-leading in 2026 with active maintenance, Vite-based for fast builds, file-based routing, and automatic manifest generation. Superior to Plasmo (maintenance mode) and CRXJS (minimal tooling).
- **React ^19.2**: UI framework — Latest stable with modern hooks, fully compatible with Shadcn UI and WXT's React module.
- **TypeScript ^5.8**: Type system — Released Feb 2025 with 10x faster watch mode, better conditional type checking, and improved Node.js ESM support.
- **Tailwind CSS ^4.x**: Styling framework — CSS-first configuration, fully compatible with Shadcn UI v2026, required for latest components.
- **Shadcn UI**: Component library — Copy-paste components built on Radix UI primitives, accessible, customizable, not a dependency (you own the code).
- **webextension-polyfill ^0.12.x**: Cross-browser compatibility — Essential for Firefox/Safari, converts Chrome's callback APIs to Promises, NO-OP on Firefox where it's native.
- **IndexedDB**: Image storage — Handles large binary Blobs efficiently, 50%+ of disk space available vs chrome.storage.local's 10MB limit.

**Critical stack decisions:**
- Use IndexedDB for images (NOT chrome.storage.local) — 10MB quota is exhausted by 20-30 photos
- Use Shadow DOM for content script UI isolation — prevents CSS conflicts with host pages
- Convert Tailwind's rem to px with @thedutchcoder/postcss-rem-to-px — Shadow DOM rem units reference host page font-size
- Request "unlimitedStorage" permission from start — retrofitting requires permission change that breaks existing users

### Expected Features

Research of existing screen saver extensions (Photo Screen Saver, Screensaver by Pothos) and user feedback reveals clear patterns for table stakes vs differentiators.

**Must have (table stakes):**
- Full-screen overlay with exit on mouse/keyboard — Core screen saver functionality, must work flawlessly
- Icon-click activation — One-click instant activation is the primary use case
- Image slideshow with configurable interval — Basic screen saver behavior, 5s-5min range typical
- Fade transition between images — Prevents jarring switches, simple to implement
- Default nature image collection (10-20 images) — Extension must work out-of-box without requiring uploads
- Custom image upload via file picker — Personalization is expected, 10MB per-file limit is industry standard
- Image management UI (list view with delete) — Users must be able to see and remove uploaded images
- Basic settings page (interval, transition speed) — Minimal customization without overwhelming

**Should have (competitive):**
- Drag-and-drop image upload — More intuitive than file picker, reduces friction
- Image preview grid (thumbnails) — Visual management vs text-only list
- Local-only storage — Strong privacy message vs competitors requiring Google Photos auth
- Zero configuration — Works immediately with good defaults, no setup wizard
- Multi-monitor support — High value but high complexity, addresses major user complaint with existing extensions

**Defer (v2+):**
- Auto-activation on idle timer — Creates complexity, conflicts with "instant activation" core value, adds browser/OS screen saver conflicts
- Cloud photo sources (Google Photos, Unsplash) — API rate limits, auth complexity, privacy concerns, dependency on external services
- Ken Burns effect (pan/zoom) — Medium complexity, defer until core experience proven
- Multiple image collections/playlists — Wait for power users to request organizational complexity
- Browser-specific optimizations (Firefox, Edge) — Focus Chrome first, expand after validation

**Critical anti-features (avoid):**
- Auto-idle activation timer — Adds complexity, marginal value when activation is instant manual, conflicts with browser/OS screen savers
- Cloud photo integrations — API limits, auth requirements, scope creep beyond local-first architecture
- Video backgrounds — Large files, performance issues, battery drain, limited value over high-quality photos
- Weather/clock overlays — Scope creep, additional permissions, clutters image display

### Architecture Approach

Browser extensions require message-based architecture with strict separation between service worker (background coordinator), popup/options pages (UI contexts), and content scripts (page injection). The service worker maintains canonical state and orchestrates all communication, while UI components are stateless views that request data on mount.

**Major components:**
1. **Service Worker (background/)** — Central message router, state manager, API bridge. Handles all storage operations, manages extension state, coordinates activation. Event-driven lifecycle (no persistent state, can be terminated).
2. **Options Page (options/)** — Full settings UI in dedicated tab. Handles image upload/management, settings configuration. React app with full chrome extension API access.
3. **Content Script (content/)** — Injects full-screen overlay into active tab. Shadow DOM isolation prevents CSS conflicts. Minimal logic, requests images from service worker on activation.
4. **Popup (popup/)** — Quick activation trigger from extension icon. Ephemeral (closes on focus loss), sends activate message to service worker.
5. **Storage Layer (shared/storage/)** — Abstraction over chrome.storage (settings/metadata) and IndexedDB (images as Blobs). Consistent async API with error handling.

**Key architectural patterns:**
- **Message-based communication**: All inter-component communication uses Chrome's message passing (runtime.sendMessage, tabs.sendMessage). Components never directly call each other.
- **Centralized state in service worker**: Service worker maintains canonical state, persists to storage, broadcasts updates to listeners.
- **Storage abstraction**: Wrap storage APIs behind async functions for consistent error handling and testing.
- **Shadow DOM isolation**: Content scripts render into Shadow DOM to prevent CSS conflicts with host pages.
- **Cross-browser polyfill**: Use webextension-polyfill for Promise-based API access across Chrome/Firefox/Safari.

**Build order recommendation:**
1. Storage layer (foundation for everything)
2. Message protocol (defines communication contracts)
3. Service worker (central coordinator)
4. Options page (needed to upload images for testing)
5. Content script (depends on images existing)
6. Popup (simplest, just trigger mechanism)

### Critical Pitfalls

Research identified 9 critical pitfalls from official documentation, browser bug trackers, and community experience. Top 5 by severity and recovery cost:

1. **Fullscreen API User Interaction Requirement (CRITICAL)** — Extensions cannot programmatically trigger fullscreen without user interaction. Attempting to call requestFullscreen() from service worker or timer will fail. Solution: Use CSS full-viewport overlay (position: fixed; top: 0; width: 100vw; height: 100vh; z-index: 2147483647) instead of Fullscreen API. This architectural decision must be made in Phase 1; switching later requires complete UI refactor (3-5 days recovery).

2. **Storage Quota Assumptions (CRITICAL)** — chrome.storage.local has 10MB limit without unlimitedStorage permission. Storing base64-encoded images inflates size by 33%. Extension works with 5-10 test images but fails at realistic scale (50+ user photos). Solution: Request unlimitedStorage permission from start, store images in IndexedDB as Blobs (not base64), reserve chrome.storage for metadata only. Address in Phase 2 before implementing image storage; retrofitting requires complex migration (2-3 days recovery).

3. **Cross-Browser Manifest Compatibility (CRITICAL)** — Extension works in Chrome but fails in Firefox/Safari due to namespace differences (chrome.* vs browser.*), service worker vs background page differences, and permission variations. Solution: Use Manifest V3 from start, implement webextension-polyfill for API normalization, test ALL browsers from Phase 1. Discovering late requires major refactoring (5-7 days per browser recovery).

4. **Memory Leaks from Cached Images (HIGH)** — Image elements and object URLs remain in memory after DOM removal. After 30-60 minutes of slideshow, browser memory balloons from 500MB to 5GB+, causing crashes. Solution: Call URL.revokeObjectURL() after setting image src, limit images in memory (current + next only), reuse single image element. Test with 1+ hour sessions and memory profiler in Phase 4. Recovery: 1 day to add cleanup calls.

5. **CSS Stacking Context Misunderstanding (HIGH)** — Overlay appears correctly on simple sites but disappears behind content on complex web apps (Gmail, Google Docs). High z-index doesn't work because page creates new stacking contexts. Solution: Inject overlay into document.body (not nested), use position: fixed, z-index: 2147483647, isolation: isolate, Shadow DOM for style isolation. Test on 10+ complex sites in Phase 1. Recovery: 1-2 days to refactor injection.

**Other significant pitfalls:**
- Content script race conditions during navigation (use service worker for timing logic)
- Icon badge state not clearing in Firefox (explicit clear on navigation events)
- Keyboard shortcut conflicts on sites that hijack keys (provide alternative activation)
- Safari distribution requiring App Store submission (2-4 week timeline, $99/year cost)

## Implications for Roadmap

Based on research, suggested 5-phase structure prioritizes architectural foundations, avoids critical pitfalls, and delivers incremental value.

### Phase 1: Foundation & Overlay
**Rationale:** Must establish correct architecture before building features. Fullscreen API decision and cross-browser setup are irreversible architectural choices. CSS stacking issues must be solved upfront with proper testing infrastructure.

**Delivers:** Working full-viewport overlay that appears above all page content, exits cleanly on interaction, works across browsers.

**Addresses (from FEATURES.md):**
- Full-screen overlay with exit on mouse/keyboard (table stakes)
- Cross-browser compatibility (Chrome, Firefox as minimum)

**Avoids (from PITFALLS.md):**
- Fullscreen API restriction (use CSS overlay instead)
- CSS stacking context issues (proper injection, Shadow DOM, max z-index)
- Cross-browser manifest incompatibility (MV3 + polyfill from start)

**Stack elements:** WXT setup, React 19, TypeScript 5.8, webextension-polyfill, Shadow DOM with rem-to-px PostCSS

**Research flag:** Standard patterns, skip research-phase. Well-documented in WXT/MDN docs.

### Phase 2: Image Storage & Management
**Rationale:** Storage architecture must be correct before implementing features that depend on it. Switching from chrome.storage to IndexedDB later requires complex migration. Options page needed before content script to populate test images.

**Delivers:** Options page with image upload (file picker), storage in IndexedDB, image list with delete, default nature collection bundled.

**Addresses (from FEATURES.md):**
- Custom image upload via file picker (table stakes)
- Image management UI with delete (table stakes)
- Default nature image collection (table stakes)

**Avoids (from PITFALLS.md):**
- Storage quota limits (IndexedDB + unlimitedStorage permission)
- Base64 inflation (store Blobs directly, not base64)

**Stack elements:** IndexedDB for images, chrome.storage.local for metadata, storage abstraction layer, Shadcn UI components

**Research flag:** Standard patterns, skip research-phase. IndexedDB is well-documented.

### Phase 3: Activation & Settings
**Rationale:** Activation logic depends on service worker messaging architecture. Settings page completes user-facing configuration before implementing display features.

**Delivers:** Popup with activate button, settings page (slideshow interval, transition speed), message routing between popup/service worker/content script.

**Addresses (from FEATURES.md):**
- Icon-click activation (table stakes, core differentiator)
- Basic settings page (table stakes)

**Avoids (from PITFALLS.md):**
- Content script race conditions (service worker coordinates activation)
- Icon state badge issues (explicit state management)

**Stack elements:** Service worker message routing, chrome.action API for popup, chrome.storage.sync for settings

**Research flag:** Standard patterns, skip research-phase. Message passing is well-documented.

### Phase 4: Image Display & Slideshow
**Rationale:** Depends on storage (Phase 2) and activation (Phase 3) being complete. Memory leak prevention must be built in from start, not retrofitted.

**Delivers:** Image slideshow with configurable interval, fade transitions, proper memory management, exit on interaction.

**Addresses (from FEATURES.md):**
- Image slideshow with configurable interval (table stakes)
- Fade transition between images (table stakes)

**Avoids (from PITFALLS.md):**
- Memory leaks from cached images (URL.revokeObjectURL, image reuse, extended testing)
- Missing exit indicators (subtle hint, clear exit path)

**Stack elements:** Canvas or CSS animations for transitions, Image preloading, performance monitoring

**Research flag:** Test extensively, but patterns are standard. Extended memory profiling required.

### Phase 5: Polish & Distribution
**Rationale:** Core features complete, focus on UX refinements and publishing workflow. Chrome first, defer Safari unless explicitly required.

**Delivers:** Drag-and-drop upload, image preview grid, browser-specific builds, Chrome Web Store submission, Firefox Add-ons submission.

**Addresses (from FEATURES.md):**
- Drag-and-drop upload (should-have differentiator)
- Image preview grid (should-have differentiator)

**Avoids (from PITFALLS.md):**
- Safari distribution surprise (defer unless critical, or budget 2-4 weeks + $99/year)

**Stack elements:** WXT build/zip commands, store-specific manifests, publishing workflow

**Research flag:** Skip research-phase for Chrome/Firefox publishing. If Safari added, research App Store requirements.

### Phase Ordering Rationale

**Why this order:**
- Phase 1 before anything else: Architectural decisions (Fullscreen API vs CSS overlay, MV3 vs MV2, browser support) are irreversible. Getting this wrong requires complete rewrites.
- Phase 2 before Phase 4: Cannot test image display without storage. Options page needed to populate images.
- Phase 3 before Phase 4: Activation and messaging architecture must work before implementing slideshow.
- Phase 5 last: Polish and distribution depend on core features being complete and stable.

**Dependency chain:**
```
Phase 1 (Foundation) ──> Phase 2 (Storage) ──> Phase 3 (Activation) ──> Phase 4 (Display) ──> Phase 5 (Polish)
     ↓                        ↓                       ↓                       ↓
  Overlay CSS           IndexedDB setup       Message routing         Image transitions
  Shadow DOM            Options page          Service worker          Memory management
  Browser setup         Default images        Popup trigger           Exit handling
```

**How this avoids pitfalls:**
- Phase 1 addresses all 3 CRITICAL pitfalls (Fullscreen API, cross-browser, CSS stacking)
- Phase 2 addresses storage quota before users upload images
- Phase 4 addresses memory leaks from the start with proper testing
- Safari deferred unless explicitly required, avoiding timeline/budget surprise

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Foundation patterns well-documented in WXT docs, MDN WebExtensions guides, and Chrome extension documentation
- **Phase 2:** IndexedDB and chrome.storage APIs are mature with extensive documentation
- **Phase 3:** Message passing is core extension pattern with clear documentation
- **Phase 4:** Image slideshow patterns are standard web development
- **Phase 5:** Publishing workflows documented by each store (Chrome Web Store, Firefox Add-ons)

**No phases require /gsd:research-phase** — All patterns are well-established with HIGH confidence documentation. Phase planning can proceed directly from this research.

**Validation during implementation:**
- Phase 1: Test overlay on 10+ complex sites (Gmail, Facebook, Google Docs, etc.)
- Phase 2: Test with 50+ realistic images (5MB each) to verify storage architecture
- Phase 4: Run 1+ hour memory profiling sessions to detect leaks early

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | WXT, React, TypeScript, IndexedDB all have official documentation. Versions verified from release notes. Framework comparison based on official WXT comparison guide and 2025 state-of-frameworks analysis. |
| Features | MEDIUM | Based on competitor analysis (2 major extensions) and Chrome Web Store reviews. Table stakes clearly evident from user expectations. Some differentiator assumptions based on competitor weaknesses rather than user research. |
| Architecture | HIGH | Message-based architecture is required by browser security model. Component separation patterns from official MDN and Chrome docs. Shadow DOM necessity verified through multiple sources. Service worker patterns mandatory for MV3. |
| Pitfalls | HIGH | All critical pitfalls verified through official Mozilla/Chrome documentation, browser bug trackers (Bugzilla, Chromium Issues), and MDN API references. Memory leak patterns confirmed by Chrome DevTools documentation. Storage limits from official API docs. |

**Overall confidence:** HIGH

Research is comprehensive with strong primary sources for technical decisions. Feature prioritization has MEDIUM confidence (competitor-based, not user research), but table stakes are clear and uncontroversial.

### Gaps to Address

**Known limitations requiring validation during implementation:**

- **Multi-monitor support complexity:** Research indicates high user value but high technical complexity. Defer to v2+, but validate feasibility with chrome.windows API during Phase 4 if time permits.

- **Safari-specific quirks:** Research covers Safari distribution model but lacks detailed Safari-specific API differences. If Safari support becomes MVP requirement, allocate 1-2 days for Safari-specific testing and adjustment.

- **Optimal default image collection size:** Research suggests 10-20 images but doesn't specify extension size impact. Validate during Phase 2 implementation that bundled images don't exceed Chrome Web Store 50MB size limit.

- **Transition effect performance:** Fade transition is recommended as "simple to implement" but performance impact on large images (5MB+) needs validation during Phase 4. May require image optimization or canvas-based rendering.

- **Browser-specific storage limits:** Chrome, Firefox, and Safari all support IndexedDB but with different quota policies. Test across browsers in Phase 2 to verify unlimitedStorage permission works consistently.

**How to handle:**
- Multi-monitor: Mark as v2+ explicitly, communicate if users request
- Safari quirks: Test if Safari becomes requirement, otherwise defer
- Image collection: Measure during Phase 2, optimize if needed
- Transition performance: Profile in Phase 4, fall back to simpler effects if needed
- Storage limits: Cross-browser testing in Phase 2, adjust based on findings

## Sources

### Primary (HIGH confidence)

**Framework and Stack:**
- [WXT Official Documentation](https://wxt.dev/) — Framework features, installation, configuration
- [WXT Framework Comparison](https://wxt.dev/guide/resources/compare) — WXT vs Plasmo vs CRXJS analysis
- [React 19.2 Release Notes](https://react.dev/blog/2025/10/01/react-19-2) — Official release announcement
- [TypeScript 5.8 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-8/) — Official release blog
- [Shadcn UI Tailwind v4 Docs](https://ui.shadcn.com/docs/tailwind-v4) — Compatibility documentation

**Browser Extension APIs:**
- [Chrome Extensions: Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3) — Official migration guide
- [Chrome: Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging) — Communication patterns
- [Chrome: Content Scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) — Injection and isolation
- [Chrome: Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) — API reference with quotas
- [Mozilla: Build Cross-Browser Extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension) — Cross-browser best practices
- [Mozilla: Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage) — Firefox storage documentation

**Pitfall Documentation:**
- [Element: requestFullscreen() method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) — User activation requirement
- [Firefox Bug 1411227](https://bugzilla.mozilla.org/show_bug.cgi?id=1411227) — WebExtensions fullscreen request denial
- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — Storage limits across browsers
- [IndexedDB Max Storage Size Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html) — Practical quota information
- [z-index - CSS MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index) — Stacking context behavior
- [Fix memory problems - Chrome DevTools](https://developer.chrome.com/docs/devtools/memory-problems) — Memory profiling guide

### Secondary (MEDIUM confidence)

**Framework Analysis:**
- [2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) — Industry analysis comparing frameworks
- [Building Modern Extensions: Shadow DOM](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-content-scripts-and-ui/) — PostCSS rem-to-px solution

**Feature Research:**
- [Screensaver Chrome Extension](https://chromewebstore.google.com/detail/screensaver/naejhikacbhadlehaeombhofjnpcbejj) — Competitor analysis (scene-based approach)
- [Photo Screen Saver GitHub](https://github.com/opus1269/screensaver) — Open-source competitor with Google Photos integration
- [Photo Screen Saver Documentation](https://opus1269.github.io/screensaver/faq.html) — Feature set and user FAQ
- [Chrome Extension Stats - Screensaver](https://chrome-stats.com/d/naejhikacbhadlehaeombhofjnpcbejj) — User feedback and complaints

**Architecture Patterns:**
- [Building Modern Cross Browser Web Extensions: Background Scripts](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-background-scripts-and-messaging/) — Message-based architecture
- [How to Communicate Between Content Script, Popup, and Background](https://saisandeepvaddi.com/blog/how-to-communicate-between-content-script-popup-background-in-web-extensions) — Communication patterns

**Storage Implementation:**
- [Storing images and files in IndexedDB – Mozilla Hacks](https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/) — Blob storage patterns
- [How to use IndexedDB to store images](https://blog.q-bit.me/how-to-use-indexeddb-to-store-images-and-other-files-in-your-browser/) — Implementation guide

### Tertiary (LOW confidence - flagged for validation)

- **Plasmo maintenance status:** Based on community reports and minimal GitHub activity, not official deprecation announcement. Framework comparison recommends WXT based on 2025 analysis.
- **Safari extension review times:** Anecdotal 24-48 hour estimates from community, no official Apple SLA. App Store review required per Apple documentation.
- **Multi-monitor user demand:** Based on single support thread complaint, not quantified user research. Feature marked as high-value in competitor analysis.

---
*Research completed: 2026-01-19*
*Research files: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Ready for roadmap: yes*
