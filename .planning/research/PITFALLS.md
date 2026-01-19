# Pitfalls Research

**Domain:** Browser Extension (Screen Saver - Full-Screen Overlay)
**Researched:** 2026-01-19
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Fullscreen API User Interaction Requirement

**What goes wrong:**
Extensions cannot programmatically trigger fullscreen mode without explicit user interaction. Calling `requestFullscreen()` from a content script or background script will fail with "Request for fullscreen was denied because Element.requestFullscreen() was not called from inside a short running user-generated event handler."

**Why it happens:**
Security restrictions prevent malicious extensions from hijacking the entire screen and impersonating the browser interface. Mozilla explicitly denied exempting WebExtensions content scripts from the user interaction requirement, citing security concerns that "an awful lot of the security measures the URL bar and the browser chrome present in a browser are lost" once fullscreen is activated.

**How to avoid:**
- Do NOT use the Fullscreen API for screen saver overlays
- Instead, create a full-viewport overlay using CSS positioning (`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh`)
- Use extremely high z-index values (2147483647 is the maximum) to ensure overlay appears above page content
- Understand that your overlay will appear WITHIN the browser chrome, not truly fullscreen

**Warning signs:**
- Testing shows fullscreen API works during manual testing (with clicks) but fails when triggered by timers
- Console errors mentioning "user-generated event handler" or "transient activation"

**Phase to address:**
Phase 1 (Foundation) - Architecture decision must be made upfront. Changing from Fullscreen API to CSS overlay later requires significant refactoring.

---

### Pitfall 2: CSS Stacking Context Misunderstanding

**What goes wrong:**
Developers set extremely high z-index values (like `z-index: 999999999`) on overlay elements, but the overlay still appears BEHIND page content. The overlay works on some sites but not others, creating inconsistent behavior that's difficult to debug.

**Why it happens:**
CSS stacking contexts are atomic - elements within one stacking context cannot interfere with rendering order in another context, regardless of z-index values. If a page element creates a new stacking context (e.g., `position: relative; z-index: 1`), child elements with `z-index: 1000000` cannot escape that context to overlay external elements with `z-index: 2`.

**How to avoid:**
- Inject overlay element directly into `document.body` or `document.documentElement`, NOT nested within page content
- Use `position: fixed` (not absolute) to remove overlay from document flow
- Set z-index to maximum safe value: `2147483647`
- Add `isolation: isolate` to the overlay to create a new stacking context
- Test against sites with complex z-index hierarchies (Gmail, Facebook, Google Docs)

**Warning signs:**
- Overlay appears correctly on simple HTML pages but disappears on complex web apps
- DevTools shows your element in the DOM with correct styles, but it's not visible
- Overlay appears behind navigation bars, modals, or sticky headers

**Phase to address:**
Phase 1 (Foundation) - CSS overlay implementation. Include test suite covering various stacking context scenarios.

---

### Pitfall 3: Cross-Browser Manifest Compatibility

**What goes wrong:**
Extension works perfectly in Chrome but fails to load in Firefox or Safari. Background scripts don't execute, storage APIs throw errors, or key features are completely non-functional. Developers discover late in development that they need separate codebases or extensive conditional logic.

**Why it happens:**
Chrome enforces Manifest V3 (MV2 deprecated in 2025), while Firefox supports both MV2 and MV3 with different API implementations. Chrome uses extension service workers for background scripts; Firefox still uses background pages. Safari requires MV3 but has unique quirks. The `browser.*` namespace works in Firefox and Safari; Chrome doesn't support it (requires `chrome.*` or polyfills).

**How to avoid:**
- Use Manifest V3 from the start (required for Chrome, supported by all browsers in 2026)
- Use a polyfill library like `webextension-polyfill` to normalize `browser.*` vs `chrome.*` namespaces
- For background scripts, use service workers (required by Chrome) and test extensively in Firefox (different lifecycle)
- Declare all permissions explicitly - Firefox is more permissive, but Safari and Chrome are strict
- Test on ALL target browsers from Phase 1, not just before launch

