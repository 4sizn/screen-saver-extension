import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { displaySettings } from '@/lib/settingsStorage';
import type { DisplaySettings as DisplaySettingsType } from '@/lib/settingsStorage';
import { useTranslation } from '@/lib/useTranslation';

export function DisplaySettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<DisplaySettingsType>({
    imageFit: 'cover',
    backgroundColor: '#000000',
  });

  const [colorInput, setColorInput] = useState('#000000');

  // Load settings on mount
  useEffect(() => {
    displaySettings.getValue().then((saved) => {
      if (saved) {
        setSettings(saved);
        setColorInput(saved.backgroundColor);
      }
    });
  }, []);

  // Auto-save imageFit changes immediately
  const handleFitChange = async (fit: 'cover' | 'contain') => {
    const newSettings = { ...settings, imageFit: fit };
    setSettings(newSettings);
    await displaySettings.setValue(newSettings);
  };

  // Debounced auto-save for color changes (avoid excessive writes during drag)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (colorInput !== settings.backgroundColor) {
        const newSettings = { ...settings, backgroundColor: colorInput };
        setSettings(newSettings);
        await displaySettings.setValue(newSettings);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [colorInput, settings]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('displaySettingsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Fit Selector */}
        <div>
          <Label className="text-base font-medium mb-3 block">{t('imageFitLabel')}</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="imageFit"
                value="cover"
                checked={settings.imageFit === 'cover'}
                onChange={() => handleFitChange('cover')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium">{t('coverTitle')}</div>
                <div className="text-sm text-gray-600">
                  {t('coverDescription')}
                </div>
              </div>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="imageFit"
                value="contain"
                checked={settings.imageFit === 'contain'}
                onChange={() => handleFitChange('contain')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium">{t('containTitle')}</div>
                <div className="text-sm text-gray-600">
                  {t('containDescription')}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Background Color Picker */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            {t('backgroundColorLabel')}
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            {t('backgroundColorDescription')}
          </p>
          <div className="space-y-3">
            <HexColorPicker color={colorInput} onChange={setColorInput} />
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="font-mono text-sm border border-gray-300 rounded px-3 py-2 w-32"
              pattern="^#[0-9A-Fa-f]{6}$"
              placeholder="#000000"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DisplaySettings;
