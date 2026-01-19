# Screen Saver Browser Extension

## What This Is

A cross-browser screen saver extension that activates with a single click on the extension icon. When activated, it displays a full-screen overlay showing random images from a collection of default nature photos and user-uploaded images. Users can deactivate it by clicking the icon again or pressing ESC.

## Core Value

Instant, one-click screen saver activation in any browser tab, combining beautiful default imagery with personal customization.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Extension icon click toggles screen saver on/off
- [ ] Full-screen overlay displays when screen saver is active
- [ ] Default nature landscape images are provided
- [ ] Users can upload their own images from local storage
- [ ] Random image selection from combined default and user images
- [ ] ESC key deactivates the screen saver
- [ ] Settings page for uploading images
- [ ] Image management (delete, reorder uploaded images)
- [ ] Cross-browser compatibility (Chrome, Safari, Edge, Firefox)

### Out of Scope

- Image transition effects (fade in/out animations) — v2 feature
- Clock/time display on screen saver — v2 feature
- Mouse movement detection to deactivate — keep it simple, ESC and icon only
- Click anywhere to deactivate — avoid accidental dismissals
- Automatic slideshow with timed transitions — random single image is simpler

## Context

This is a public product intended for distribution across multiple browser extension stores. Users will install it for privacy protection during work breaks, personal aesthetic enjoyment, or to display calming imagery during focus sessions.

The product needs to work seamlessly across different browser extension APIs (Chrome Extensions Manifest V3, Safari Web Extensions, Firefox WebExtensions) while maintaining a consistent user experience.

## Constraints

- **Tech Stack**: TypeScript, React, Shadcn — modern, type-safe development with consistent UI components
- **Cross-Browser**: Must support Chrome, Safari, Edge, and Firefox — requires WebExtension API compatibility layer or browser-specific builds
- **Local Storage**: User images stored locally in browser storage — no backend/cloud storage in v1
- **Performance**: Full-screen image rendering must be smooth — optimize image loading and display

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full-screen overlay in current tab | Simplest implementation, no new window/tab management | — Pending |
| Random image display | Keeps experience fresh without complex slideshow logic | — Pending |
| Icon + ESC only for deactivation | Prevents accidental dismissals, clear user intent required | — Pending |
| TypeScript + React + Shadcn | Type safety, component reusability, consistent UI | — Pending |
| WebExtension API | Cross-browser compatibility with single codebase | — Pending |

---
*Last updated: 2026-01-19 after initialization*
