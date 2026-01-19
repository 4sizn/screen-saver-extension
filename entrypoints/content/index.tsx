import './style.css';
import ReactDOM from 'react-dom/client';
import ScreenSaverOverlay from './ScreenSaverOverlay';
import { browser } from 'wxt/browser';
import type { Message } from '@/lib/messages';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
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

    // Preload audio for better performance and to avoid loading delays
    const audioUrl = browser.runtime.getURL('/sounds/click.wav');
    console.log('[Screen Saver] Audio URL:', audioUrl);

    const audio = new Audio(audioUrl);
    audio.volume = 0.5;
    audio.preload = 'auto';

    // Preload the audio file
    audio.load();

    audio.addEventListener('error', (e) => {
      console.error('[Screen Saver] Audio load error:', e);
      console.error('[Screen Saver] Audio error code:', audio.error?.code);
      console.error('[Screen Saver] Audio error message:', audio.error?.message);
    });

    audio.addEventListener('canplaythrough', () => {
      console.log('[Screen Saver] Audio loaded successfully');
    });

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message: Message) => {
      if (message.type === 'ACTIVATE') {
        ui.mount();

        // Play activation sound (works in content script, not in service worker)
        console.log('[Screen Saver] Attempting to play sound...');
        audio.currentTime = 0; // Reset to start
        audio.play()
          .then(() => {
            console.log('[Screen Saver] Sound played successfully');
          })
          .catch(err => {
            console.error('[Screen Saver] Could not play sound:', err);
            console.error('[Screen Saver] Error name:', err.name);
            console.error('[Screen Saver] Error message:', err.message);
          });
      } else if (message.type === 'DEACTIVATE') {
        ui.remove();
      }
    });
  },
});
