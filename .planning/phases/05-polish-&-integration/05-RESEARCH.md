# Phase 5: Polish & Integration - Research

**Researched:** 2026-01-19
**Domain:** Cross-browser extension testing, distribution, and store submission
**Confidence:** HIGH

## Summary

Phase 5 focuses on final polish, cross-browser testing, and preparation for distribution across multiple browser extension stores. The extension is built with WXT, a modern framework specifically designed for cross-browser compatibility with built-in support for creating browser-specific builds and automated submission workflows.

The research identified three critical domains:
1. **Cross-browser testing and verification** - Manual testing checklists, automated testing approaches, and browser-specific compatibility validation
2. **Store submission requirements** - Each browser store (Chrome Web Store, Firefox Add-ons, Microsoft Edge Add-ons, Safari App Store) has unique packaging, review, and policy requirements
3. **Distribution tooling** - WXT provides `wxt zip` for browser-specific builds and `wxt submit` for automated store submissions

**Primary recommendation:** Use WXT's built-in distribution commands to generate browser-specific ZIP files, conduct comprehensive manual testing across all target browsers (Chrome, Firefox, Edge, Safari), and prepare store listings before initiating submissions. Address the known audio autoplay issue by removing automatic sound playback or adding user guidance.

## Standard Stack

The established tools for browser extension distribution and testing:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| WXT | 0.20.13 | Extension build framework | Industry-leading cross-browser support, built-in distribution tooling, Vite-based build system |
| TypeScript | 5.9.3 | Type-safe development | Required for manifest validation and API type checking |

### Testing Tools
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Browser DevTools | Native | Manual testing & debugging | All testing phases - Timeline, Profiles, Memory profiler |
| Chrome Task Manager | Native | Performance monitoring | Verify RAM <15MB, CPU usage at 0 when idle |
| Playwright | Latest | Automated E2E testing | CI/CD pipelines (optional for this phase) |

### Distribution Commands
| Command | Purpose | Output |
|---------|---------|--------|
| `wxt zip` | Chrome build (default) | `.output/{name}-{version}-chrome.zip` |
| `wxt zip -b firefox` | Firefox build with sources | `.output/{name}-{version}-firefox.zip` + sources ZIP |
| `wxt zip -b edge` | Edge build | `.output/{name}-{version}-edge.zip` |
| `wxt submit init` | Configure store credentials | `.env.submit` file |
| `wxt submit` | Automated store submission | Uploads to configured stores |

**Installation:**
```bash
# Already installed in project
# No additional dependencies needed for Phase 5
```

## Architecture Patterns

### Recommended Testing Structure

**Manual Testing Checklist:**
```
Phase 5 Testing/
├── Cross-Browser Verification
│   ├── Chrome (latest stable)
│   ├── Firefox (latest stable)
│   ├── Edge (latest stable)
│   └── Safari (if macOS available)
│
├── Functional Testing
│   ├── Activation/deactivation flows
│   ├── Image management (upload, delete, reorder)
│   ├── Settings persistence
│   └── Display modes (cover/contain)
│
├── Edge Case Testing
│   ├── Service worker restart scenarios
│   ├── Multiple tabs/windows
│   ├── Incognito/private mode
│   └── First install vs. update
│
└── Performance Testing
    ├── Memory usage (Chrome Task Manager)
    ├── CPU usage at idle
    └── Image loading performance
```

### Pattern 1: Browser-Specific Build Generation

**What:** Create separate ZIP packages for each browser store using WXT CLI flags
**When to use:** Before submitting to any browser extension store
**Example:**
```bash
# Chrome Web Store (default)
npm run zip
# Output: .output/screen-saver-1.0.0-chrome.zip

# Firefox Add-ons (includes source code ZIP)
wxt zip -b firefox
# Output: .output/screen-saver-1.0.0-firefox.zip
#         .output/screen-saver-1.0.0-sources.zip

# Microsoft Edge Add-ons
wxt zip -b edge
# Output: .output/screen-saver-1.0.0-edge.zip
```

