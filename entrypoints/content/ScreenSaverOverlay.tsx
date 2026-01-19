import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { getAllImages } from '@/lib/imageStorage';
import { displaySettings } from '@/lib/settingsStorage';
import type { DisplaySettings } from '@/lib/settingsStorage';

export default function ScreenSaverOverlay() {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [settings, setSettings] = useState<DisplaySettings>({
    imageFit: 'cover',
    backgroundColor: '#000000',
  });

  // Load image and settings on mount
  useEffect(() => {
    const loadImageAndSettings = async () => {
      try {
        console.log('[ScreenSaver] Loading images and settings...');

        // Load settings and images in parallel
        const [loadedSettings, allImages] = await Promise.all([
          displaySettings.getValue(),
          getAllImages(),
        ]);

        console.log('[ScreenSaver] Total images in DB:', allImages.length);
        setSettings(loadedSettings);

        // PRIORITY SYSTEM: Custom images take precedence over defaults
        // 1. Try custom enabled images first (user uploads)
        let enabledImages = allImages.filter(img => !img.isDefault && img.isEnabled);
        console.log('[ScreenSaver] Enabled custom images:', enabledImages.length);

        // 2. Fallback to enabled default images only if no custom images
        if (enabledImages.length === 0) {
          enabledImages = allImages.filter(img => img.isDefault && img.isEnabled);
          console.log('[ScreenSaver] Using enabled default images fallback:', enabledImages.length);
        }

        // 3. Last resort: use all default images (even if disabled)
        if (enabledImages.length === 0) {
          enabledImages = allImages.filter(img => img.isDefault);
          console.log('[ScreenSaver] Using all default images (last resort):', enabledImages.length);
        }

        // Select random image
        if (enabledImages.length > 0) {
          const randomImage = enabledImages[Math.floor(Math.random() * enabledImages.length)];
          console.log('[ScreenSaver] Selected image:', randomImage.name, randomImage.id);
          const blobUrl = URL.createObjectURL(randomImage.blob);
          setImageSrc(blobUrl);
        } else {
          console.error('[ScreenSaver] No images available in database');
          setImageState('error');
        }
      } catch (error) {
        console.error('[ScreenSaver] Failed to load image:', error);
        setImageState('error');
      }
    };

    loadImageAndSettings();

    // Cleanup blob URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
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
          <p className="text-white text-xl">Loading...</p>
        </div>
      )}

      {imageState === 'error' && (
        <div className="flex flex-col items-center justify-center">
          <p className="text-white text-xl">Unable to load image</p>
          <p className="text-white/70 text-sm mt-2">Check settings to enable images</p>
        </div>
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt="Screen saver"
          className={`screen-saver-image transition-opacity duration-300 ${
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit: settings.imageFit }}
          onLoad={() => setImageState('loaded')}
          onError={() => setImageState('error')}
        />
      )}
    </div>
  );
}
