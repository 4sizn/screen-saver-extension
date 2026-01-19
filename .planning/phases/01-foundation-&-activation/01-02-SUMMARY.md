---
phase: 01-foundation-&-activation
plan: 02
subsystem: ui
tags: [react, shadow-dom, content-script, wxt, overlay, keyboard-events]

# Dependency graph
requires:
  - phase: 01-01
    provides: "WXT project structure, background service worker, message protocol"
provides:
  - Content script with Shadow DOM UI lifecycle management
  - Full-screen overlay component with ESC key deactivation
  - CSS style isolation via Shadow DOM
  - React overlay mount/unmount on ACTIVATE/DEACTIVATE messages
  - Fixed positioning overlay with maximum z-index
affects: [image-display, customization, overlay-enhancements]

# Tech tracking
tech-stack:
  added: [@tailwindcss/postcss]
  patterns: [shadow-dom-ui, content-script-messaging, keyboard-event-handling, fixed-overlay-positioning]

key-files:
  created: [entrypoints/content/index.tsx, entrypoints/content/ScreenSaverOverlay.tsx, entrypoints/content/style.css]
  modified: [postcss.config.js, package.json, package-lock.json]

key-decisions:
  - "Window-level keydown listener - ensures ESC capture even if focus moves to iframe"
  - "Shadow DOM cssInjectionMode: 'ui' - isolates extension styles from host page CSS"
  - "Fixed positioning with max z-index - provides full-screen coverage without Fullscreen API"
  - "Tailwind v4 @tailwindcss/postcss plugin - required for Tailwind v4 PostCSS integration"

patterns-established:
  - "WXT createShadowRootUi pattern: position: 'overlay', anchor: 'body', cssInjectionMode: 'ui'"
  - "Content script message handling: listen for ACTIVATE/DEACTIVATE, call ui.mount()/ui.remove()"
  - "ESC key deactivation: window.addEventListener('keydown'), check e.key === 'Escape', sendMessage"
  - "Overlay CSS: position: fixed, z-index: 2147483647, 100vw/100vh, black background"

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 1 Plan 02: Content Script & Overlay Summary

**Shadow DOM React overlay with ESC key deactivation, full-screen fixed positioning (z-index: 2147483647), and message-based mount/unmount lifecycle**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T05:20:11Z
- **Completed:** 2026-01-19T05:22:18Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Content script injects Shadow DOM overlay into all web pages (<all_urls>)
- React overlay mounts/unmounts in response to background script messages
- ESC key sends DEACTIVATE message to background for clean state management
- CSS fixed positioning provides full-screen coverage without Fullscreen API restrictions
- Style isolation via Shadow DOM prevents host page CSS interference

## Task Commits

Each task was committed atomically:

1. **Task 1: Create content script with Shadow DOM UI lifecycle** - `73aaf6b` (feat)
2. **Task 2: Build full-screen overlay component with ESC key handler** - `c290ef5` (feat)

**Plan metadata:** (to be committed separately)

## Files Created/Modified

### Created
- `entrypoints/content/index.tsx` - Content script with Shadow DOM UI lifecycle, message listener for ACTIVATE/DEACTIVATE
- `entrypoints/content/ScreenSaverOverlay.tsx` - React component with ESC key handler and placeholder content
- `entrypoints/content/style.css` - Fixed positioning overlay styles with max z-index

### Modified
- `postcss.config.js` - Updated to use @tailwindcss/postcss for Tailwind v4
- `package.json` - Added @tailwindcss/postcss dependency
- `package-lock.json` - Locked dependency versions

## Decisions Made

**Window-level keydown listener:**
- Registered event listener on window, not overlay element
- Rationale: Ensures ESC capture even if focus moves to iframe or other element (more reliable than element-level listener)

**Shadow DOM cssInjectionMode: 'ui':**
- Configured cssInjectionMode: 'ui' in defineContentScript
- Rationale: Injects CSS into Shadow DOM instead of host page, provides style isolation

**Fixed positioning with max z-index:**
- Used position: fixed, z-index: 2147483647, 100vw/100vh
- Rationale: Provides full-screen coverage without Fullscreen API restrictions (which require user interaction)

**Tailwind v4 @tailwindcss/postcss plugin:**
- Switched from 'tailwindcss' to '@tailwindcss/postcss' in PostCSS config
- Rationale: Tailwind v4 moved PostCSS plugin to separate package, required for build to succeed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Tailwind v4 PostCSS configuration**
- **Found during:** Task 1 (Build verification)
- **Issue:** Build failed with "tailwindcss directly as a PostCSS plugin" error - Tailwind v4 requires @tailwindcss/postcss package instead of tailwindcss plugin
- **Fix:** Installed @tailwindcss/postcss and updated postcss.config.js to use '@tailwindcss/postcss' instead of 'tailwindcss'
- **Files modified:** postcss.config.js, package.json, package-lock.json
- **Verification:** npm run build succeeded, content script compiled to .output/chrome-mv3/content-scripts/content.js
- **Committed in:** 73aaf6b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for build to succeed. Tailwind v4 breaking change in PostCSS plugin architecture. No scope creep.

## Issues Encountered

None - plan executed smoothly after PostCSS configuration fix.

## User Setup Required

None - no external service configuration required. Extension can be loaded directly into browser for development testing:

```bash
npm run dev
# Load extension from .output/chrome-mv3 in browser
```

## Next Phase Readiness

**Ready for Plan 03 (Image Display):**
- Content script successfully injects into all web pages
- Shadow DOM overlay mounts/unmounts correctly
- ESC key deactivation working
- Message protocol communication verified (background ↔ content)
- Style isolation prevents host page interference

**Dependencies for Plan 03:**
- Image component should render inside ScreenSaverOverlay.tsx
- Random image selection logic should be in separate component or hook
- Shadow DOM rem-to-px conversion already configured (Tailwind classes will work)

**Known limitations:**
- Placeholder content only (no images yet) - intentional, addressed in Plan 03/04
- No icon overlay for deactivation yet - will be added in future plan

---
*Phase: 01-foundation-&-activation*
*Completed: 2026-01-19*
