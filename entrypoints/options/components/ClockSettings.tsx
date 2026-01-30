import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clockSettings } from '@/lib/settingsStorage';
import type { ClockSettings as ClockSettingsType } from '@/lib/settingsStorage';
import { TIMEZONES, getLocalTimezone } from '@/lib/timezones';
import { useTranslation } from '@/lib/useTranslation';

export function ClockSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ClockSettingsType>({
    enabled: false,
    timezone: getLocalTimezone(),
  });

  // Load settings on mount
  useEffect(() => {
    clockSettings.getValue().then((saved) => {
      if (saved) {
        setSettings(saved);
      }
    });
  }, []);

  // Auto-save enabled changes immediately
  const handleEnabledChange = async (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    await clockSettings.setValue(newSettings);
  };

  // Auto-save timezone changes immediately
  const handleTimezoneChange = async (timezone: string) => {
    const newSettings = { ...settings, timezone };
    setSettings(newSettings);
    await clockSettings.setValue(newSettings);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('clockSettingsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Clock Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">{t('showClockLabel')}</Label>
            <div className="text-sm text-gray-600">
              {t('showClockDescription')}
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {/* Timezone Selector - Only shown when enabled */}
        {settings.enabled && (
          <div>
            <Label className="text-base font-medium mb-3 block">{t('timezoneLabel')}</Label>
            <p className="text-sm text-gray-600 mb-3">
              {t('timezoneDescription')}
            </p>
            <Select value={settings.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('selectTimezonePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ClockSettings;
