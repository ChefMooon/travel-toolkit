import { useSyncExternalStore } from 'react';
import { useSettingsStore } from './settingsStore';
import { resolveThemePreference, type ResolvedTheme } from './themePreference';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();
let mediaQuery: MediaQueryList | null = null;

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'dark' : 'light';
}

function notifySystemThemeChange() {
  listeners.forEach((listener) => listener());
}

function subscribeToSystemTheme(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', notifySystemThemeChange);
    } else {
      mediaQuery.addListener(notifySystemThemeChange);
    }
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && mediaQuery) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', notifySystemThemeChange);
      } else {
        mediaQuery.removeListener(notifySystemThemeChange);
      }
      mediaQuery = null;
    }
  };
}

export function useResolvedTheme(): ResolvedTheme {
  const preference = useSettingsStore((state) => state.themePreference);
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => 'light' as ResolvedTheme,
  );
  return resolveThemePreference(preference, systemTheme);
}
