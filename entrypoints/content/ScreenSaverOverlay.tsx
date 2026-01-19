import { useEffect } from 'react';
import { browser } from 'wxt/browser';

export default function ScreenSaverOverlay() {
  useEffect(() => {
    // ESC key handler - registered on window for reliable capture
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
    <div className="overlay-container">
      <div className="placeholder-content">
        <p className="text-white text-2xl">Screen Saver Active</p>
        <p className="text-white/70 text-sm mt-2">Press ESC to exit</p>
      </div>
    </div>
  );
}
