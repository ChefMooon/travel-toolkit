import { Monitor, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import SegmentedControl from '@/components/SegmentedControl';
import { useTranslation } from 'react-i18next';

const THEME_OPTIONS = [
  { value: 'system', key: 'system', ariaKey: 'themeSystem', Icon: Monitor },
  { value: 'light', key: 'light', ariaKey: 'themeLight', Icon: Sun },
  { value: 'dark', key: 'dark', ariaKey: 'themeDark', Icon: Moon },
] as const;

export default function ThemeSelector() {
  const { t } = useTranslation();
  const preference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  return (
    <SegmentedControl
      semantics="radio"
      size="sm"
      className="theme-selector"
      aria-label={t('themePreference')}
      value={preference}
      onChange={setThemePreference}
      options={THEME_OPTIONS.map(({ value, key, ariaKey, Icon }) => ({
        value,
        ariaLabel: t(ariaKey),
        tooltip: t('useTheme', { theme: t(key).toLocaleLowerCase() }),
        icon: <Icon size={16} strokeWidth={2.25} aria-hidden="true" focusable="false" />,
      }))}
    />
  );
}
