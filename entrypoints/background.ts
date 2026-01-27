import { browser } from 'wxt/browser';
import type { Message, GetRandomImageResponse } from '@/lib/messages';
import { getActivationState, setActivationState, clearTabState } from '@/lib/storage';
import { loadDefaultImages } from '@/lib/defaultImages';
import { getAllImages } from '@/lib/imageStorage';

/**
 * Check if URL is a restricted page where content scripts cannot run
 */
function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;

  const restrictedProtocols = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
  ];

  const restrictedDomains = [
    'chrome.google.com/webstore',
    'microsoftedge.microsoft.com/addons',
  ];

  // Check protocols
  if (restrictedProtocols.some(protocol => url.startsWith(protocol))) {
    return true;
  }

  // Check domains
  if (restrictedDomains.some(domain => url.includes(domain))) {
    return true;
  }

  return false;
}

/**
 * Update icon state based on URL restrictions
 */
async function updateIconState(tabId: number, url?: string) {
  if (isRestrictedUrl(url)) {
    // Disable icon for restricted pages
    await browser.action.setIcon({
      tabId,
      path: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      }
    });
    await browser.action.setBadgeBackgroundColor({
      color: '#9CA3AF',
      tabId
    });
    await browser.action.setBadgeText({
      text: '✕',
      tabId
    });
    await browser.action.setTitle({
      title: '스크린세이버 사용 불가 (브라우저 내부 페이지)',
      tabId
    });
  } else {
    // Enable icon for normal pages
    const isActive = getActivationState(tabId);
    await browser.action.setIcon({
      tabId,
      path: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      }
    });
    await browser.action.setBadgeBackgroundColor({
      color: isActive ? '#22C55E' : '#6B7280',
      tabId
    });
    await browser.action.setBadgeText({
      text: ' ',
      tabId
    });
    await browser.action.setTitle({
      title: 'Toggle Screen Saver',
      tabId
    });
  }
}

/**
 * Select a random image and convert to base64 data URL for content script
 */
