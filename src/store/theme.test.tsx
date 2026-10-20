/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import html from '../../index.html?raw';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useSettingsStore } from './settingsStore';
import { useResolvedTheme } from './theme';
import { resolveThemePreference } from './themePreference';

const SETTINGS_KEY = 'travel-toolkit-settings-data';
const TRIP_KEY = 'travel-toolkit-trip-data';
const bootstrapScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

function storeEnvelope(storageKey: string, state: Record<string, unknown>) {
  localStorage.setItem(storageKey, JSON.stringify({ state, version: 0 }));
}

function setSystemScheme(isDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    matches: isDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  } as unknown as MediaQueryList;

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery));
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => mediaQuery),
  });

  return (nextIsDark: boolean) => {
    Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: nextIsDark });
    listeners.forEach((listener) => listener({ matches: nextIsDark } as MediaQueryListEvent));
  };
}

function runBootstrap(options: {
  settings?: string;
  trip?: string;
  systemDark?: boolean;
  matchMediaAvailable?: boolean;
}) {
  localStorage.clear();
  if (options.settings !== undefined) localStorage.setItem(SETTINGS_KEY, options.settings);
  if (options.trip !== undefined) localStorage.setItem(TRIP_KEY, options.trip);

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: options.matchMediaAvailable === false
      ? undefined
      : vi.fn(() => ({ matches: options.systemDark ?? false })),
  });

  if (!bootstrapScript) throw new Error('Could not locate the inline theme bootstrap.');
  new Function(bootstrapScript)();

  return {
    theme: document.documentElement.dataset.theme,
    colorScheme: document.documentElement.style.colorScheme,
  };
}

describe('theme preference settings and resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ themePreference: 'light' });
    localStorage.removeItem(SETTINGS_KEY);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });
  });

  it('defaults to Light and persists only the selected preference with existing settings', () => {
    useSettingsStore.getState().setThemePreference('system');

    expect(useSettingsStore.getState().themePreference).toBe('system');
    const persisted = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as {
      state: Record<string, unknown>;
    };
    expect(persisted.state).toEqual({
      themePreference: 'system',
      exportSchema: 'three-sheet',
      exportFilenamePreset: 'tripId',
      exportIncludeDate: true,
      importExchangeRateMode: 'hybrid',
    });
    expect(persisted.state).not.toHaveProperty('resolvedTheme');
  });

  it('uses and stores Light when no site preference or valid legacy theme exists', () => {
    useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().themePreference).toBe('light');
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').state.themePreference).toBe('light');
  });

  it.each(['system', 'light', 'dark'] as const)(
    'hydrates a valid %s preference without migration',
    (preference) => {
      storeEnvelope(SETTINGS_KEY, { themePreference: preference });
      storeEnvelope(TRIP_KEY, { theme: preference === 'dark' ? 'light' : 'dark' });

      useSettingsStore.persist.rehydrate();

      expect(useSettingsStore.getState().themePreference).toBe(preference);
    },
  );

  it('migrates the current trip theme once and preserves existing settings', () => {
    storeEnvelope(TRIP_KEY, { theme: 'dark' });
    storeEnvelope(SETTINGS_KEY, {
      exportSchema: 'single-sheet',
      exportFilenamePreset: 'slotLabel',
      exportIncludeDate: false,
      importExchangeRateMode: 'keep-imported',
    });

    useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().themePreference).toBe('dark');
    expect(useSettingsStore.getState().exportSchema).toBe('single-sheet');
    expect(useSettingsStore.getState().exportFilenamePreset).toBe('slotLabel');
    expect(useSettingsStore.getState().exportIncludeDate).toBe(false);
    expect(useSettingsStore.getState().importExchangeRateMode).toBe('keep-imported');

    storeEnvelope(TRIP_KEY, { theme: 'light' });
    useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().themePreference).toBe('dark');
  });

  it('uses Light for invalid legacy preference and ignores themes inside save slots', () => {
    storeEnvelope(TRIP_KEY, {
      theme: 'invalid',
      slots: [{ data: { theme: 'dark' } }],
    });
    storeEnvelope(SETTINGS_KEY, { themePreference: 'invalid' });

    useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().themePreference).toBe('light');
  });

  it('falls back safely and reports malformed settings storage', () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(SETTINGS_KEY, '{broken');

    expect(() => useSettingsStore.persist.rehydrate()).not.toThrow();
    expect(useSettingsStore.getState().themePreference).toBe('light');
    expect(report).toHaveBeenCalled();
  });

  it('falls back safely and reports unavailable storage', () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => useSettingsStore.persist.rehydrate()).not.toThrow();
    expect(useSettingsStore.getState().themePreference).toBe('light');
    expect(report).toHaveBeenCalled();
  });

  it('resolves System reactively and ignores system changes for explicit preferences', async () => {
    const changeSystemScheme = setSystemScheme(false);
    useSettingsStore.getState().setThemePreference('system');
    const { result, rerender, unmount } = renderHook(() => useResolvedTheme());

    expect(result.current).toBe('light');
    act(() => changeSystemScheme(true));
    await waitFor(() => expect(result.current).toBe('dark'));

    act(() => useSettingsStore.getState().setThemePreference('light'));
    rerender();
    act(() => changeSystemScheme(false));
    expect(result.current).toBe('light');
    unmount();

    expect(resolveThemePreference('system', 'dark')).toBe('dark');
    expect(resolveThemePreference('light', 'dark')).toBe('light');
  });
});

describe('index.html theme bootstrap', () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });
  });

  it('migrates the current legacy trip theme before the app starts', () => {
    const result = runBootstrap({
      trip: JSON.stringify({ state: { theme: 'dark', slots: [{ data: { theme: 'light' } }] } }),
      systemDark: false,
    });

    expect(result).toEqual({ theme: 'dark', colorScheme: 'dark' });
  });

  it.each([
    ['system', false, 'light'],
    ['system', true, 'dark'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)('resolves %s with system-dark=%s before startup', (preference, systemDark, expected) => {
    const result = runBootstrap({
      settings: JSON.stringify({ state: { themePreference: preference } }),
      trip: JSON.stringify({ state: { theme: preference === 'dark' ? 'light' : 'dark' } }),
      systemDark,
    });

    expect(result).toEqual({ theme: expected, colorScheme: expected });
  });

  it('uses Light for malformed, unavailable, or unsupported system color-scheme data', () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(runBootstrap({ settings: '{broken', systemDark: true }).theme).toBe('light');
    expect(runBootstrap({
      settings: JSON.stringify({ state: { themePreference: 'system' } }),
      matchMediaAvailable: false,
    }).theme).toBe('light');

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(runBootstrap({ systemDark: true }).theme).toBe('light');
    expect(report).toHaveBeenCalled();
  });
});
