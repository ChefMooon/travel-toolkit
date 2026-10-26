import { getColorThemeValue } from '@/store/types';
import type { ResolvedTheme } from '@/store/themePreference';

export interface GroupPresentation {
  foreground: string;
  totalForeground: string;
  softBackground: string;
  borderColor: string;
  headerBackground: string;
  headerForeground: string;
}

export function getGroupPresentation(
  colorIndex: number,
  theme: ResolvedTheme,
): GroupPresentation {
  const foreground = getColorThemeValue(colorIndex, theme);

  if (theme === 'dark') {
    const surfaceTint = `color-mix(in srgb, ${foreground} 12%, var(--surface))`;
    return {
      foreground,
      totalForeground: foreground,
      softBackground: surfaceTint,
      borderColor: `color-mix(in srgb, ${foreground} 40%, var(--surface))`,
      headerBackground: surfaceTint,
      headerForeground: foreground,
    };
  }

  return {
    foreground,
    totalForeground: `color-mix(in srgb, ${foreground} 65%, black)`,
    softBackground: `color-mix(in srgb, ${foreground} 18%, transparent)`,
    borderColor: `color-mix(in srgb, ${foreground} 30%, white)`,
    headerBackground: `color-mix(in srgb, ${foreground} 12%, white)`,
    headerForeground: 'var(--text)',
  };
}
