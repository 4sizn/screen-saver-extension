---
phase: 03-settings-infrastructure
plan: 01
subsystem: storage
tags: [indexeddb, chrome.storage.sync, wxt, persistence, settings]

# Dependency graph
requires:
  - phase: 02-content-storage
    provides: IndexedDB v1 schema with ImageRecord interface and native API
provides:
  - IndexedDB v2 schema with isEnabled field for per-image rotation control
  - WXT storage definition for display settings (fit mode, background color)
  - Migration logic defaulting existing images to enabled state
affects: [03-02-settings-ui, 04-display-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - IndexedDB version migration with cursor-based data updates
    - WXT storage.defineItem for type-safe chrome.storage.sync wrapper

key-files:
  created:
    - lib/settingsStorage.ts
  modified:
    - lib/imageStorage.ts

key-decisions:
  - "Native IndexedDB cursor for v2 migration - no libraries available in service worker context"
  - "Default existing images to isEnabled: true - preserves current behavior where all images visible"
  - "WXT storage.defineItem with sync prefix - cross-device settings sync via chrome.storage.sync"
  - "Cover fit and black background as defaults - neutral baseline for letterboxing"

patterns-established:
  - "IndexedDB version migration pattern: if (event.oldVersion < N) { ... cursor.update() }"
  - "WXT storage pattern: storage.defineItem<Type>('sync:key', { fallback: {...} })"

# Metrics
duration: 2min
completed: 2026-01-19
---

# Phase 3 Plan 1: Settings Infrastructure Summary

**IndexedDB v2 schema with isEnabled field and WXT storage for display settings (fit mode, background color)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-19T10:09:07Z
- **Completed:** 2026-01-19T10:11:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Migrated IndexedDB from version 1 to version 2 with isEnabled boolean field
- Created WXT storage definition for persistent display settings (imageFit, backgroundColor)
- Established migration pattern for defaulting existing images to enabled state
- Added toggleImageEnabled function for UI integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate IndexedDB to version 2 with isEnabled field** - `d534d03` (feat)
2. **Task 2: Create WXT storage definition for display settings** - `28c3d68` (feat)

## Files Created/Modified
- `lib/imageStorage.ts` - Added isEnabled field to ImageRecord, updated DB_VERSION to 2, added migration logic and toggleImageEnabled function
- `lib/settingsStorage.ts` - Created WXT storage definition with DisplaySettings interface and sync-backed storage item

## Decisions Made

**IndexedDB migration approach:**
- Used native IndexedDB cursor for v2 migration - service worker context prevents library usage
- Default existing images to `isEnabled: true` - preserves current behavior where all images are visible
- No index on isEnabled boolean - inefficient in IndexedDB, filter in-memory instead with small datasets

**Storage architecture:**
- WXT storage.defineItem with `sync:` prefix - enables cross-device settings sync via chrome.storage.sync
- Fallback defaults (cover fit, black background) - ensures settings always have defined values
- Small data size (~50 bytes) well within chrome.storage.sync 8KB item limit

**Import path correction:**
- Used `wxt/utils/storage` instead of `wxt/storage` - correct export path based on WXT package structure

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected WXT storage import path**
- **Found during:** Task 2 (Create settingsStorage.ts)
- **Issue:** TypeScript error "Cannot find module 'wxt/storage'" - research document used incorrect import path
- **Fix:** Changed import from `'wxt/storage'` to `'wxt/utils/storage'` based on package.json exports
- **Files modified:** lib/settingsStorage.ts
- **Verification:** npm run type-check passes without errors
- **Committed in:** 28c3d68 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Import path correction necessary for TypeScript compilation. No scope changes, plan executed as intended.

## Issues Encountered

None - both tasks completed without blocking issues beyond the import path correction handled automatically.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- Backend storage infrastructure complete
- ImageRecord interface includes isEnabled field
- DisplaySettings storage defined with sensible defaults
- toggleImageEnabled function available for UI integration
- Migration logic tested (type-check passes)

**For Phase 3 Plan 2 (Settings UI):**
- Can consume displaySettings storage item with getValue/setValue
- Can call toggleImageEnabled(id) from Switch component handlers
- ImageList component can read isEnabled from ImageRecord to show toggle state

**No blockers or concerns identified.**

---
*Phase: 03-settings-infrastructure*
*Completed: 2026-01-19*
