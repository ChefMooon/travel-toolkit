import type { TripSnapshot } from '@/store/types';
import type { ExportOptions, ExportableSnapshot } from './types';

/**
 * Export a trip snapshot as an .xlsx file and trigger a browser download.
 * SheetJS is loaded dynamically to keep the main bundle small.
 */
export async function exportWorkbook(
  snapshot: TripSnapshot,
  options: ExportOptions,
): Promise<void> {
  const XLSX = await import('xlsx');

  // Select workbook fields explicitly; appearance is not part of trip data.
  const exportable: ExportableSnapshot = {
    tripId: snapshot.tripId,
    tripName: snapshot.tripName,
    globalMarkup: snapshot.globalMarkup,
    couples: snapshot.couples,
    nonPayingTravellers: snapshot.nonPayingTravellers,
    costs: snapshot.costs,
    exchangeRates: snapshot.exchangeRates,
    region: snapshot.region,
    targetCurrency: snapshot.targetCurrency,
    tripStartDate: snapshot.tripStartDate ?? '',
    tripEndDate: snapshot.tripEndDate ?? '',
  };

  let wb: import('xlsx').WorkBook;

  if (options.schema === 'three-sheet') {
    const { buildThreeSheet } = await import('./threeSheetBuilder');
    wb = buildThreeSheet(exportable, XLSX);
  } else {
    const { buildSingleSheet } = await import('./singleSheetBuilder');
    wb = buildSingleSheet(exportable, XLSX);
  }

  const filename = buildFilename(snapshot, options);
  XLSX.writeFile(wb, filename);
}

function buildFilename(snapshot: TripSnapshot, options: ExportOptions): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStamp = [
    now.getFullYear(),
    '-',
    pad(now.getMonth() + 1),
    '-',
    pad(now.getDate()),
  ].join('');

  let prefix = '';
  switch (options.namePreset) {
    case 'slotLabel':
      prefix = sanitizeFilename(options.slotLabel ?? '');
      break;
    case 'tripName':
      prefix = sanitizeFilename(snapshot.tripName);
      break;
    case 'custom':
      prefix = sanitizeFilename(options.customName ?? '');
      break;
    case 'tripId':
    default:
      break;
  }

  const baseName = prefix || sanitizeFilename(snapshot.tripId) || 'trip-export';
  const includeDate = options.includeDate ?? true;
  return includeDate ? `${baseName}_${dateStamp}.xlsx` : `${baseName}.xlsx`;
}

function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