**Warning signs:**
- Only testing in one browser during development
- Using `chrome.*` API calls directly without polyfill
- Background script uses persistent storage or DOM APIs (service workers don't have DOM access)
- Manifest includes browser-specific keys without proper feature detection

**Phase to address:**
Phase 1 (Foundation) - Project setup. Switching manifest versions or background script architecture later is extremely costly.

---

### Pitfall 4: Storage Quota Assumptions

**What goes wrong:**
Screen saver extension stores dozens of high-resolution images in `chrome.storage.local` (10MB limit). App works fine during development with 5-10 test images, but users report "storage full" errors after adding their photo collection. Extension silently fails to save new images, or existing images get corrupted.

**Why it happens:**
Developers test with small datasets and don't verify against quota limits. `chrome.storage.local` has only 10MB capacity (5MB in Chrome 113 and earlier) without the `unlimitedStorage` permission. Storing images as base64 strings inflates file size by ~33%. Quota errors don't throw exceptions visibly - they fail silently or require checking `chrome.runtime.lastError`.

**How to avoid:**
- Request `unlimitedStorage` permission in manifest from the start (moves limit to ~60% of available disk space)
- Store images in IndexedDB as Blobs, NOT in chrome.storage (IndexedDB has 1GB+ capacity per domain)
- Reserve chrome.storage.local for settings/metadata only (icon state, timer settings, image references)
- Implement quota monitoring: call `navigator.storage.estimate()` before storing large files
- Show user-friendly errors when approaching quota limits, with option to delete old images
- Test with realistic datasets: 50+ images at 2-5MB each (typical phone photos)

**Warning signs:**
- Testing only with small, compressed test images
- Not checking `chrome.runtime.lastError` after storage operations
- Using `chrome.storage.local` for binary data or base64-encoded images
- No quota monitoring or user-facing storage management UI

**Phase to address:**
Phase 2 (Image Storage) - Before implementing image upload/storage. Changing storage architecture after users have data requires complex migration logic.

---

### Pitfall 5: Content Script Injection Race Conditions

**What goes wrong:**
Extension content script is supposed to detect user idle time and activate the screen saver. But on some page loads, the script never executes, or it executes on the WRONG page after rapid navigation. Users report the screen saver activating on unexpected sites or not activating at all.

**Why it happens:**
Race conditions occur when calling `tabs.executeScript()` immediately followed by `tabs.update()` for navigation - the script may execute after navigation completes. Large content scripts that take time to parse can get injected into the wrong page during rapid redirects. Dynamic page content may not exist when the content script runs (`document_idle` timing doesn't guarantee all elements are loaded).

**How to avoid:**
- Use `document_idle` run_at timing (default) for most cases, but verify critical elements exist before accessing them
- For screen saver activation, use a background service worker with timers + tabs API, NOT content scripts that depend on page loading
- If content scripts are needed, use `documentId` (not `frameId`) in webNavigation listeners to prevent duplicate injections
- Implement defensive coding: check for element existence before accessing (`if (document.body) { ... }`)
- Store state in background/service worker, not content scripts (content scripts are destroyed on navigation)

**Warning signs:**
- Testing only with slow, deliberate page navigation
- Relying on content scripts for critical timing logic (idle detection, screen saver activation)
- Not handling cases where content script loads but DOM is incomplete
- Seeing duplicate script executions or "Cannot access property of undefined" errors

**Phase to address:**
Phase 3 (Idle Detection) - When implementing screen saver activation logic. Refactoring activation architecture later is difficult.

---

### Pitfall 6: Safari Distribution Requirements

**What goes wrong:**
Extension is complete and working in Chrome/Firefox, but Safari requires wrapping it in a native Mac/iOS app, joining the $99/year Apple Developer Program, submitting through App Store review, and handling App Store approval delays. This discovery happens weeks before planned launch, derailing timelines.

**Why it happens:**
Safari web extensions MUST be distributed via the App Store, wrapped inside a native app. This is fundamentally different from Chrome Web Store or Firefox Add-ons, which directly distribute extensions. Developers assume browser extensions have a standard distribution model and don't research Safari-specific requirements until late in the project.

**How to avoid:**
- Budget 2-4 weeks for Safari App Store submission and review process
- Factor in $99/year Apple Developer Program membership cost
- Plan Safari support as a post-MVP phase if you lack Mac hardware or iOS expertise
- If Safari is critical for MVP, create the native app wrapper in Phase 1 and use it for testing
- Use Xcode's Safari Web Extension converter tool early to identify incompatibilities
- Read Apple's App Store Review Guidelines - extensions face additional scrutiny

**Warning signs:**
- Promising Safari support without researching distribution requirements
- Assuming "cross-browser compatible" means "easy to ship on all browsers"
- Not budgeting time/money for Apple Developer Program and App Store review
- Planning Safari support in final week before launch

**Phase to address:**
Phase 0 (Planning/Scoping) - Decide Safari support scope upfront. If post-MVP, communicate this clearly. If MVP, factor into timeline and budget.

---

### Pitfall 7: Memory Leaks from Cached Images

**What goes wrong:**
Screen saver extension displays rotating images smoothly at first, but after running for 30-60 minutes, browser memory usage balloons from 500MB to 5GB+. Browser becomes sluggish, and users force-quit. Extension gets negative reviews citing "memory leak" and "crashes my browser."

**Why it happens:**
Image elements remain in memory even after they're removed from DOM. Decoded bitmap data persists in memory alongside compressed bytes. Object URLs created with `URL.createObjectURL()` are not automatically garbage collected - they must be manually revoked. Background images are pre-loaded even when `display: none`, and multiple image states (compressed + decoded) are cached simultaneously.

**How to avoid:**
- Call `URL.revokeObjectURL()` immediately after setting image `src` or when removing image from DOM
- Limit the number of image elements in memory (e.g., only current + next image, not entire library)
- Use a single image element and swap `src` rather than creating/destroying elements
- Set `image.src = ''` before removing image element from DOM to force deallocation
- Test for extended periods (1+ hours) with memory profiler open (Chrome DevTools > Memory > Heap snapshot)
- Monitor memory with `performance.memory` API and warn users if growth is excessive

**Warning signs:**
- Testing screen saver for only 5-10 minutes during development
- Never running Chrome DevTools memory profiler during testing
- Creating new Image elements for every photo instead of reusing
- Not calling `URL.revokeObjectURL()` after use
- Seeing "Out of memory" errors or browser crashes after extended use

**Phase to address:**
Phase 4 (Image Display/Rotation) - When implementing image slideshow. Fixing memory leaks after launch is difficult because users have already experienced crashes.

---

### Pitfall 8: Icon State Management Badge Issues

**What goes wrong:**
Extension uses `chrome.action.setBadgeText()` to show active/inactive state. Badge appears correctly in Chrome but doesn't clear in Firefox on page navigation. Or badge text overlays the entire icon instead of appearing in the corner. Users can't tell if the screen saver is active or not.

**Why it happens:**
Firefox had a bug where browserAction badges weren't cleared on navigation (Chrome clears automatically). Firefox also had a positioning bug causing badges to overlay entire icons instead of corners. Badge text is reset when users navigate to new pages (tab-specific state is lost). Extensions don't handle badge updates consistently across browsers.

**How to avoid:**
- Explicitly clear badge text on tab navigation events using `webNavigation.onCommitted` listener
- Limit badge text to 4 or fewer characters (Chrome recommendation due to space constraints)
- Store icon state in background service worker, NOT per-tab (unless screen saver is tab-specific)
- Test badge appearance in ALL browsers - positioning and clearing behavior varies
- Consider using different icon images (active vs inactive) instead of badges for clearer state indication
- Listen to `tabs.onActivated` and `tabs.onUpdated` to refresh badge when user switches tabs

**Warning signs:**
- Badge text longer than 4 characters getting truncated differently across browsers
- Not testing badge clearing during rapid navigation or tab switching
- Assuming badge state persists across page loads without explicit management
- Badge appears correctly in Chrome but has visual bugs in Firefox

**Phase to address:**
Phase 3 (Icon State Management) - When implementing active/inactive indicators. Badge behavior inconsistencies are difficult to debug retroactively.

---

### Pitfall 9: Keyboard Shortcut Conflicts

**What goes wrong:**
Extension registers keyboard shortcut (e.g., `Ctrl+Shift+S`) to manually activate screen saver. Works during testing, but some users report "shortcut doesn't work." Conflicts arise with websites that hijack keyboard shortcuts (Gmail, Google Docs, Figma) or other extensions using the same key combination.

**Why it happens:**
Browser and OS shortcuts ALWAYS take priority over extension shortcuts (cannot override in Chrome). If a key combination is already used by the browser or another extension, Firefox allows defining it but won't call your handler. Web pages can use `preventDefault()` to hijack shortcuts before extension handlers receive them. Extensions have limited control over shortcut priority.

**How to avoid:**
- Choose uncommon key combinations unlikely to conflict (avoid `Ctrl+C`, `Ctrl+S`, common IDE shortcuts)
- Make keyboard shortcuts optional/configurable - users should be able to change them
- Document that shortcuts may not work on all sites due to page-level handlers
- Test shortcuts on complex web apps known to hijack keys (Gmail, Google Docs, Slack web)
- Provide alternative activation methods (toolbar icon click, right-click context menu)
- Use `chrome.commands` API properly and check browser support for updating shortcuts

**Warning signs:**
- Choosing popular shortcuts like `Ctrl+S`, `Ctrl+P` without testing conflicts
- Assuming shortcuts will work consistently across all websites
- Not providing alternative ways to activate screen saver
- Hardcoding shortcuts without user configuration options

**Phase to address:**
Phase 3 (Activation Methods) - When implementing manual screen saver triggers. Changing activation UX after users learn the workflow is disruptive.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing images as base64 in chrome.storage | Simple implementation, no IndexedDB complexity | 10MB quota hit quickly, 33% size inflation, poor performance | Never - use IndexedDB from start |
| Using content scripts for idle detection | Seems natural to detect activity on active page | Race conditions, doesn't detect cross-tab activity, state loss on navigation | Never - use background service worker with tabs API |
| Testing only in Chrome during development | Faster iteration, no multi-browser setup | Major refactoring needed for Firefox/Safari late in project | Acceptable for early prototypes (first 2 weeks), but must test cross-browser by Phase 1 completion |
| Hardcoding z-index values instead of max constant | Faster to type `999999` | May not be high enough for all sites, harder to adjust globally | Never - define `const MAX_Z_INDEX = 2147483647` |
| Skipping memory profiling during development | Saves testing time initially | Memory leaks discovered post-launch via user complaints | Acceptable for Phase 1-2, but MUST profile during Phase 4 (image display) |
| Not requesting `unlimitedStorage` permission | Users prefer extensions with fewer permissions | Quota errors with realistic image collections, requires permission later (breaks existing users) | Never - storage architecture is hard to change |
| Using `chrome.*` APIs without polyfill | Works fine in Chrome testing | Fails completely in Firefox/Safari, requires refactoring all API calls | Acceptable for Chrome-only MVP, but adds rework cost for cross-browser later |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Image Loading from URLs | Not handling CORS errors, loading images directly in content scripts | Use background script to fetch with proper CORS handling, convert to Blob, store in IndexedDB |
| Native Messaging (Safari) | Assuming all browsers support native messaging equally | Safari requires no extra setup (bundled in app), Chrome/Firefox need separate native host installation |
| External APIs for images | Making API calls from content scripts, exposing API keys | All external API calls from background script only, use environment variables for keys |
| Local file access | Attempting to read user's local files directly | Request file input, read as Blob/ArrayBuffer, store in IndexedDB (don't store file paths) |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all images into memory at startup | Fast image switching, simple logic | Users with 100+ images hit memory limits, browser slowdown | 20+ high-res images (~2-5MB each), ~150MB total |
| Storing full-resolution images without optimization | Preserves quality, simpler pipeline | Hits storage quota quickly, slow load times | 50+ images at original phone resolution (3000x4000px) |
| Not using image preloading | Simpler state management | Visible delay/flicker when switching to next image | Noticeable on slower connections or large images (5MB+) |
| Checking idle time every 100ms | More responsive idle detection | Drains CPU, impacts battery on laptops | Continuous polling adds ~2-5% CPU usage |
| Recreating image elements for each transition | Clean slate, no state carryover | Memory fragmentation, GC pressure, potential leaks | After 100+ transitions (~30 min at 20s/image) |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using `innerHTML` to inject overlay content | XSS vulnerability if page content is reflected | Use `createElement()` and `textContent` for all DOM manipulation |
| Not sanitizing image filenames from user uploads | Path traversal or injection attacks when storing metadata | Validate and sanitize all user-provided strings before storage |
| Exposing storage keys or internal state to page context | Malicious pages could manipulate extension state | Never expose extension APIs to page context via `window` object |
| Loading images from untrusted URLs without validation | Malicious sites could inject executable content disguised as images | Validate content-type headers, sanitize blobs, use CSP restrictions |
| Storing unencrypted API keys in storage | Keys exposed if user's machine is compromised | Use browser's built-in credential storage or encrypt sensitive data |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Screen saver activates with no clear exit method | Users panic, force-quit browser | Show subtle hint "Press any key to exit" or ESC specifically |
| No visual indicator before screen saver starts | Jarring interruption while user is reading | Show 3-5 second countdown overlay before full activation |
| Screen saver activates during video playback | Interrupts YouTube, Netflix, training videos | Detect media playback and disable idle timer |
| No way to quickly disable without opening settings | User must dig through menus mid-disruption | Add "Disable for 1 hour" option on right-click context menu |
| Screen saver blocks urgent notifications | Users miss time-sensitive alerts | Allow notifications to show through overlay or dismiss screen saver |
| Image transitions are too fast/slow with no adjustment | Frustration with fixed timing | Provide slider for transition interval (5s - 5min range) |
| No indication of how many images are loaded | Users don't know if their images were saved | Show image count badge on icon or in popup |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Full-screen overlay:** Often missing z-index conflicts testing on complex sites (Gmail, Google Docs) — verify on 10+ major web apps with high z-index elements
- [ ] **Image storage:** Often missing quota monitoring and user warnings — verify `navigator.storage.estimate()` integration and error handling
- [ ] **Memory management:** Often missing long-running memory profiling — verify with 1+ hour test session and heap snapshot comparison
- [ ] **Cross-browser compatibility:** Often missing Firefox/Safari testing — verify on ALL target browsers, not just Chrome
- [ ] **Idle detection:** Often missing "user watching video" detection — verify screen saver doesn't interrupt media playback
- [ ] **Icon state:** Often missing badge clearing on navigation — verify badge updates correctly across tab switches and page loads
- [ ] **Keyboard shortcuts:** Often missing conflict testing on shortcut-heavy sites — verify on Gmail, Google Docs, Figma
- [ ] **Image transitions:** Often missing object URL cleanup — verify `URL.revokeObjectURL()` called for every created URL
- [ ] **Error handling:** Often missing storage quota errors and CORS failures — verify graceful degradation with user-friendly messages
- [ ] **Permissions:** Often missing runtime permission checks — verify handling when users revoke permissions after installation

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Used Fullscreen API instead of CSS overlay | HIGH | Complete UI refactor. Rewrite overlay injection, z-index management, all activation logic. 3-5 days. |
| Hit storage quota without unlimitedStorage permission | MEDIUM | Add permission (requires manifest update), implement migration to IndexedDB, communicate to users. 2-3 days. |
| Memory leaks from missing URL.revokeObjectURL() | LOW | Add cleanup calls in all image handling code, test with profiler. 1 day. |
| Cross-browser compatibility issues discovered late | HIGH | Implement polyfills, refactor API calls, test extensively. 5-7 days per browser. |
| Badge state not clearing in Firefox | LOW | Add explicit badge clearing on navigation events. 2-4 hours. |
| CSS stacking context issues on specific sites | MEDIUM | Refactor overlay injection point, adjust positioning strategy, test on problematic sites. 1-2 days. |
| Content script race conditions causing activation bugs | HIGH | Migrate logic from content scripts to background service worker. Major architecture change. 3-5 days. |
| Safari distribution delay | MEDIUM | Fast-track App Store submission, communicate delay to users, expedite review if possible. 1-2 weeks timeline extension. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Fullscreen API restriction | Phase 1: Foundation | Test overlay activation without user click, verify works on timer-based trigger |
| CSS stacking context issues | Phase 1: Foundation | Test overlay on 10+ complex sites (Gmail, Facebook, Google Docs), verify z-index effectiveness |
| Cross-browser manifest compatibility | Phase 1: Foundation | Load extension in Chrome, Firefox, Safari - all core functionality must work |
| Storage quota limits | Phase 2: Image Storage | Upload 50+ test images (5MB each), verify no quota errors, check storage estimation API |
| Content script race conditions | Phase 3: Idle Detection | Test rapid page navigation during idle countdown, verify no duplicate activations |
| Icon state badge problems | Phase 3: Icon State Management | Switch tabs rapidly, navigate pages, verify badge updates correctly in all browsers |
| Keyboard shortcut conflicts | Phase 3: Activation Methods | Test shortcut on Gmail, Google Docs, Slack - verify works or alternative method provided |
| Memory leaks from images | Phase 4: Image Display | Run screen saver for 1+ hour with memory profiler, verify no memory growth >50MB |
| Safari distribution requirements | Phase 0: Planning OR Phase 5: Distribution | Native app wrapper created and tested (if MVP) OR communicated as post-MVP (if deferred) |

---

## Sources

### Manifest V3 & Cross-Browser Compatibility
- [Chrome incompatibilities - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities)
- [Build a cross-browser extension - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension)
- [Manifest V3 & Manifest V2 (March 2024 update) – Mozilla Add-ons Blog](https://blog.mozilla.org/addons/2024/03/13/manifest-v3-manifest-v2-march-2024-update/)
- [Browser compatibility for manifest.json - MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_compatibility_for_manifest.json)

### Storage Quotas & Best Practices
- [Storage quotas and eviction criteria - Web APIs MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [chrome.storage API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [IndexedDB Max Storage Size Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html)
- [storage.local - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local)

### Fullscreen API & Permissions
- [Permissions-Policy: fullscreen directive - HTTP MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy/fullscreen)
- [Element: requestFullscreen() method - Web APIs MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)
- [Firefox Bug 1411227 - Allow WebExtensions to request fullscreen](https://bugzilla.mozilla.org/show_bug.cgi?id=1411227)

### CSS Z-Index & Stacking Contexts
- [z-index - CSS MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)
- [Managing CSS Stacking Contexts in a "Hostile" Environment - SitePoint](https://www.sitepoint.com/managing-css-stacking-contexts-hostile-environment/)
- [Meet the top layer: a solution to z-index:10000 - Chrome Developers Blog](https://developer.chrome.com/blog/what-is-the-top-layer)

### Memory & Performance
- [Fix memory problems - Chrome DevTools](https://developer.chrome.com/docs/devtools/memory-problems)
- [How Chrome Extensions Nearly Crashed My System - Medium](https://medium.com/@genildocs/how-chrome-extensions-nearly-crashed-my-system-a-deep-dive-into-openai-sora-memory-leaks-6ed843f2d3b6)

### IndexedDB & Blob Storage
- [Storing images and files in IndexedDB – Mozilla Hacks](https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/)
- [How to use IndexedDB to store images and other files](https://blog.q-bit.me/how-to-use-indexeddb-to-store-images-and-other-files-in-your-browser/)
- [File Handling in Chrome Extensions - Medium](https://medium.com/@mefengl/file-handling-in-chrome-extensions-a-comparison-of-split-file-transfer-indexeddb-and-blob-8f5d3ea78f44)

### Content Script Injection & Race Conditions
- [Firefox Bug 1452045 - Race condition allows injecting content scripts into wrong context](https://bugzilla.mozilla.org/show_bug.cgi?id=1452045)
- [Content scripts - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
- [Content scripts - Chrome Developers](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

### Icon Badges & State Management
- [chrome.action API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/action)
- [browserAction.setBadgeText() - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setBadgeText)
- [Firefox Bug 1395074 - Icon badge isn't cleared when new page is loaded](https://bugzilla.mozilla.org/show_bug.cgi?id=1395074)

### Safari Web Extensions
- [Safari web extensions - Apple Developer Documentation](https://developer.apple.com/documentation/safariservices/safari-web-extensions)
- [My hope for Safari extensions in 2026 - Lapcat Software](https://lapcatsoftware.com/articles/2026/1/1.html)
- [The four types of Safari extension - Underpass App Company](https://underpassapp.com/news/2023-4-24.html)

### Keyboard Shortcuts
- [chrome.commands API - Chrome Developers](https://developer.chrome.com/docs/extensions/reference/api/commands)
- [commands manifest.json key - Mozilla MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/commands)

### Cross-Browser Testing
- [Top 7 Cross Browser Testing Challenges - LambdaTest](https://www.lambdatest.com/blog/cross-browser-testing-challenges/)
- [22 Best Cross-Browser Testing Tools Reviewed in 2026 - The CTO Club](https://thectoclub.com/tools/best-cross-browser-testing-tools/)

---

*Pitfalls research for: Browser Extension (Screen Saver - Full-Screen Overlay)*
*Researched: 2026-01-19*
*Confidence: HIGH - All critical pitfalls verified through official documentation (MDN, Chrome Developers), browser bug trackers (Bugzilla, Chromium Issues), and recent community discussions (2024-2026)*
