import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: [
      'storage',
      'notifications',
      'activeTab',
      'tabs',  // Required to read tab URLs for restricted page detection
      'unlimitedStorage',  // Prevents IndexedDB quota eviction
    ],
    action: {
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png',
      },
      default_title: 'Toggle Screen Saver',
      // NO default_popup - required for onClicked to fire
    },
    web_accessible_resources: [
      {
        resources: ['sounds/*.wav'],
        matches: ['<all_urls>'],
      },
      {
        resources: ['images/defaults/*.jpg'],  // Default images for IndexedDB loading
        matches: ['<all_urls>'],
      },
    ],
  },
});
