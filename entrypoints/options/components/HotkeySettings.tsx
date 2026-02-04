import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { hotkeySettings } from '@/lib/settingsStorage';
import type { HotkeySettings as HotkeySettingsType } from '@/lib/settingsStorage';
import { useTranslation } from '@/lib/useTranslation';

/**
 * List of common browser shortcuts that should trigger a warning
 */
const COMMON_BROWSER_SHORTCUTS = [
  'Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+Shift+N', 'Ctrl+Tab', 'Ctrl+Shift+T',
  'Ctrl+R', 'Ctrl+F', 'Ctrl+H', 'Ctrl+J', 'Ctrl+D', 'Ctrl+P', 'Ctrl+S',
  'Alt+F4', 'Alt+Left', 'Alt+Right', 'F5', 'Ctrl+F5', 'F11', 'F12',
  'Meta+T', 'Meta+W', 'Meta+N', 'Meta+Shift+N', 'Meta+R', 'Meta+Q',
];

/**
 * Convert keyboard event to standardized hotkey string
 */
function eventToHotkeyString(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) {
    parts.push(event.ctrlKey ? 'Ctrl' : 'Meta');
  }
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  // Get the key name (capitalize first letter for consistency)
  let key = event.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();

  // Don't add modifier keys as the main key
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
}

/**
 * Check if hotkey conflicts with common browser shortcuts
 */
function isConflictingShortcut(hotkey: string): boolean {
  // Normalize the hotkey for comparison
  const normalized = hotkey.replace('Meta', 'Ctrl'); // Treat Meta (Cmd) same as Ctrl
  return COMMON_BROWSER_SHORTCUTS.some(
    shortcut => shortcut === normalized || shortcut === hotkey
  );
}

/**
 * Hotkey input field component
 */
function HotkeyInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRecording) return;

    event.preventDefault();
    event.stopPropagation();

    const hotkeyString = eventToHotkeyString(event.nativeEvent);

    // Check for conflicts
    if (isConflictingShortcut(hotkeyString)) {
      setWarning(t('hotkeyConflictWarning'));
    } else {
      setWarning(null);
    }

    onChange(hotkeyString);
    setIsRecording(false);
  };

  const handleFocus = () => {
    setIsRecording(true);
    setWarning(null);
  };

  const handleBlur = () => {
    setIsRecording(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">{label}</Label>
      <input
        type="text"
        value={value}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        readOnly
        placeholder={placeholder || t('hotkeyInputPlaceholder')}
        className={`w-full px-4 py-2 border rounded-md ${
          isRecording
            ? 'border-blue-500 ring-2 ring-blue-200'
            : 'border-gray-300'
        } ${warning ? 'border-red-500' : ''} cursor-pointer`}
      />
      {isRecording && (
        <p className="text-sm text-blue-600">{t('hotkeyRecordingHint')}</p>
      )}
      {warning && (
        <p className="text-sm text-yellow-600 flex items-center gap-1">
          <span>⚠️</span>
          <span>{warning}</span>
        </p>
      )}
    </div>
  );
}

export function HotkeySettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<HotkeySettingsType>({
    activateKey: '',
    deactivateKey: 'Escape',
  });

  // Load settings on mount
  useEffect(() => {
    hotkeySettings.getValue().then((saved) => {
      if (saved) {
        setSettings(saved);
      }
    });
  }, []);

  // Auto-save changes
  const handleActivateKeyChange = async (key: string) => {
    const newSettings = { ...settings, activateKey: key };
    setSettings(newSettings);
    await hotkeySettings.setValue(newSettings);
  };

  const handleDeactivateKeyChange = async (key: string) => {
    const newSettings = { ...settings, deactivateKey: key };
    setSettings(newSettings);
    await hotkeySettings.setValue(newSettings);
  };

  const handleReset = async () => {
    const defaultSettings: HotkeySettingsType = {
      activateKey: '',
      deactivateKey: 'Escape',
    };
    setSettings(defaultSettings);
    await hotkeySettings.setValue(defaultSettings);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('hotkeySettingsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-gray-600">
          {t('hotkeySettingsDescription')}
        </p>

        {/* Activate Hotkey */}
        <HotkeyInput
          label={t('hotkeyActivateLabel')}
          value={settings.activateKey}
          onChange={handleActivateKeyChange}
          placeholder={t('hotkeyNotSet')}
        />

        {/* Deactivate Hotkey */}
        <HotkeyInput
          label={t('hotkeyDeactivateLabel')}
          value={settings.deactivateKey}
          onChange={handleDeactivateKeyChange}
        />

        {/* Reset Button */}
        <div className="pt-4">
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {t('hotkeyResetButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default HotkeySettings;