**Why separate builds:**
- Firefox defaults to Manifest V2, Chrome/Edge to V3
- Firefox requires source code submission for minified code
- Store-specific optimizations and manifest differences

### Pattern 2: Multi-Window State Management

**What:** Test extension behavior with multiple browser windows and tabs
**When to use:** Critical for extensions using service workers and per-tab state
**Known issues from research:**
- Extensions run simultaneously in multiple windows can experience resource conflicts
- Tab navigation may lose state if not properly persisted
- Service worker restarts require state restoration from storage

**Verification steps:**
```
1. Open extension in Window A, Tab 1
2. Activate screen saver
3. Open Window B, Tab 2
4. Verify Window A state unchanged
5. Activate in Window B
6. Close Window A
7. Verify Window B continues working
8. Restart browser
9. Verify badge state restored correctly
```

### Pattern 3: Performance Profiling Before Submission

**What:** Use Chrome DevTools and Task Manager to verify performance benchmarks
**When to use:** Before final submission to any store
**Benchmarks:**
```typescript
// Performance targets
const PERFORMANCE_TARGETS = {
  maxMemoryMB: 15,        // Extensions >15MB should be optimized
  cpuIdleUsage: 0,        // CPU should be 0% when extension idle
  imageLoadTime: 500,     // Image display <500ms
  activationTime: 200,    // Icon click to overlay <200ms
};
```

**How to measure:**
1. Open Chrome Task Manager (Shift+Esc)
2. Enable extension
3. Monitor "Memory footprint" column
4. Let browser run for full day
5. Check CPU column (should be 0 when idle)
6. Use DevTools Timeline to profile activation flow

### Anti-Patterns to Avoid

- **Submitting same ZIP to all stores** - Firefox requires source code, Safari needs converter tool, manifests differ
- **Testing only in development mode** - Production builds may have different behavior (minification, CSP)
- **Ignoring service worker lifecycle** - Test extension behavior after browser restart and idle periods
- **Assuming autoplay policies allow sound** - Audio requires user interaction, cannot autoplay on activation
- **Not testing incognito mode** - Extensions may behave differently with restricted permissions

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser-specific builds | Custom webpack configs per browser | `wxt zip -b [browser]` | WXT handles manifest versions, API polyfills, and browser differences automatically |
| Store submission automation | Custom upload scripts | `wxt submit` | Handles authentication, versioning, and store-specific requirements |
| Cross-browser API differences | Manual browser detection + polyfills | WXT's `browser` global | Promise-based wrapper works across Chrome/Firefox/Edge automatically |
| Extension packaging | Manual ZIP creation | `wxt zip` | Excludes dev files, includes proper manifest, handles sources ZIP for Firefox |
| Performance monitoring | Custom timing code | Chrome DevTools + Task Manager | Built-in profiling catches memory leaks, CPU spikes, DOM bottlenecks |

**Key insight:** Extension distribution has many edge cases (Firefox source requirements, Safari converter needs, manifest version differences). WXT framework already solved these - use its tooling rather than implementing custom solutions.

## Common Pitfalls

### Pitfall 1: Excessive Permissions (Top Store Rejection Reason)

**What goes wrong:** Extension rejected for requesting `<all_urls>` or permissions it doesn't actually use
**Why it happens:** Developers request broad permissions "just in case" or forget to remove unused permissions after refactoring
**How to avoid:**
- Audit `manifest.permissions`, `optional_permissions`, and `host_permissions` in `wxt.config.ts`
- Only request minimum permissions needed for current functionality
- For this project: verify `storage`, `notifications`, `activeTab`, `unlimitedStorage` are all actively used
**Warning signs:** Store reviewer asks "Why does your extension need X permission?" in rejection notice

### Pitfall 2: Audio Autoplay Policy Violations

**What goes wrong:** NotAllowedError when trying to play activation sound (already observed in Phase 4)
**Why it happens:** Browser autoplay policies block audio without user interaction. Extension icon click is not considered sufficient interaction for the content script context
**How to avoid:**
- Option A: Remove audio playback entirely (simplest)
- Option B: Mute audio by default, require user to enable in settings with warning
- Option C: Use `unlocked` state tracking after first user interaction in page
**Warning signs:** Console errors showing `NotAllowedError: play() failed because user didn't interact with document first`

