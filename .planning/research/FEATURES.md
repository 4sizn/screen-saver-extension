# Feature Research

**Domain:** Browser Screen Saver Extensions
**Researched:** 2026-01-19
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full-screen overlay | Core screen saver functionality - covers entire screen to hide content and display images | LOW | Standard browser fullscreen API - straightforward implementation |
| Manual activation | Users expect instant activation without waiting for idle timer (via icon click, keyboard shortcut, or context menu) | LOW | Extension icon click is simplest; custom keyboard shortcut requires Chrome extension configuration |
| Image slideshow | Automatic rotation through multiple images - core screen saver experience | LOW | Simple timer-based image rotation with configurable interval |
| Exit on interaction | Deactivate immediately on mouse movement or keyboard input | LOW | Event listeners for mouse/keyboard - standard pattern |
| Basic transition effects | Fade or cross-dissolve between images - prevents jarring switches | MEDIUM | CSS transitions or canvas animations - fade is simple, advanced effects more complex |
| Default image collection | Pre-bundled images so extension works out-of-box without requiring user uploads | LOW | Ship with curated nature/landscape images - storage consideration for extension size |
| Custom image upload | Users expect to personalize with their own photos | MEDIUM | File upload + browser storage API (IndexedDB for large images) - 10MB per-file limit common |
| Image management UI | View, delete, and organize uploaded images | MEDIUM | Basic CRUD interface for stored images - essential for user control |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| One-click activation (icon only) | Simpler than competitors requiring keyboard shortcuts or idle wait - matches project's "instant activation" core value | LOW | Default behavior - just make it obvious and fast |
| Curated nature collection | High-quality default images reduce friction - users get value immediately without uploading | LOW | One-time curation effort, minimal technical complexity |
| Drag-and-drop upload | More intuitive than file picker - reduces friction for personalization | MEDIUM | Drag-and-drop API + visual feedback - better UX than standard file input |
| Image preview grid | Visual management instead of text list - easier to identify and manage photos | MEDIUM | Thumbnail generation + grid layout - better UX than competitors with unclear image lists |
| Local-only storage | Privacy-focused - no cloud sync means no data collection, no API limits, no subscriptions | LOW | IndexedDB storage - actually simpler than cloud integration, strong privacy message |
| Zero configuration | Works immediately with good defaults - no setup wizard, no account required | LOW | Thoughtful defaults eliminate setup friction - competitive advantage vs extensions requiring Google Photos auth |
| Lightweight & fast | Quick load, instant activation - no delays or loading spinners | MEDIUM | Performance optimization, lazy loading, efficient image handling |
| Multi-monitor support | Display on all screens, not just primary - addresses major user complaint with existing extensions | HIGH | Multiple fullscreen windows via Chrome windows API - technically complex, high user value |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-activation on idle timer | Traditional screen saver behavior - users expect it | Creates complexity (idle detection), conflicts with browser/OS screen savers, user complaints about unexpected activation, poor multi-monitor behavior in browser extensions | Manual activation only - simpler, more predictable, aligns with "instant activation" value. Users who want idle activation can use OS screen saver |
| Cloud photo sources (Google Photos, Flickr, Unsplash API) | Popular in competitor extensions - provides unlimited images | API rate limits (Google Photos limits albums/photos per day), requires OAuth authentication, privacy concerns, dependency on external services, subscription pressure | Curated default collection + unlimited local uploads - no API limits, no auth, privacy-friendly, simpler architecture |
| Video screen savers | Some extensions offer video backgrounds - seems more dynamic | Large file sizes (extension size limits), performance issues, battery drain, storage complexity, limited user value over photos | High-quality photos with Ken Burns effect (pan/zoom) provides motion without video overhead |
| Scheduler (time-based activation/deactivation) | Power users want "only show screensaver 9am-5pm" control | Adds UI complexity, low usage rate, marginal value when activation is instant manual | Keep manual activation simple - users control when it runs by clicking icon |
| Weather and clock overlays | Competitor features - shows current time/weather on screen saver | Scope creep beyond screen saver purpose, requires location permissions and weather API, clutters the image display | Stay focused on image display - users have other tools for weather/time |
| Interactive mode / click-through URLs | Some extensions allow clicking images to open webpages | Security risk (malicious URLs), complexity, conflicts with "exit on interaction" expectation | Display-only screen saver - clean separation of concerns |
| Unlimited file size uploads | Users want to upload high-res photos without limits | Browser storage limitations, performance issues with large images, slow loading | 10MB per-file limit (industry standard) with guidance to resize images - practical constraint with clear communication |

