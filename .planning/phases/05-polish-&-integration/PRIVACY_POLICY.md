# Privacy Policy - Screen Saver Browser Extension

**Effective Date:** 2026-01-19
**Last Updated:** 2026-01-19

## Data Collection

Screen Saver extension **does not collect, store, or transmit any personal data**.

## Local Storage Only

All data is stored locally on your device using browser storage APIs:
- **Images**: Custom uploaded images are stored in IndexedDB in your browser
- **Settings**: Display preferences (fit mode, background color, image enable/disable) stored in chrome.storage.sync
- **No Server Communication**: Extension does not send any data to external servers
- **No Analytics**: No usage tracking, analytics, or telemetry of any kind

## Permissions Explained

The extension requests the following permissions:

- **storage**: Store custom images locally in IndexedDB
- **unlimitedStorage**: Prevent browser from evicting your image collection due to quota limits
- **notifications**: Show activation notification when screen saver starts
- **activeTab**: Display screen saver overlay in the current browser tab

## Third-Party Services

This extension does not use any third-party services, APIs, or analytics platforms.

## Data Sharing

No data is shared with third parties. All images and settings remain on your local device.

## Changes to Privacy Policy

If privacy practices change, this policy will be updated with a new "Last Updated" date.

## Contact

For questions about this privacy policy, create an issue at: https://github.com/[username]/screen-saver-web/issues

---

**Summary:** Screen Saver is a local-only extension. Your images never leave your device. No tracking. No data collection. Full privacy.