**Recommendation for this project:** Remove automatic audio playback. The visual overlay + notification already provide sufficient activation feedback.

### Pitfall 3: Service Worker State Loss After Restart

**What goes wrong:** Badge state resets, activation states lost when service worker terminates
**Why it happens:** Service workers are ephemeral - they terminate after 30 seconds of inactivity in Chrome
**Current status:** Project uses in-memory `Set` for activation state (per STATE.md: "Service workers restart frequently, simple toggle doesn't need persistence")
**How to avoid:**
- Badge state is managed per-tab via `browser.action.setBadgeBackgroundColor()` - persists automatically
- Activation state uses in-memory storage - acceptable because overlay removal on navigation is expected behavior
- Don't rely on global variables surviving service worker restart
**Warning signs:** Extension works immediately after activation but fails after 5 minutes of inactivity

**Verification test:**
```
1. Activate screen saver
2. Wait 2 minutes (service worker terminates)
3. Click icon again (should deactivate)
4. Check if badge state correct
```

### Pitfall 4: Cross-Origin IndexedDB Access (Already Resolved)

**What goes wrong:** Content script cannot access extension IndexedDB because it runs in web page origin
**Why it happens:** Browser security model isolates content script storage from extension storage
**Resolution status:** ✅ RESOLVED in Phase 4 via message passing architecture (see Phase 4 VERIFICATION.md)
**Lesson learned:** Always use `browser.runtime.sendMessage()` for content scripts to request data from background script
**Warning signs:** `getAllImages()` returns empty array in content script despite database having images

### Pitfall 5: Firefox Source Code Review Requirements

**What goes wrong:** Extension rejected by Firefox Add-ons because reviewers cannot rebuild from sources
**Why it happens:** Firefox requires source code submission for any extension using minification or build tools. Reviewers must be able to run build and produce identical output
**How to avoid:**
- Use `wxt zip -b firefox` - automatically creates sources ZIP with proper exclusions
- Create `SOURCE_CODE_REVIEW.md` with exact build instructions
- List all environment requirements (Node version, npm version)
- Test that sources ZIP actually rebuilds to identical extension
**Warning signs:** Firefox rejection stating "We were unable to rebuild your extension from the provided source code"

**Required content for SOURCE_CODE_REVIEW.md:**
```markdown
# Build Instructions

## Requirements
- Node.js 18+
- npm 9+

## Build Steps
1. npm install
2. npm run build
3. Extension output in .output/chrome-mv3/

## Verification
The built manifest.json should match the submitted version exactly.
```

### Pitfall 6: CSP Violations (Already Resolved)

**What goes wrong:** Content Security Policy blocks extension functionality
**Resolution status:** ✅ RESOLVED in Phase 4 - disabled Web Worker in browser-image-compression to prevent CDN script loading
**Current approach:** Image compression runs in main thread with `useWebWorker: false`
**Impact:** Slight performance impact during upload, but avoids CSP violation
**Warning signs:** Console errors mentioning `refused to load script` or `CSP violation`

### Pitfall 7: Testing Only in Development Mode

**What goes wrong:** Extension works in `wxt dev` but fails in production build
**Why it happens:** Development mode uses different CSP, has HMR injected, may load resources differently
**How to avoid:**
```bash
# Build production version
npm run build

# Load unpacked from .output/chrome-mv3/
# Test all functionality in production mode
```
**Warning signs:** Features work in dev but break after `wxt build`

### Pitfall 8: Not Testing Browser-Specific Manifest Differences

**What goes wrong:** Extension works in Chrome but rejected by Firefox or Edge due to manifest incompatibilities
**Why it happens:** Firefox defaults to MV2, Chrome/Edge to MV3. API availability differs.
**How to avoid:**
- Build browser-specific packages: `wxt zip -b firefox`, `wxt zip -b edge`
- Load and test each build in its target browser
- Verify web_accessible_resources work in all browsers
**Warning signs:** Extension loads in Chrome but fails validation in Firefox Developer Hub

