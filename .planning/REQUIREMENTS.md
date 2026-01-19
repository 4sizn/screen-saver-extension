# Requirements: Screen Saver Browser Extension

**Defined:** 2026-01-19
**Core Value:** Instant, one-click screen saver activation in any browser tab, combining beautiful default imagery with personal customization

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Activation

- [x] **ACT-01**: User can activate screen saver by clicking extension icon
- [x] **ACT-02**: User can deactivate screen saver by clicking extension icon again
- [x] **ACT-03**: User can deactivate screen saver by pressing ESC key
- [x] **ACT-04**: Extension icon shows visual state (active/inactive badge)

### Display

- [ ] **DISP-01**: Screen saver displays as full-screen overlay in current tab
- [ ] **DISP-02**: Screen saver shows one random image from available collection
- [ ] **DISP-03**: Image remains static until user deactivates (no automatic slideshow)
- [ ] **DISP-04**: Image displays with proper fit options (cover/contain)
- [ ] **DISP-05**: Background color is configurable for images that don't fill screen

### Content

- [x] **CONT-01**: Extension includes 10-20 default nature landscape images
- [x] **CONT-02**: User can upload custom images via file picker
- [x] **CONT-03**: Uploaded images are stored locally in browser storage
- [x] **CONT-04**: User can view list of all uploaded images
- [x] **CONT-05**: User can delete uploaded images
- [x] **CONT-06**: User can reorder images in the collection

### Settings

- [x] **SET-01**: User can access settings page from extension popup or options
- [x] **SET-02**: User can enable/disable specific images from rotation
- [x] **SET-03**: User can configure image display fit (cover/contain)
- [x] **SET-04**: User can configure background color for images
- [x] **SET-05**: Settings persist across browser sessions

### Cross-Browser

- [x] **XBRS-01**: Extension works on Chrome (Manifest V3)
- [x] **XBRS-02**: Extension works on Firefox
- [x] **XBRS-03**: Extension works on Edge
- [x] **XBRS-04**: Extension works on Safari
- [x] **XBRS-05**: Core functionality identical across all browsers

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Activation

- **ACT-10**: User can configure custom keyboard shortcut
- **ACT-11**: User can activate via browser action context menu

### Enhanced Display

- **DISP-10**: User can enable automatic slideshow mode
- **DISP-11**: User can configure slideshow interval
- **DISP-12**: Fade transition between images in slideshow mode
- **DISP-13**: Ken Burns effect (pan/zoom animation) option
- **DISP-14**: Additional transition effects (scale, slide, pan)

### Enhanced Content

- **CONT-10**: Drag-and-drop image upload
- **CONT-11**: Image preview grid with thumbnails
- **CONT-12**: Multiple image collections/playlists
- **CONT-13**: Image metadata display (filename, upload date, size)
- **CONT-14**: Image filters/effects (brightness, blur, sepia)

### Advanced Features

- **ADV-01**: Multi-monitor support (display on all screens)
- **ADV-02**: Export/import settings and image collection
- **ADV-03**: Random vs sequential slideshow mode selection

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Auto-activation on idle timer | Conflicts with "instant activation" core value, adds complexity, users complain about unexpected activation |
| Mouse movement to deactivate | Too easy to accidentally dismiss, users want intentional control |
| Click anywhere to deactivate | Accidental dismissals, conflicts with intentional activation approach |
| Cloud photo sources (Google Photos, Unsplash) | API dependencies, rate limits, authentication complexity, conflicts with local-only privacy approach |
| Video backgrounds | Large file sizes, performance issues, battery drain, limited value over photos |
| Time/clock display overlay | Feature creep beyond screen saver purpose, users have other tools |
| Weather display overlay | Requires location permissions and external API, adds complexity |
| Scheduler (time-based activation) | Low usage rate, adds UI complexity, marginal value with manual activation |
| Interactive mode (clickable URLs) | Security risk, conflicts with display-only purpose |
| Unlimited file size uploads | Browser storage limitations, performance issues, impractical constraint |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACT-01 | Phase 1 | Complete |
| ACT-02 | Phase 1 | Complete |
| ACT-03 | Phase 1 | Complete |
| ACT-04 | Phase 1 | Complete |
| DISP-01 | Phase 4 | Pending |
| DISP-02 | Phase 4 | Pending |
| DISP-03 | Phase 4 | Pending |
| DISP-04 | Phase 4 | Pending |
| DISP-05 | Phase 4 | Pending |
| CONT-01 | Phase 2 | Complete |
| CONT-02 | Phase 2 | Complete |
| CONT-03 | Phase 2 | Complete |
| CONT-04 | Phase 2 | Complete |
| CONT-05 | Phase 2 | Complete |
| CONT-06 | Phase 2 | Complete |
| SET-01 | Phase 3 | Complete |
| SET-02 | Phase 3 | Complete |
| SET-03 | Phase 3 | Complete |
| SET-04 | Phase 3 | Complete |
| SET-05 | Phase 3 | Complete |
| XBRS-01 | Phase 1 | Complete |
| XBRS-02 | Phase 1 | Complete |
| XBRS-03 | Phase 1 | Complete |
| XBRS-04 | Phase 1 | Complete |
| XBRS-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25 (100% coverage)
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after Phase 2 completion*
