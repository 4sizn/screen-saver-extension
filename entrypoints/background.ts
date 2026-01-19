import { browser } from 'wxt/browser';
import type { Message } from '@/lib/messages';
import { getActivationState, setActivationState, clearTabState } from '@/lib/storage';

export default defineBackground({
  type: 'module',

  main() {
    // Message listener for content script requests (e.g., ESC key deactivation)
    browser.runtime.onMessage.addListener(async (message: Message, sender) => {
      if (message.type === 'DEACTIVATE' && sender.tab?.id) {
        const tabId = sender.tab.id;

        // Deactivate - silent (no notification, no sound)
        setActivationState(tabId, false);

        // Update badge to gray (inactive)
        await browser.action.setBadgeBackgroundColor({
          color: '#6B7280',
          tabId: tabId
        });

        // Send deactivate message to content script to remove overlay
        try {
          await browser.tabs.sendMessage(tabId, { type: 'DEACTIVATE' } as Message);
        } catch (error) {
          console.log('Could not send deactivate message:', error);
        }
      }
    });

    // Icon click handler - registered at top level (not in async function)
    browser.action.onClicked.addListener(async (tab) => {
      if (!tab.id) return;

      const isActive = getActivationState(tab.id);

      if (isActive) {
        // Deactivate - silent (no notification, no sound)
        setActivationState(tab.id, false);

        // Update badge to gray (inactive)
        await browser.action.setBadgeBackgroundColor({
          color: '#6B7280',
          tabId: tab.id
        });

        // Send deactivate message to content script
        try {
          await browser.tabs.sendMessage(tab.id, { type: 'DEACTIVATE' } as Message);
        } catch (error) {
          // Content script may not be injected yet - ignore error
          console.log('Could not send deactivate message:', error);
        }

      } else {
        // Activate - loud feedback (notification + sound)
        setActivationState(tab.id, true);

        // Update badge to green (active)
        await browser.action.setBadgeBackgroundColor({
          color: '#22C55E',
          tabId: tab.id
        });
        await browser.action.setBadgeText({
          text: ' ',
          tabId: tab.id
        });

        // Send activate message to content script
        try {
          await browser.tabs.sendMessage(tab.id, { type: 'ACTIVATE' } as Message);
        } catch (error) {
          // Content script may not be injected yet - ignore error
          console.log('Could not send activate message:', error);
        }

        // Show notification (Korean text per requirements)
        await browser.notifications.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('/icon/48.png'),
          title: '스크린세이버 활성화',
          message: 'ESC 키를 눌러 종료하세요.',
        });

        // Note: Sound is played by content script (Audio API doesn't work in service workers)
      }
    });

    // Tab cleanup - registered at top level
    browser.tabs.onRemoved.addListener((tabId) => {
      clearTabState(tabId);
    });

    // Initialize badge on startup - set gray badge with space for all tabs
    browser.tabs.query({}).then(tabs => {
      tabs.forEach(tab => {
        if (tab.id) {
          browser.action.setBadgeBackgroundColor({
            color: '#6B7280',
            tabId: tab.id
          });
          browser.action.setBadgeText({
            text: ' ',
            tabId: tab.id
          });
        }
      });
    });
  },
});