async function handleGetRandomImage(): Promise<GetRandomImageResponse> {
  try {
    console.log('[handleGetRandomImage] Fetching all images from IndexedDB');
    const allImages = await getAllImages();
    console.log('[handleGetRandomImage] Total images:', allImages.length);

    // PRIORITY SYSTEM: Custom images take precedence over defaults
    // 1. Try custom enabled images first (user uploads)
    let enabledImages = allImages.filter(img => !img.isDefault && img.isEnabled);
    console.log('[handleGetRandomImage] Enabled custom images:', enabledImages.length);

    // 2. Fallback to enabled default images only if no custom images
    if (enabledImages.length === 0) {
      enabledImages = allImages.filter(img => img.isDefault && img.isEnabled);
      console.log('[handleGetRandomImage] Using enabled default images fallback:', enabledImages.length);
    }

    // 3. Last resort: use all default images (even if disabled)
    if (enabledImages.length === 0) {
      enabledImages = allImages.filter(img => img.isDefault);
      console.log('[handleGetRandomImage] Using all default images (last resort):', enabledImages.length);
    }

    // No images available
    if (enabledImages.length === 0) {
      console.error('[handleGetRandomImage] No images available in database');
      return {
        success: false,
        error: 'No images available in database',
      };
    }

    // Select random image
    const randomImage = enabledImages[Math.floor(Math.random() * enabledImages.length)];
    console.log('[handleGetRandomImage] Selected image:', randomImage.name, randomImage.id);

    // Convert Blob to base64 data URL
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(randomImage.blob);
    });

    console.log('[handleGetRandomImage] Converted to data URL, length:', dataUrl.length);

    return {
      success: true,
      dataUrl,
    };
  } catch (error) {
    console.error('[handleGetRandomImage] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default defineBackground({
  type: 'module',

  main() {
    // Message listener for content script requests
    browser.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
      // Handle GET_RANDOM_IMAGE request from content script
      if (message.type === 'GET_RANDOM_IMAGE') {
        // Use sendResponse callback for async response
        handleGetRandomImage().then(sendResponse).catch(error => {
          console.error('[onMessage] Error handling GET_RANDOM_IMAGE:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
        return true; // Indicates async response via sendResponse
      }

      // Handle DEACTIVATE request
      if (message.type === 'DEACTIVATE' && sender.tab?.id) {
        const tabId = sender.tab.id;

        // Deactivate - silent (no notification, no sound)
        setActivationState(tabId, false);

        // Update badge to gray (inactive)
        browser.action.setBadgeBackgroundColor({
          color: '#6B7280',
          tabId: tabId
        });

        // Send deactivate message to content script to remove overlay
        browser.tabs.sendMessage(tabId, { type: 'DEACTIVATE' } as Message).catch(error => {
          console.log('Could not send deactivate message:', error);
        });
      }

      // Synchronous response (no return value needed)
      return false;
    });

    // Icon click handler - registered at top level (not in async function)
    browser.action.onClicked.addListener(async (tab) => {
      if (!tab.id) return;

      // Check if current page is restricted
      if (isRestrictedUrl(tab.url)) {
        await browser.notifications.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('/icon/48.png'),
          title: '스크린세이버 사용 불가',
          message: '브라우저 내부 페이지(chrome://, edge:// 등)에서는 보안상의 이유로 스크린세이버를 사용할 수 없습니다.',
        });
        return;
      }

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

    // Track the previously active tab to handle screen saver state
    let previousActiveTabId: number | null = null;

    // Update icon state when tab is activated
    browser.tabs.onActivated.addListener(async (activeInfo) => {
      // Deactivate screen saver on previous tab when switching tabs
      if (previousActiveTabId !== null && previousActiveTabId !== activeInfo.tabId) {
        const wasActive = getActivationState(previousActiveTabId);
        if (wasActive) {
          setActivationState(previousActiveTabId, false);

          // Update previous tab's badge to gray
          browser.action.setBadgeBackgroundColor({
            color: '#6B7280',
            tabId: previousActiveTabId
          }).catch(() => {
            // Tab might have been closed, ignore error
          });

          // Send deactivate message to previous tab
          browser.tabs.sendMessage(previousActiveTabId, { type: 'DEACTIVATE' } as Message).catch(() => {
            // Could not send message, tab might be closed
          });
        }
      }

      // Update current tab's icon state
      const tab = await browser.tabs.get(activeInfo.tabId);
      await updateIconState(activeInfo.tabId, tab.url);

      // Remember this tab as the currently active one
      previousActiveTabId = activeInfo.tabId;
    });

    // Update icon state when tab URL changes or page loads
    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      // Update on URL change or when page finishes loading (to handle reloads)
      if (changeInfo.url || changeInfo.status === 'complete') {
        await updateIconState(tabId, tab.url);
      }
    });

    // Load default images on first install
    browser.runtime.onInstalled.addListener(async (details) => {
      console.log('[DEBUG] onInstalled event fired. Reason:', details.reason, 'Version:', browser.runtime.getManifest().version);

      if (details.reason === 'install') {
        console.log('[INSTALL] Extension installed - loading default images');
        try {
          await loadDefaultImages();

          // RUNTIME VERIFICATION: Confirm images actually loaded
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('screen-saver-images', 2);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          const count = await new Promise<number>((resolve, reject) => {
            const tx = db.transaction('images', 'readonly');
            const store = tx.objectStore('images');
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });

          if (count === 0) {
            console.error('VERIFICATION FAILED: Default images did not load (count: 0)');
          } else {
            console.log(`Default images loaded successfully (verified: ${count} images in IndexedDB)`);
          }
        } catch (error) {
          console.error('Failed to load default images:', error instanceof Error ? error.message : String(error));
          console.error('Error details:', error);
        }
      }

      if (details.reason === 'update') {
        console.log('[UPDATE] Extension updated to version', browser.runtime.getManifest().version);
        // No action needed - default images already loaded on install
      }

      if (details.reason !== 'install' && details.reason !== 'update') {
        console.log('[DEBUG] Unhandled install reason:', details.reason);
      }
    });

    // Initialize badge on startup - set correct state for all tabs
    browser.tabs.query({}).then(async tabs => {
      // Find the currently active tab
      const activeTab = tabs.find(tab => tab.active);
      if (activeTab?.id) {
        previousActiveTabId = activeTab.id;
      }

      // Update icon state for all tabs
      for (const tab of tabs) {
        if (tab.id) {
          await updateIconState(tab.id, tab.url);
        }
      }
    });
  },
});
