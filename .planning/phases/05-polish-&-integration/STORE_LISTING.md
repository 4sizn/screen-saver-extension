# Store Listing Materials - Screen Saver Extension

## Extension Metadata

**Name:** Screen Saver
**Short Name:** Screen Saver
**Version:** 1.0.0
**Category:**
- Chrome Web Store: Productivity
- Firefox Add-ons: Appearance
- Microsoft Edge: Productivity

## Short Description
(132 characters max for Chrome Web Store)

"Instant one-click screen saver with beautiful nature images and custom photo support."

Character count: 91/132

## Full Description

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

**How to Use:**
1. Click extension icon to activate screen saver
2. Press ESC or click icon again to deactivate
3. Right-click icon > Options to upload images and configure settings

**Keyboard Shortcuts:**
- ESC: Deactivate screen saver

## Privacy Policy URL

User needs to host PRIVACY_POLICY.md and provide URL.

Options:
- GitHub Pages: https://[username].github.io/[repo]/PRIVACY_POLICY.md
- GitHub raw: https://raw.githubusercontent.com/[username]/[repo]/master/.planning/phases/05-polish-&-integration/PRIVACY_POLICY.md
- Paste directly into store submission form (some stores allow this)

## Support/Contact

**GitHub Issues:** https://github.com/[username]/screen-saver-web/issues
**Email:** [Your contact email]
**Website:** [Optional - repository or landing page URL]

## Screenshots Needed

Browser stores require screenshots (capture these during manual testing):

1. **Screen saver active** (1280x800 or 640x400)
   - Full-screen overlay showing nature landscape image
   - Capture during activation to show typical user experience

2. **Options page - Image management** (1280x800)
   - Image list with thumbnails
   - Default image badges visible
   - Upload button prominent

3. **Options page - Settings panel** (1280x800)
   - Display settings (fit mode radio buttons)
   - Color picker with selected color
   - Settings section clearly visible

4. **Extension icon with badge** (optional but helpful)
   - Toolbar showing extension icon with green active badge
   - Can be cropped screenshot from browser toolbar

**Screenshot guidelines:**
- Chrome/Edge: 1280x800 or 640x400
- Firefox: 640x480 minimum, up to 5MB per image
- Use PNG format for clarity
- Show actual functionality, not mockups
- Include annotations if helpful (arrows, labels)

## Promotional Images (Optional)

Chrome Web Store allows promotional tiles for featured listings:
- Small tile: 440x280px
- Large tile: 1400x560px

Not required for initial submission. Can add later if extension gains traction.

## Store-Specific Submission Notes

### Chrome Web Store
- Account required: Google Developer account ($5 one-time fee)
- Package: Use .output/screen-saver-web-1.0.0-chrome.zip
- Review time: Typically 1-3 days
- Privacy policy: Must be publicly accessible URL
- Screenshots: 1-5 screenshots required

### Firefox Add-ons
- Account required: Free Firefox account
- Package: Use .output/screen-saver-web-1.0.0-firefox.zip
- Source code: Upload .output/screen-saver-web-1.0.0-sources.zip
- Build instructions: See SOURCE_CODE_REVIEW.md below
- Review time: Typically 1-7 days (longer due to source review)
- Privacy policy: Can paste directly or provide URL

### Microsoft Edge Add-ons
- Account required: Microsoft Partner Center account (free)
- Package: Use .output/screen-saver-web-1.0.0-edge.zip
- Review time: Typically 1-3 days
- Very similar to Chrome Web Store process

### Safari (Deferred)
- Requires macOS + Xcode + safari-web-extension-converter
- Requires Apple Developer account ($99/year)
- Consider for future release if demand exists

## Firefox Source Code Build Instructions

For Firefox reviewers, create SOURCE_CODE_REVIEW.md with these instructions:

---

# Build Instructions for Firefox Reviewers

## Requirements
- Node.js 18 or higher
- npm 9 or higher

## Build Steps

1. Extract source code ZIP

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build extension:
   ```bash
   npm run build
   ```

4. Output location:
   ```
   .output/firefox-mv2/
   ```

5. Verify manifest:
   ```bash
   cat .output/firefox-mv2/manifest.json
   ```

## Expected Output

The built extension should match the submitted firefox.zip functionally. The build process:
- Compiles TypeScript to JavaScript
- Bundles with Vite
- Generates manifest.json for Firefox (MV2)
- Copies images/defaults/ (15 nature landscape JPEGs)
- Copies icon assets

## Deterministic Build

Build should produce functionally identical output given same Node.js version. Differences may occur due to:
- Different Node.js versions (use Node 18+ LTS)
- Timestamp in generated files (acceptable variance)
- Vite bundling optimizations (functionally identical)

## Dependencies

All dependencies listed in package.json. No external build dependencies required beyond Node.js and npm.

## Questions

For build issues or questions, create an issue at: https://github.com/[username]/screen-saver-web/issues
