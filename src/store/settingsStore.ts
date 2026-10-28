import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { ExportSchema, FileNamePreset } from '@/lib/xlsx/types';
import { isThemePreference, type ThemePreference } from './themePreference';
import type { Region } from './types';
import { REGION_LIST } from './types';

export type ImportRateMode = 'hybrid' | 'keep-imported' | 'refresh-live';
export type MeasurementSystem = 'metric' | 'imperial';
export type ClockFormat = '12h' | '24h';
export type AppLanguage = 'en' | 'fr-CA';

const SETTINGS_STORAGE_KEY = 'travel-toolkit-settings-data';
const TRIP_STORAGE_KEY = 'travel-toolkit-trip-data';

interface SettingsStore {
  themePreference: ThemePreference;
  exportSchema: ExportSchema;
  exportFilenamePreset: FileNamePreset;
  exportIncludeDate: boolean;
  importExchangeRateMode: ImportRateMode;
  measurementSystem: MeasurementSystem;
  clockFormat: ClockFormat;
  preferredCurrency: string;
  preferredRegion: Region | null;
  language: AppLanguage;
  setThemePreference: (preference: ThemePreference) => void;
  setExportSchema: (schema: ExportSchema) => void;
  setExportFilenamePreset: (preset: FileNamePreset) => void;
  setExportIncludeDate: (include: boolean) => void;
  setImportExchangeRateMode: (mode: ImportRateMode) => void;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  setClockFormat: (format: ClockFormat) => void;
  setPreferredCurrency: (currency: string) => void;
  setPreferredRegion: (region: Region | null) => void;
  setLanguage: (language: AppLanguage) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStoredState(storageKey: string): unknown {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw === null ? undefined : JSON.parse(raw);
  } catch (error) {
    console.error(`Unable to read ${storageKey} from local storage.`, error);
    return undefined;
  }
}

function readStoredThemePreference(): ThemePreference | undefined {
  const envelope = readStoredState(SETTINGS_STORAGE_KEY);
  if (!isRecord(envelope) || !isRecord(envelope.state)) {
    return undefined;
  }
  const preference = envelope.state.themePreference;
  return isThemePreference(preference) ? preference : undefined;
}

function readLegacyTripTheme(): 'light' | 'dark' | undefined {
  const envelope = readStoredState(TRIP_STORAGE_KEY);
  if (!isRecord(envelope) || !isRecord(envelope.state)) {
    return undefined;
  }
  const theme = envelope.state.theme;
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

function isExportSchema(value: unknown): value is ExportSchema {
  return value === 'single-sheet' || value === 'three-sheet';
}

function isFileNamePreset(value: unknown): value is FileNamePreset {
  return value === 'tripId' || value === 'slotLabel' || value === 'tripName' || value === 'custom';
}

function isImportRateMode(value: unknown): value is ImportRateMode {
  return value === 'hybrid' || value === 'keep-imported' || value === 'refresh-live';
}
function isMeasurementSystem(value: unknown): value is MeasurementSystem { return value === 'metric' || value === 'imperial'; }
function isClockFormat(value: unknown): value is ClockFormat { return value === '12h' || value === '24h'; }
function isAppLanguage(value: unknown): value is AppLanguage { return value === 'en' || value === 'fr-CA'; }
function isPreferredCurrency(value: unknown): value is string { return typeof value === 'string' && /^[A-Z]{3}$/.test(value); }
function isPreferredRegion(value: unknown): value is Region | null { return value === null || (typeof value === 'string' && REGION_LIST.includes(value as Region)); }

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch (error) {
      console.error(`Unable to read ${name} from local storage.`, error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      console.error(`Unable to write ${name} to local storage.`, error);
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch (error) {
      console.error(`Unable to remove ${name} from local storage.`, error);
    }
  },
};

const initialThemePreference = readLegacyTripTheme() ?? 'light';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      themePreference: initialThemePreference,
      exportSchema: 'three-sheet',
      exportFilenamePreset: 'tripId',
      exportIncludeDate: true,
      importExchangeRateMode: 'hybrid',
      measurementSystem: 'metric',
      clockFormat: '12h',
      preferredCurrency: 'USD',
      preferredRegion: null,
      language: 'en',
      setThemePreference: (themePreference) => set({ themePreference }),
      setExportSchema: (exportSchema) => set({ exportSchema }),
      setExportFilenamePreset: (exportFilenamePreset) => set({ exportFilenamePreset }),
      setExportIncludeDate: (exportIncludeDate) => set({ exportIncludeDate }),
      setImportExchangeRateMode: (importExchangeRateMode) => set({ importExchangeRateMode }),
      setMeasurementSystem: (measurementSystem) => set({ measurementSystem }),
      setClockFormat: (clockFormat) => set({ clockFormat }),
      setPreferredCurrency: (preferredCurrency) => set({ preferredCurrency }),
      setPreferredRegion: (preferredRegion) => set({ preferredRegion }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        themePreference: state.themePreference,
        exportSchema: state.exportSchema,
        exportFilenamePreset: state.exportFilenamePreset,
        exportIncludeDate: state.exportIncludeDate,
        importExchangeRateMode: state.importExchangeRateMode,
        measurementSystem: state.measurementSystem,
        clockFormat: state.clockFormat,
        preferredCurrency: state.preferredCurrency,
        preferredRegion: state.preferredRegion,
        language: state.language,
      }),
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        const persistedPreference = persisted.themePreference;
        const themePreference = isThemePreference(persistedPreference)
          ? persistedPreference
          : readLegacyTripTheme() ?? 'light';

        return {
          ...currentState,
          themePreference,
          exportSchema: isExportSchema(persisted.exportSchema)
            ? persisted.exportSchema
            : currentState.exportSchema,
          exportFilenamePreset: isFileNamePreset(persisted.exportFilenamePreset)
            ? persisted.exportFilenamePreset
            : currentState.exportFilenamePreset,
          exportIncludeDate: typeof persisted.exportIncludeDate === 'boolean'
            ? persisted.exportIncludeDate
            : currentState.exportIncludeDate,
          importExchangeRateMode: isImportRateMode(persisted.importExchangeRateMode)
            ? persisted.importExchangeRateMode
            : currentState.importExchangeRateMode,
          measurementSystem: isMeasurementSystem(persisted.measurementSystem) ? persisted.measurementSystem : currentState.measurementSystem,
          clockFormat: isClockFormat(persisted.clockFormat) ? persisted.clockFormat : currentState.clockFormat,
          preferredCurrency: isPreferredCurrency(persisted.preferredCurrency) ? persisted.preferredCurrency : currentState.preferredCurrency,
          preferredRegion: isPreferredRegion(persisted.preferredRegion) ? persisted.preferredRegion : currentState.preferredRegion,
          language: isAppLanguage(persisted.language) ? persisted.language : 'en',
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Unable to hydrate site settings.', error);
          return;
        }

        if (state && !readStoredThemePreference()) {
          state.setThemePreference(readLegacyTripTheme() ?? state.themePreference);
        }
      },
    },
  ),
);

export function migrateLegacyThemePreferenceBeforeTripCleanup(): void {
  if (readStoredThemePreference()) {
    return;
  }

  const legacyTheme = readLegacyTripTheme();
  if (legacyTheme) {
    useSettingsStore.getState().setThemePreference(legacyTheme);
  }
}