## Code Examples

Verified patterns from WXT documentation and project implementation:

### Browser-Specific Build Commands

```bash
# Source: https://wxt.dev/guide/essentials/publishing

# Chrome Web Store submission
npm run zip
# Creates: .output/screen-saver-1.0.0-chrome.zip

# Firefox Add-ons submission (includes source code)
wxt zip -b firefox
# Creates: .output/screen-saver-1.0.0-firefox.zip
#          .output/screen-saver-1.0.0-sources.zip

# Microsoft Edge Add-ons submission
wxt zip -b edge
# Creates: .output/screen-saver-1.0.0-edge.zip

# Verify package contents
unzip -l .output/screen-saver-1.0.0-chrome.zip
```

### Performance Profiling Script

```bash
# Source: Research from Chrome extension testing best practices

# 1. Build production version
npm run build

# 2. Load extension from .output/chrome-mv3/

# 3. Monitor with Task Manager
# Press Shift+Esc in Chrome
# Find "Extension: Screen Saver"
# Check Memory footprint (<15MB target)
# Check CPU % (should be 0 when idle)

# 4. Profile activation flow
# Open DevTools > Performance tab
# Click Record
# Click extension icon (activate)
# Stop recording
# Verify total time <200ms
```

### Manual Testing Checklist

```markdown
# Source: Synthesized from Chrome/Firefox/Edge testing guidelines

## Pre-Submission Testing Checklist

### Installation & First Run
- [ ] Fresh install shows default images immediately
- [ ] Badge initializes to gray/inactive state
- [ ] No console errors on install
- [ ] Default images count = 15 (verify in DevTools IndexedDB)

### Activation Flow
- [ ] Icon click activates screen saver
- [ ] Full-screen overlay appears
- [ ] Random image displayed
- [ ] Badge turns green
- [ ] Notification shows (Korean text)
- [ ] Audio autoplay error is acceptable (known issue)

### Deactivation Flow
- [ ] Icon click deactivates screen saver
- [ ] Overlay disappears immediately
- [ ] Badge turns gray
- [ ] No notification (silent deactivation)
- [ ] ESC key also deactivates

### Image Management
- [ ] Upload image (JPEG/PNG)
- [ ] Image appears in list with preview
- [ ] Delete custom image
- [ ] Reorder images via drag-and-drop
- [ ] Default images cannot be deleted
- [ ] Image enable/disable toggles work

### Settings Persistence
- [ ] Change fit mode (cover/contain)
- [ ] Change background color
- [ ] Disable some images
- [ ] Restart browser
- [ ] Verify all settings restored

### Display Modes
- [ ] Cover mode fills screen (no letterboxing)
- [ ] Contain mode shows letterboxing
- [ ] Background color visible in contain mode
- [ ] Random selection varies across activations
- [ ] Disabled images never appear

### Cross-Browser Testing
- [ ] Test in Chrome (latest stable)
- [ ] Test in Firefox (latest stable)
- [ ] Test in Edge (latest stable)
- [ ] Test in Safari (if macOS available)
- [ ] Verify identical behavior across browsers

### Edge Cases
- [ ] Multiple windows with different tabs
- [ ] Incognito/private browsing mode
- [ ] Service worker restart (wait 2 min, test again)
- [ ] Update from previous version (if applicable)
- [ ] Uninstall and reinstall

### Performance Verification
- [ ] Memory usage <15MB (Chrome Task Manager)
- [ ] CPU usage = 0% when idle
- [ ] Image loads in <500ms
- [ ] Activation responds in <200ms
```

### Store Listing Template

