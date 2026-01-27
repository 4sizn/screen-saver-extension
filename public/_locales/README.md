# Internationalization (i18n)

This extension supports multiple languages using Chrome's built-in i18n API.

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| 한국어 (Korean) | `ko` | ✅ Default |
| English | `en` | ✅ |
| 日本語 (Japanese) | `ja` | ✅ |
| Deutsch (German) | `de` | ✅ |

## Adding a New Language

1. Create a new directory under `_locales/` with the language code:
   ```bash
   mkdir public/_locales/<language-code>
   ```

2. Copy an existing `messages.json` file:
   ```bash
   cp public/_locales/en/messages.json public/_locales/<language-code>/
   ```

3. Translate all message values in the new file

4. Rebuild the extension:
   ```bash
   npm run build
   ```

## Message Keys

| Key | Description |
|-----|-------------|
| `extName` | Extension name |
| `extDescription` | Extension description |
| `actionTitle` | Action button tooltip |
| `notificationRestrictedTitle` | Restricted page notification title |
| `notificationRestrictedMessage` | Restricted page notification message |
| `notificationActivatedTitle` | Activation notification title |
| `notificationActivatedMessage` | Activation notification message |
| `iconTitleRestricted` | Icon tooltip for restricted pages |
| `iconTitleNormal` | Icon tooltip for normal pages |
| `loadingText` | Loading indicator text |
| `errorTitle` | Error message title |
| `errorMessage` | Error message content |

## Usage in Code

### Background Script
```typescript
const title = browser.i18n.getMessage('notificationActivatedTitle');
```

### React Component
```typescript
import { browser } from 'wxt/browser';

<p>{browser.i18n.getMessage('loadingText')}</p>
```

### Manifest
```json
{
  "name": "__MSG_extName__",
  "description": "__MSG_extDescription__"
}
```

## Testing

1. Install the extension in Chrome
2. Go to Chrome Settings → Languages
3. Change your browser language
4. Reload the extension
5. Verify the translations appear correctly
