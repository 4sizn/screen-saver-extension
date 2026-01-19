# Roadmap: Screen Saver Browser Extension

## Overview

This roadmap delivers a cross-browser screen saver extension from foundation to distribution across 5 phases. We start with architectural foundations (cross-browser setup and activation mechanics), build content storage infrastructure, add settings management, implement the visual display layer, and finish with polish and integration. The sequence prioritizes architectural correctness over feature velocity to avoid critical pitfalls identified in research.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Activation** - Extension scaffold with cross-browser support and basic activation
- [x] **Phase 2: Content Storage** - Image storage infrastructure and management UI
- [x] **Phase 3: Settings Infrastructure** - Settings page with persistence and configuration
- [ ] **Phase 4: Display & Slideshow** - Full-screen overlay with image rendering
- [ ] **Phase 5: Polish & Integration** - Final integration, testing, and distribution readiness

## Phase Details

### Phase 1: Foundation & Activation
**Goal**: Cross-browser extension infrastructure works with basic activation mechanics
**Depends on**: Nothing (first phase)
**Requirements**: XBRS-01, XBRS-02, XBRS-03, XBRS-04, XBRS-05, ACT-01, ACT-02, ACT-03, ACT-04
**Success Criteria** (what must be TRUE):
  1. User can install extension on Chrome, Firefox, Edge, and Safari
  2. User can activate screen saver by clicking extension icon
  3. User can deactivate screen saver by clicking extension icon again
  4. User can deactivate screen saver by pressing ESC key
  5. Extension icon shows visual badge indicating active/inactive state
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Project setup & background service worker with activation logic
- [x] 01-02-PLAN.md — Content script with Shadow DOM overlay and ESC handler
- [x] 01-03-PLAN.md — Extension assets and cross-browser verification
- [x] 01-04-PLAN.md — Fix TypeScript type error in audio path (gap closure)
- [x] 01-05-PLAN.md — Cross-browser verification testing (gap closure)

### Phase 2: Content Storage
**Goal**: Users can upload, store, and manage custom images locally
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06
**Success Criteria** (what must be TRUE):
  1. Extension includes 10-20 default nature landscape images available immediately
  2. User can upload custom images via file picker from settings page
  3. User can view list of all uploaded images with visual indicators
  4. User can delete individual uploaded images
  5. User can reorder images in the collection
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Storage infrastructure (IndexedDB with idb, image processing utilities)
- [x] 02-02-PLAN.md — UI foundation (Shadcn Button and Card components)
- [x] 02-03-PLAN.md — Default images bundle and options page scaffold
- [x] 02-04-PLAN.md — Image management UI (upload with compression, sortable list with delete)
- [x] 02-05-PLAN.md — Integration and verification (background script wiring, manifest updates)

### Phase 3: Settings Infrastructure
**Goal**: Users can configure screen saver behavior through persistent settings
**Depends on**: Phase 2
**Requirements**: SET-01, SET-02, SET-03, SET-04, SET-05
**Success Criteria** (what must be TRUE):
  1. User can access settings page from extension popup or browser options
  2. User can enable/disable specific images from rotation
  3. User can configure how images fit the screen (cover/contain)
  4. User can configure background color for images that don't fill screen
  5. Settings persist across browser sessions and extension updates
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Settings storage foundation (IndexedDB v2 migration, WXT displaySettings)
- [x] 03-02-PLAN.md — Display settings UI (fit selector and color picker)
- [x] 03-03-PLAN.md — Image enable/disable toggles (Switch controls in ImageList)

### Phase 4: Display & Slideshow
**Goal**: Screen saver displays images in full-screen overlay with proper rendering
**Depends on**: Phase 3
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04, DISP-05
**Success Criteria** (what must be TRUE):
  1. Screen saver displays as full-screen overlay covering current tab content
  2. Screen saver shows one random image selected from available collection
  3. Image remains static until user deactivates (no automatic transitions)
  4. Image displays with user-configured fit option (cover or contain)
  5. Background color displays correctly for images that don't fill screen
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Image display implementation (loading, rendering, blob URL lifecycle)
- [ ] 04-02-PLAN.md — Visual verification across fit modes and settings

### Phase 5: Polish & Integration
**Goal**: Extension is polished, tested across browsers, and ready for distribution
**Depends on**: Phase 4
**Requirements**: (No new requirements - integration of all existing)
**Success Criteria** (what must be TRUE):
  1. Extension works identically on Chrome, Firefox, Edge, and Safari
  2. All activation, deactivation, and display flows work without errors
  3. Image management (upload, delete, reorder) works reliably
  4. Settings persist correctly and take effect immediately
  5. Extension passes browser-specific validation requirements for distribution
**Plans**: TBD

Plans:
- TBD (will be created during plan-phase)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Activation | 5/5 | ✓ Complete | 2026-01-19 |
| 2. Content Storage | 5/5 | ✓ Complete | 2026-01-19 |
| 3. Settings Infrastructure | 3/3 | ✓ Complete | 2026-01-19 |
| 4. Display & Slideshow | 0/2 | Not started | - |
| 5. Polish & Integration | 0/TBD | Not started | - |

---
*Created: 2026-01-19*
*Last updated: 2026-01-19*