```markdown
# Source: Chrome Web Store, Firefox Add-ons listing requirements

## Extension Name
Screen Saver

## Short Description (132 characters max)
Instant one-click screen saver with beautiful nature images and custom photo support.

## Full Description (250-10,000 characters)

Transform any browser tab into a stunning full-screen screen saver with a single click.

**Features:**
- One-click activation via extension icon
- 15 beautiful nature landscape photos included
- Upload your own images for personalization
- Random image selection keeps display fresh
- Two display modes: Cover (fill screen) or Contain (preserve aspect ratio)
- Customizable background color for letterboxing
- Enable/disable individual images
- Deactivate with ESC key or icon click

**Perfect for:**
- Privacy during work breaks
- Displaying calming imagery during focus sessions
- Personal aesthetic enjoyment
- Quick screen protection when stepping away

**Privacy:**
All images stored locally on your device. No data collection. No cloud uploads. No tracking.

**Keyboard Shortcut:**
- ESC: Deactivate screen saver

**How to Use:**
1. Click extension icon to activate screen saver
2. Click icon again or press ESC to deactivate
3. Right-click icon > Options to upload images and configure settings

**Support:**
Contact: [your-email@example.com]

## Category
Productivity (Chrome), Appearance (Firefox)

## Privacy Policy URL
[Create simple privacy policy page]
"Screen Saver extension does not collect, store, or transmit any personal data. All images are stored locally on your device using browser storage APIs. No analytics. No tracking. No third-party services."

## Support URL
[GitHub repository or support email]

## Screenshots (1280x800 or 640x480)
1. Screen saver active with nature image
2. Options page showing image management
3. Settings panel with fit modes and color picker
4. Extension icon with active badge state

## Promotional Images
- Small tile: 440x280px (optional)
- Large tile: 1400x560px (optional for featured listing)
```

### Automated Submission Setup (Optional)

