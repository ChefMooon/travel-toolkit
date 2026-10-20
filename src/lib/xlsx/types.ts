import type { TripSnapshot } from '@/store/types';

export const XLSX_SCHEMA_VERSION = 1;

export type ExportSchema = 'single-sheet' | 'three-sheet';

export type ExportSource =
  | { type: 'active' }
  | { type: 'slot'; slotIndex: number };

export type FileNamePreset = 'tripId' | 'slotLabel' | 'tripName' | 'custom';

export interface ExportOptions {
  schema: ExportSchema;
  source: ExportSource;
  namePreset: FileNamePreset;
  customName?: string;
  slotLabel?: string;
  includeDate?: boolean;
}

export type ExportableSnapshot = TripSnapshot;

export interface ImportResult {
  snapshot: ExportableSnapshot;
  warnings: string[];
}
