import { type KeyboardEvent, useRef } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import Tooltip from '@/components/Tooltip';
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
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | undefined;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % THEME_OPTIONS.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index + THEME_OPTIONS.length - 1) % THEME_OPTIONS.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = THEME_OPTIONS.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextOption = THEME_OPTIONS[nextIndex];
    if (!nextOption) return;

    setThemePreference(nextOption.value);
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className="theme-selector"
      data-preference={preference}
      role="radiogroup"
      aria-label={t('themePreference')}
    >
      {THEME_OPTIONS.map(({ value, key, ariaKey, Icon }, index) => (
        <Tooltip key={value} content={t('useTheme', { theme: t(key).toLocaleLowerCase() })}>
          <button
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-label={t(ariaKey)}
            aria-checked={preference === value}
            tabIndex={preference === value ? 0 : -1}
            onClick={() => setThemePreference(value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
          >
            <Icon size={16} strokeWidth={2.25} aria-hidden="true" focusable="false" />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
