import type { ImportResult, ExportableSnapshot } from './types';
import { SHEET_SUMMARY, SHEET_COSTS, SHEET_PARTY } from './constants';
import { validateImportedSnapshot } from './validate';

/**
 * Import an .xlsx file and return a TripSnapshot.
 * SheetJS is loaded dynamically to keep the main bundle small.
 *
 * Detection strategy:
 *  1. Check for schema version marker → known format
 *  2. Check sheet names (Summary/Costs/Party) → three-sheet
 *  3. Recognize the single-sheet layout before parsing it
 */
export async function importWorkbook(file: File): Promise<ImportResult> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const warnings: string[] = [];

  // Detect schema
  const sheetNames = new Set(wb.SheetNames);
  const isThreeSheet =
    sheetNames.has(SHEET_SUMMARY) &&
    sheetNames.has(SHEET_COSTS) &&
    sheetNames.has(SHEET_PARTY);

  let raw: Partial<ExportableSnapshot>;

  if (isThreeSheet) {
    const { parseThreeSheet } = await import('./threeSheetParser');
    raw = parseThreeSheet(wb, XLSX);
  } else {
    // Reject unrelated or malformed files before replacing the active trip.
    const firstSheet = wb.Sheets[wb.SheetNames[0]!];
    if (!firstSheet) {
      throw new Error('The file contains no worksheet data.');
    }
    const cell = (address: string) => String(firstSheet[address]?.v ?? '').trim();
    if (cell('A1') !== 'Summary' || cell('A3') !== 'Trip ID' || cell('A4') !== 'Trip Name') {
      throw new Error('The file is not a recognized Travel Toolkit workbook.');
    }
    const { parseSingleSheet } = await import('./singleSheetParser');
    raw = parseSingleSheet(firstSheet, XLSX);
  }

  const snapshot = validateImportedSnapshot(raw, warnings);

  return { snapshot, warnings };
}
