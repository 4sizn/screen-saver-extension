import './style.css';
import ReactDOM from 'react-dom/client';
import ScreenSaverOverlay from './ScreenSaverOverlay';
import { browser } from 'wxt/browser';
import type { Message } from '@/lib/messages';
import { hotkeySettings } from '@/lib/settingsStorage';

/**
 * Convert keyboard event to standardized hotkey string
 */
function eventToHotkeyString(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) {
    parts.push(event.ctrlKey ? 'Ctrl' : 'Meta');
  }
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  // Get the key name (capitalize first letter for consistency)
  let key = event.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();

  // Don't add modifier keys as the main key
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Track screen saver active state
    let isActive = false;

    // Create Shadow DOM UI
    const ui = await createShadowRootUi(ctx, {
      name: 'screen-saver-overlay',
      position: 'overlay',
      anchor: 'body',

      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(<ScreenSaverOverlay />);
        return root;
      },

      onRemove: (root) => {
        root?.unmount();
      },
    });

    // Load hotkey settings
    const loadedHotkeySettings = await hotkeySettings.getValue();

    // Global hotkey handler
    const handleGlobalKeyDown = async (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const pressedKey = eventToHotkeyString(event);
      const settings = await hotkeySettings.getValue();

      // Check activate hotkey
      if (settings.activateKey && pressedKey === settings.activateKey && !isActive) {
        event.preventDefault();
        event.stopPropagation();

        // Send activate message to background
        browser.runtime.sendMessage({ type: 'ACTIVATE' } as Message);
        isActive = true;
        ui.mount();
      }

      // Check deactivate hotkey
      if (settings.deactivateKey && pressedKey === settings.deactivateKey && isActive) {
        event.preventDefault();
        event.stopPropagation();

        // Send deactivate message to background
        browser.runtime.sendMessage({ type: 'DEACTIVATE' } as Message);
        isActive = false;
        ui.remove();
      }
    };

    // Register global hotkey listener
    window.addEventListener('keydown', handleGlobalKeyDown, true);

    // Note: Audio removed due to browser autoplay policy violations.
    // Browser autoplay policies block audio playback without user interaction,
    // and extension icon click is not sufficient interaction for content script context.
    // Visual overlay + notification provide sufficient activation feedback.

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message: Message) => {
      if (message.type === 'ACTIVATE') {
        // Mount visual overlay (primary activation feedback)
        isActive = true;
        ui.mount();
        // Notification feedback is handled by background script
      } else if (message.type === 'DEACTIVATE') {
        isActive = false;
        ui.remove();
      }
    });
  },
});
