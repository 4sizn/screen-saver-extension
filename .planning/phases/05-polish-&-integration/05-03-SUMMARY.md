---
phase: 05-polish-&-integration
plan: 03
subsystem: distribution
tags: [wxt, chrome-web-store, firefox-add-ons, edge-add-ons, store-submission, packaging, privacy-policy]

# Dependency graph
requires:
  - phase: 05-01
    provides: High-quality Unsplash default images
  - phase: 05-02
    provides: Production build verification
provides:
  - Browser-specific distribution packages (Chrome, Firefox, Edge)
  - Firefox source code ZIP for reviewer rebuild
  - Privacy policy document for store submissions
  - Store listing materials with descriptions and metadata
  - Verified buildable source code for Firefox review
affects: [manual-store-submission, future-updates, safari-distribution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WXT zip command for browser-specific builds"
    - "Firefox source code submission with build instructions"
    - "Privacy-first documentation (local-only storage, no tracking)"

key-files:
  created:
    - ".output/screen-saver-web-1.0.0-chrome.zip"
    - ".output/screen-saver-web-1.0.0-firefox.zip"
    - ".output/screen-saver-web-1.0.0-edge.zip"
    - ".output/screen-saver-web-1.0.0-sources.zip"
    - ".planning/phases/05-polish-&-integration/PRIVACY_POLICY.md"
    - ".planning/phases/05-polish-&-integration/STORE_LISTING.md"
  modified: []

key-decisions:
  - "Firefox sources ZIP verified buildable - extracted, npm install, npm run build produces functional extension"
  - "Privacy policy emphasizes local-only storage with no data collection or tracking"
  - "Safari distribution deferred - requires macOS tooling and $99/year Apple Developer account"
  - "Store listing includes Firefox source code build instructions for reviewers"

patterns-established:
  - "Browser-specific packaging: wxt zip -b [browser] for each store"
  - "Privacy policy hosting: user needs to host PRIVACY_POLICY.md or paste into store forms"
  - "Screenshot requirements: 4 types covering activation, image management, settings, badge state"

# Metrics
duration: 10min
completed: 2026-01-19
---

# Phase 5 Plan 3: Distribution Preparation Summary

**Browser-specific ZIP packages for Chrome/Firefox/Edge with privacy policy and store listing documentation ready for manual submission**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-19T13:56:36Z
- **Completed:** 2026-01-19T14:07:27Z
- **Tasks:** 3
- **Files modified:** 2 documentation files created

## Accomplishments
- Generated 4 browser-specific distribution packages (6.5-6.6MB each with 15 default images)
- Created privacy policy emphasizing local-only storage with no data collection
- Documented comprehensive store listing materials with submission guidance for all three stores
- Verified Firefox source code builds successfully from sources ZIP (passed rebuild test)

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate browser-specific ZIP packages** - No git commit (build artifacts in .gitignored .output/)
   - `screen-saver-web-1.0.0-chrome.zip` (6.6MB) - Chrome Web Store package
   - `screen-saver-web-1.0.0-firefox.zip` (6.6MB) - Firefox Add-ons package
   - `screen-saver-web-1.0.0-edge.zip` (6.6MB) - Microsoft Edge Add-ons package
   - `screen-saver-web-1.0.0-sources.zip` (6.5MB) - Firefox source code for reviewers

2. **Task 2: Create privacy policy document** - `49d4c1b` (docs)
   - Privacy policy with local-only storage guarantee
   - No data collection, tracking, or third-party services
   - Permissions explained (storage, unlimitedStorage, notifications, activeTab)

3. **Task 3: Create store listing materials** - `dfcefa0` (docs)
   - Short description (91/132 characters)
   - Full description with features, perfect-for use cases, privacy statement
   - Screenshot requirements (4 types)
   - Store-specific submission notes (Chrome, Firefox, Edge)
   - Firefox source code build instructions for reviewers

## Files Created/Modified

**ZIP Packages (not committed - build artifacts):**
- `.output/screen-saver-web-1.0.0-chrome.zip` - Chrome Web Store submission package (MV3)
- `.output/screen-saver-web-1.0.0-firefox.zip` - Firefox Add-ons submission package (MV2)
- `.output/screen-saver-web-1.0.0-edge.zip` - Microsoft Edge Add-ons submission package (MV3)
- `.output/screen-saver-web-1.0.0-sources.zip` - Firefox source code for reviewer rebuild

**Documentation (committed):**
- `.planning/phases/05-polish-&-integration/PRIVACY_POLICY.md` - Privacy policy for store submissions
- `.planning/phases/05-polish-&-integration/STORE_LISTING.md` - Store listing materials and submission guidance

## Decisions Made

**Firefox source buildability verified:**
- Extracted sources ZIP, ran `npm install && npm run build`
- Build succeeded, produced extension with manifest.json and 15 default images
- Confirms Firefox reviewers can rebuild extension from submitted source code

**Privacy policy approach:**
- Emphasizes local-only storage (IndexedDB for images, chrome.storage for settings)
- Explicitly states no data collection, tracking, analytics, or third-party services
- Explains all four permissions with rationale
- User needs to host document or paste into store forms

**Safari distribution deferred:**
- Requires macOS + Xcode + safari-web-extension-converter
- Requires Apple Developer account ($99/year)
- Documented in STORE_LISTING.md for future consideration if demand exists

**Screenshot requirements documented:**
- 4 types: Screen saver active, image management, settings panel, badge state
- Guidelines for each store (Chrome/Edge: 1280x800 or 640x400, Firefox: 640x480 minimum)
- To be captured during next manual testing phase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all build commands succeeded, sources ZIP builds correctly, documentation completed as specified.

## Verification Results

**Package integrity:**
- All 4 ZIP packages created with appropriate sizes
- Chrome: 6.6MB (MV3 with 15 default images)
- Firefox: 6.6MB (MV2 with 15 default images)
- Edge: 6.6MB (MV3 with 15 default images)
- Sources: 6.5MB (source code without node_modules or build artifacts)
- All packages pass `unzip -t` integrity checks

**Package contents verified:**
- Chrome package contains: manifest.json, background.js, 15 images/defaults/*.jpg
- Firefox sources contains: package.json, entrypoints/, wxt.config.ts, lib/
- Sources ZIP correctly excludes node_modules (0 matches)
- All 15 default nature landscape images present in each package

**Source code rebuild test:**
- Extracted sources ZIP to temporary directory
- Ran `npm install` - succeeded
- Ran `npm run build` - succeeded in 2.5 seconds
- Output contains manifest.json and 15 default images
- Confirms Firefox reviewers can rebuild extension

**Documentation completeness:**
- Privacy policy contains "does not collect", "local", "IndexedDB", "no tracking"
- Store listing contains short description (91/132 chars), full description, screenshots section, privacy section
- Firefox build instructions included in STORE_LISTING.md

## User Setup Required

**Before store submission, user must:**

1. **Host privacy policy:**
   - Option A: GitHub Pages (https://[username].github.io/[repo]/PRIVACY_POLICY.md)
   - Option B: GitHub raw URL (https://raw.githubusercontent.com/[username]/[repo]/master/...)
   - Option C: Paste directly into store submission form (some stores allow this)

2. **Update placeholders in STORE_LISTING.md:**
   - Replace `[username]` with GitHub username
   - Replace `[Your contact email]` with actual email
   - Add repository URL if applicable

3. **Capture screenshots:**
   - Screen saver active with nature image
   - Options page showing image management
   - Settings panel with fit mode and color picker
   - Extension icon with active badge (optional)
   - Guidelines: PNG format, 1280x800 or 640x400 for Chrome/Edge, 640x480+ for Firefox

4. **Create store accounts:**
   - Chrome Web Store: Google Developer account ($5 one-time fee)
   - Firefox Add-ons: Free Firefox account
   - Microsoft Edge Add-ons: Free Microsoft Partner Center account

## Next Phase Readiness

**Ready for manual store submission:**
- All browser-specific packages generated and verified
- Privacy policy document created
- Store listing materials documented
- Firefox source code verified buildable

**Remaining before submission:**
- User must host privacy policy URL
- User must capture screenshots during manual testing
- User must create store developer accounts
- User must perform final manual submission to each store

**Safari distribution:**
- Deferred to future release if demand exists
- Requires macOS environment and Apple Developer account ($99/year)

---
*Phase: 05-polish-&-integration*
*Completed: 2026-01-19*
