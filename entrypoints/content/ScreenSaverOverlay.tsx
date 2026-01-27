import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { displaySettings, clockSettings } from '@/lib/settingsStorage';
import type { DisplaySettings, ClockSettings } from '@/lib/settingsStorage';
import type { GetRandomImageResponse } from '@/lib/messages';
import DigitalClock from './components/DigitalClock';

export default function ScreenSaverOverlay() {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [settings, setSettings] = useState<DisplaySettings>({
    imageFit: 'cover',
    backgroundColor: '#000000',
  });
  const [clock, setClock] = useState<ClockSettings>({
    enabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Load image and settings on mount
  useEffect(() => {
    const loadImageAndSettings = async () => {
      try {
        console.log('[ScreenSaver] Requesting image from background script...');

        // Load settings and request image from background in parallel
        const [loadedSettings, loadedClock, imageResponse] = await Promise.all([
          displaySettings.getValue(),
          clockSettings.getValue(),
          browser.runtime.sendMessage({ type: 'GET_RANDOM_IMAGE' }) as Promise<GetRandomImageResponse>,
        ]);

        setSettings(loadedSettings);
        setClock(loadedClock);
        console.log('[ScreenSaver] Image response:', imageResponse.success ? 'success' : 'failed');

        if (imageResponse.success && imageResponse.dataUrl) {
          console.log('[ScreenSaver] Received data URL, length:', imageResponse.dataUrl.length);
          setImageSrc(imageResponse.dataUrl);
        } else {
          console.error('[ScreenSaver] Failed to get image:', imageResponse.error);
          setImageState('error');
        }
      } catch (error) {
        console.error('[ScreenSaver] Failed to load image:', error);
        setImageState('error');
      }
    };

    loadImageAndSettings();

    // No cleanup needed for data URLs (they're not object URLs)
  }, []);

  // ESC key handler - registered on window for reliable capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Notify background to deactivate
        browser.runtime.sendMessage({ type: 'DEACTIVATE' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className="image-container"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {imageState === 'loading' && (
        <div className="flex items-center justify-center">
          <p className="text-white text-xl">{browser.i18n.getMessage('loadingText')}</p>
        </div>
      )}

      {imageState === 'error' && (
        <div className="flex flex-col items-center justify-center">
          <p className="text-white text-xl">{browser.i18n.getMessage('errorTitle')}</p>
          <p className="text-white/70 text-sm mt-2">{browser.i18n.getMessage('errorMessage')}</p>
        </div>
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt="Screen saver"
          draggable="false"
          className={`screen-saver-image transition-opacity duration-300 ${
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit: settings.imageFit }}
          onLoad={() => setImageState('loaded')}
          onError={() => setImageState('error')}
        />
      )}

      {/* Digital Clock */}
      {clock.enabled && <DigitalClock timezone={clock.timezone} />}
    </div>
  );
}