```bash
# Source: https://wxt.dev/guide/essentials/publishing

# Initialize automated submission (optional for Phase 5)
wxt submit init

# Prompts for:
# - Chrome Web Store: Client ID, Client Secret, Refresh Token, Extension ID
# - Firefox Add-ons: JWT Issuer, JWT Secret, Extension ID
# - Edge Add-ons: Product ID, Client ID, Client Secret, Access Token URL

# Creates .env.submit file (DO NOT commit to git)

# Test credentials
wxt submit --dry-run

# Submit to all configured stores
wxt submit

# Note: For Phase 5, manual submission recommended
# Automated submission is optional for future updates
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manifest V2 background pages | Manifest V3 service workers | 2023-2024 | Ephemeral workers require state persistence, no DOM/window access |
| Remote code execution allowed | All code must be in package | MV3 requirement | Web Workers cannot load CDN scripts, must bundle everything |
| Blocking webRequest API | declarativeNetRequest API | MV3 requirement | Not applicable to this project (no network blocking) |
| localStorage in extensions | chrome.storage or IndexedDB | MV3 best practice | Project uses IndexedDB for images, chrome.storage for settings |
| Manual browser detection | Framework-provided abstraction | WXT 2024+ | `import.meta.env.BROWSER` provides compile-time detection |
| Single manifest.json | Browser-specific manifests | Multi-browser builds | WXT generates appropriate manifest per target browser |

**Deprecated/outdated:**
- **Manifest V2**: Chrome deprecated June 2024, Firefox still supports but moving to V3. WXT handles both automatically.
- **chrome.storage for Blobs**: Not efficient for binary data. Use IndexedDB instead (project already follows this).
- **Background page `persistent: true`**: Not allowed in MV3. Service workers terminate automatically.
- **executeScript() from tabs API**: Replaced with `scripting.executeScript()` in MV3 (WXT polyfills this).

## Open Questions

Things that couldn't be fully resolved:

1. **Audio Autoplay Policy Handling**
   - What we know: Browser policies block audio without user interaction (NotAllowedError confirmed in Phase 4)
   - What's unclear: Whether there's a legitimate workaround that doesn't degrade UX
   - Recommendation: Remove automatic audio playback in Phase 5. Visual overlay + notification provide sufficient feedback.

2. **Safari Support Without macOS**
   - What we know: Safari requires `safari-web-extension-converter` tool which only runs on macOS
   - What's unclear: Whether project has access to macOS environment for Safari testing/distribution
   - Recommendation: If macOS unavailable, defer Safari support to future release. Document as known limitation.

3. **Badge State Persistence After Browser Restart**
   - What we know: Current implementation uses in-memory state, badges set per-tab via API
   - What's unclear: Whether badge color persists after browser restart (not documented clearly)
   - Recommendation: Add verification test: restart browser, check if badge colors restored correctly. If not, may need chrome.storage persistence.

4. **IndexedDB Quota Enforcement with unlimitedStorage**
   - What we know: Manifest includes `unlimitedStorage` permission (prevents quota-based eviction)
   - What's unclear: Actual limits in practice across browsers (Chrome: 60% disk, Firefox: 50% disk, Safari: more restrictive)
   - Recommendation: Test image storage up to 100MB to verify no quota issues. Current 15 defaults + reasonable user uploads (~50 images) should stay well under limits.

5. **Source Code Rebuild Verification for Firefox**
   - What we know: Firefox requires source code that rebuilds identically to submitted extension
   - What's unclear: Whether WXT's sources ZIP includes everything needed (node_modules? .env files?)
   - Recommendation: Test locally by extracting sources ZIP, running `npm install && npm run build`, comparing output to original. Document exact steps in SOURCE_CODE_REVIEW.md.

## Sources

### Primary (HIGH confidence)

- [WXT Publishing Guide](https://wxt.dev/guide/essentials/publishing) - Browser-specific builds, automated submission
- [WXT Multi-Browser Support](https://wxt.dev/guide/key-concepts/multiple-browsers.html) - Build commands, runtime detection
- [Chrome Web Store Publishing](https://developer.chrome.com/docs/webstore/publish) - Package requirements, review process
- [Firefox Add-ons Submission](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/) - Packaging, validation, source code requirements
- [Microsoft Edge Publishing](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension) - Step-by-step submission process
- [Chrome Manifest V3 Migration Checklist](https://developer.chrome.com/docs/extensions/develop/migrate/checklist) - Migration requirements, API replacements
- [Chrome Extension Service Worker Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle) - State persistence patterns

### Secondary (MEDIUM confidence)

- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay/) - Audio autoplay restrictions
- [MDN Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) - Cross-browser autoplay policies
- [Chrome Web Store Troubleshooting](https://developer.chrome.com/docs/webstore/troubleshooting) - Common rejection reasons
- [IndexedDB Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - Quota limits by browser
- [BrowserStack Chrome Extension Testing](https://www.browserstack.com/guide/chrome-extensions-for-testing) - Testing best practices

### Tertiary (LOW confidence - WebSearch only)

- [The 2025 State of Browser Extension Frameworks](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/) - Framework comparison
- [Five Insights from Testing Chrome Extension](https://www.paralect.com/blog/post/insights-from-testing-a-new-chrome-extension) - Multi-tab testing issues
- [Mozilla Data Collection Disclosure Requirements](https://blog.mozilla.org/addons/2025/10/23/data-collection-consent-changes-for-new-firefox-extensions/) - New 2026 requirement
- Community discussions about service worker state persistence

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - WXT framework officially documented, project already using 0.20.13
- Architecture patterns: HIGH - Based on official WXT, Chrome, Firefox, and Edge documentation
- Distribution process: HIGH - Direct from official store documentation and WXT guides
- Testing approaches: MEDIUM - Synthesized from multiple sources, some best practices not formally documented
- Audio autoplay handling: MEDIUM - Well-documented policies, but workarounds vary by implementation
- Performance benchmarks: LOW - Community consensus (15MB RAM, 0% CPU idle) not officially standardized

**Research date:** 2026-01-19
**Valid until:** 60 days (stable APIs, but store policies may change quarterly)

**Known limitations:**
- Safari distribution not researched in depth (requires macOS tooling not available in all environments)
- Automated `wxt submit` workflow not verified with actual credentials (requires store accounts)
- Performance benchmarks based on community consensus, not official Chrome guidelines
- Audio autoplay workarounds based on policy documentation, not tested implementations
