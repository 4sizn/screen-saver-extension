---
created: 2026-01-20T11:30
title: Add missing default image nature-16 to DEFAULT_IMAGES array
area: general
files:
  - lib/defaultImages.ts:6-22
  - public/images/defaults/nature-16.jpg
---

## Problem

The file `public/images/defaults/nature-16.jpg` exists in the public directory but is not included in the `DEFAULT_IMAGES` array in `lib/defaultImages.ts`. The array only references nature-01 through nature-15 (15 images), but nature-16.jpg is present and should be loaded as a default image.

This means users won't see nature-16.jpg as one of the default screen saver images even though the file is bundled with the extension.

## Solution

Add `'images/defaults/nature-16.jpg'` to the `DEFAULT_IMAGES` array in `lib/defaultImages.ts`.

Update the comment from "15 high-quality nature landscape images" to "16 high-quality nature landscape images".
