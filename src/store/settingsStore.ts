import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExportSchema, FileNamePreset } from '@/lib/xlsx/types';

export type ImportRateMode = 'hybrid' | 'keep-imported' | 'refresh-live';

interface SettingsStore {
  exportSchema: ExportSchema;
  exportFilenamePreset: FileNamePreset;
  exportIncludeDate: boolean;
  importExchangeRateMode: ImportRateMode;
  setExportSchema: (schema: ExportSchema) => void;
  setExportFilenamePreset: (preset: FileNamePreset) => void;
  setExportIncludeDate: (include: boolean) => void;
  setImportExchangeRateMode: (mode: ImportRateMode) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      exportSchema: 'three-sheet',
      exportFilenamePreset: 'tripId',
      exportIncludeDate: true,
      importExchangeRateMode: 'hybrid',
      setExportSchema: (exportSchema) => set({ exportSchema }),
      setExportFilenamePreset: (exportFilenamePreset) => set({ exportFilenamePreset }),
      setExportIncludeDate: (exportIncludeDate) => set({ exportIncludeDate }),
      setImportExchangeRateMode: (importExchangeRateMode) => set({ importExchangeRateMode }),
    }),
    {
      name: 'mkt-settings-data',
    },
  ),
);
