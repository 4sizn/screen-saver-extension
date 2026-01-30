# Chrome Extension Permissions Justification

## Tabs Permission

**Permission:** `tabs`

**Justification:**

The `tabs` permission is required to detect browser internal pages (chrome://, edge://, about:, etc.) where screen savers cannot be activated due to browser security restrictions.

**How it's used:**

1. When the user clicks the extension icon to activate the screen saver, we read the current tab's URL
2. We check if the URL is a restricted browser internal page
3. If it's restricted, we show a notification explaining that the screen saver cannot be used on that page
4. If it's a normal web page, we activate the screen saver

**Code reference:**
- File: `entrypoints/background.ts`
- Purpose: URL validation to prevent activation on restricted pages

**User benefit:**
- Prevents errors and confusion by proactively informing users when the screen saver cannot be activated
- Provides clear feedback about browser security restrictions
- Ensures the extension only operates on appropriate pages

**Privacy note:**
- We only read the URL to check the protocol (chrome://, edge://, etc.)
- We do NOT collect, store, or transmit any browsing data
- We do NOT track user behavior or browsing history
- The URL check happens locally and is never sent to any server
