# Phase 4: Display & Slideshow - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Full-screen image overlay display that consumes settings from Phase 3 (fit mode, background color, per-image enabled state). When activated, screen saver renders a randomly selected image in full-screen overlay with proper styling based on user configuration. Static display (no automatic transitions).

</domain>

<decisions>
## Implementation Decisions

### Error Handling

**No enabled images scenario:**
- Default images (isDefault=true) are ALWAYS enabled and cannot be disabled
- If user somehow has zero enabled images, display built-in default images
- Log error to options page (not overlay, not browser notification)
- Options page should show warning/error state

**Image load failure:**
- If selected image fails to load, fall back to built-in default image
- Display error message in options page only (not in overlay)
- No browser notifications for image errors
- Overlay shows fallback image seamlessly (user doesn't see error on screen)

**Default image protection:**
- Built-in default images (isDefault=true) cannot be disabled via UI
- Ensures there's always at least one image available
- If all custom images disabled, defaults are guaranteed available

**Error logging location:**
- All errors logged to options page only
- No error messages in overlay (maintains clean visual experience)
- No browser notifications for image-related errors
- Options page displays error state/warnings for user awareness

### Claude's Discretion

- Image selection randomization algorithm (simple random, weighted, etc.)
- Overlay appearance timing (instant vs fade-in animation)
- Loading state handling while image loads
- Fallback image selection logic (which default to show on error)
- CSS implementation details for object-fit and background-color
- Image preloading strategy
- Memory cleanup for blob URLs

</decisions>

<specifics>
## Specific Ideas

- Default images must always remain enabled (UI enforcement + backend validation)
- Error states should not interrupt the visual experience (silent fallback in overlay)
- Error visibility should be in options page where user can take action

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-display-&-slideshow*
*Context gathered: 2026-01-19*