## Feature Dependencies

```
[Full-screen overlay]
    └──requires──> [Exit on interaction]

[Image slideshow]
    └──requires──> [Default image collection OR Custom image upload]
    └──requires──> [Basic transition effects]

[Custom image upload]
    └──requires──> [Image management UI]

[Drag-and-drop upload] ──enhances──> [Custom image upload]

[Image preview grid] ──enhances──> [Image management UI]

[Multi-monitor support] ──enhances──> [Full-screen overlay]

[Auto-activation on idle] ──conflicts──> [Manual activation focus]
[Cloud photo sources] ──conflicts──> [Local-only storage]
```

### Dependency Notes

- **Image slideshow requires Default images OR Custom uploads:** Extension must work out-of-box, so default collection is critical for initial experience. Custom uploads extend but don't replace defaults.
- **Custom upload requires Management UI:** Users must be able to see and delete uploaded images - upload without management creates a bad experience.
- **Drag-and-drop enhances Custom upload:** Drag-and-drop can be added after basic file picker upload is working - better UX but not essential.
- **Multi-monitor enhances Full-screen:** Single monitor works fine for v1, multi-monitor addresses power user complaints but adds significant complexity.
- **Auto-activation conflicts with Manual focus:** Supporting both creates confusion and complexity - pick manual activation as the core model.
- **Cloud sources conflict with Local-only:** These are incompatible architectures - local-only is simpler and more private, stick with it.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] Full-screen overlay with exit on mouse/keyboard — Core functionality, must work perfectly
- [x] Icon-click activation — Delivers "instant activation" core value
- [x] Image slideshow with configurable interval — Basic screen saver behavior
- [x] Fade transition between images — Prevents jarring switches, simple to implement
- [x] Default nature image collection (10-20 images) — Works out-of-box without uploads
- [x] Custom image upload via file picker — Personalization capability
- [x] Image management UI (list view with delete) — Essential for upload feature
- [x] Settings page (slideshow interval, transition speed) — Basic customization without overwhelming

### Add After Validation (v1.x)

Features to add once core is working and users validate the concept.

- [ ] Drag-and-drop image upload — Add when users request better upload UX
- [ ] Image preview grid (thumbnails) — Add when users complain about text-only list
- [ ] Additional transition effects (scale, pan) — Add when users request variety
- [ ] Ken Burns effect (pan/zoom animation) — Add when users want more dynamic displays
- [ ] Keyboard shortcut configuration — Add when users request it (Chrome extension settings support)
- [ ] Random vs sequential slideshow mode — Add when users want more control
- [ ] Image metadata (upload date, file name display) — Add if users want organization features

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Multi-monitor support — High value but high complexity - wait for demand signal
- [ ] Multiple image collections/playlists — Wait to see if users want organizational complexity
- [ ] Image filters/effects (brightness, blur, sepia) — Defer until core experience is proven
- [ ] Export/import settings and images — Wait for power users to request backup/sharing
- [ ] Browser-specific optimizations (Firefox, Edge) — Focus on Chrome first, expand after validation
- [ ] Touch screen support (mobile browsers) — Low priority - screen savers are desktop use case

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Full-screen overlay + exit | HIGH | LOW | P1 |
| Icon-click activation | HIGH | LOW | P1 |
| Image slideshow | HIGH | LOW | P1 |
| Fade transition | HIGH | LOW | P1 |
| Default image collection | HIGH | LOW | P1 |
| Custom image upload (file picker) | HIGH | MEDIUM | P1 |
| Image management (list + delete) | HIGH | MEDIUM | P1 |
| Basic settings page | MEDIUM | LOW | P1 |
| Drag-and-drop upload | MEDIUM | MEDIUM | P2 |
| Image preview grid | MEDIUM | MEDIUM | P2 |
| Additional transitions | MEDIUM | MEDIUM | P2 |
| Ken Burns effect | MEDIUM | HIGH | P2 |
| Keyboard shortcut | MEDIUM | LOW | P2 |
| Random slideshow mode | LOW | LOW | P2 |
| Multi-monitor support | HIGH | HIGH | P3 |
| Image collections/playlists | MEDIUM | HIGH | P3 |
| Image filters/effects | LOW | MEDIUM | P3 |
| Export/import | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have, add when possible (Post-launch iteration)
- P3: Nice to have, future consideration (Wait for validation)

