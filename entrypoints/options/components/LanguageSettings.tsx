import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { languageSettings } from '@/lib/settingsStorage';
import type { LanguageSettings as LanguageSettingsType } from '@/lib/settingsStorage';
import { useTranslation } from '@/lib/useTranslation';

const LANGUAGES = [
  { code: 'en' as const, name: 'English' },
  { code: 'ko' as const, name: '한국어' },
  { code: 'ja' as const, name: '日本語' },
  { code: 'de' as const, name: 'Deutsch' },
];

export function LanguageSettings() {
  const { t, locale } = useTranslation();
  const [settings, setSettings] = useState<LanguageSettingsType>({
    locale: 'en',
  });

  // Load settings on mount
  useEffect(() => {
    languageSettings.getValue().then((saved) => {
      if (saved) {
        setSettings(saved);
      }
    });
  }, []);

  // Auto-save language changes immediately
  const handleLanguageChange = async (newLocale: 'en' | 'ko' | 'ja' | 'de') => {
    const newSettings = { locale: newLocale };
    setSettings(newSettings);
    await languageSettings.setValue(newSettings);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('languageSettingsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selector */}
        <div>
          <Label className="text-base font-medium mb-3 block">{t('displayLanguageLabel')}</Label>
          <div className="space-y-2">
            {LANGUAGES.map((lang) => (
              <label
                key={lang.code}
                className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name="language"
                  value={lang.code}
                  checked={settings.locale === lang.code}
                  onChange={() => handleLanguageChange(lang.code)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">{lang.name}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LanguageSettings;
