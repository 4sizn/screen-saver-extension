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

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message: Message) => {
      if (message.type === 'ACTIVATE') {
        ui.mount();
      } else if (message.type === 'DEACTIVATE') {
        ui.remove();
      }
    });
  },
});