## Competitor Feature Analysis

| Feature | Photo Screen Saver (opus1269) | Screensaver (Pothos) | Our Approach |
|---------|--------------|--------------|--------------|
| Photo Sources | Google Photos, Chromecast, Reddit, Flickr, Unsplash | Pre-built scenes, URL screen saver, local photos (10MB limit) | Default curated collection + unlimited local uploads (10MB per file) - no API dependencies |
| Activation | Idle timer + keyboard shortcut | Idle timer + periodic key activation | Icon click (instant) + optional keyboard shortcut - simpler, more predictable |
| Customization | Ken Burns effect, weather, clock, scheduler, multiple display modes | Scene selection, URL input, photo upload | Focused on image display - slideshow interval, transitions, no feature creep |
| Authentication | Google account required for Google Photos | Periodic activation key required | Zero auth - works immediately |
| Multi-monitor | Supported | Single screen only (major complaint) | Single screen v1, multi-monitor v2+ (complexity vs demand) |
| Storage | Cloud (Google Photos API limits) | Mixed (scenes bundled, photos local 10MB limit) | Fully local (IndexedDB) - privacy-focused, no API limits |
| Transitions | Fade, scale, Ken Burns | Video, programmatic animations | Start simple (fade), add more (scale, Ken Burns) in v1.x |
| Management | Album selection, photo limit quotas | Scene selection, URL management | Visual grid, simple delete, no quotas - straightforward UX |

## Sources

**Competitor Research:**
- [Screensaver Chrome Extension](https://chromewebstore.google.com/detail/screensaver/naejhikacbhadlehaeombhofjnpcbejj?hl=en) - Popular extension with scene-based approach
- [Photo Screen Saver GitHub](https://github.com/opus1269/screensaver) - Open-source extension with multiple photo sources
- [Photo Screen Saver Documentation](https://opus1269.github.io/screensaver/faq.html) - Feature documentation and FAQ
- [Chrome Extension Stats - Screensaver](https://chrome-stats.com/d/naejhikacbhadlehaeombhofjnpcbejj) - User feedback and common complaints

**Feature Analysis:**
- [Browser Extension Screen Saver Features 2026](https://screensaver.en.softonic.com/chrome/extension) - Feature overview
- [New Tab Extensions with Weather/Clock 2025](https://newtabwidgets.com/blog/best-new-tab-extensions-2025) - Related extension features
- [Ken Burns Effect Screen Savers](https://www.gphotoshow.com/gphotoshow-pro/photo-slide-show-screen-saver.html) - Animation features

**User Complaints & Issues:**
- [Chromebook Multi-Monitor Discussion](https://support.google.com/chromebook/thread/75266569/how-do-i-get-a-screensaver-on-my-extended-display) - Multi-monitor limitations
- Web search findings: Major recurring complaints are poor multi-monitor behavior and unclear activation methods

**Technical Constraints:**
- 10MB per-file limit is industry standard for browser extensions
- IndexedDB for local storage
- Chrome Fullscreen API for overlay
- Chrome Windows API for multi-monitor (complex)

---
*Feature research for: Browser Screen Saver Extensions*
*Researched: 2026-01-19*
*Research confidence: MEDIUM - based on web search of existing extensions, competitor analysis, and user feedback. Context7 not available for this domain. Verified with multiple sources including GitHub repos, Chrome Web Store listings, and user community discussions.*
