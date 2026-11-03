import type { TripSnapshot } from '@/store/types';
import type { ExportOptions, ExportableSnapshot } from './types';
import { buildExportFilename } from './filename';

/**
 * Export a trip snapshot as an .xlsx file and trigger a browser download.
 * SheetJS is loaded dynamically to keep the main bundle small.
 * Pass the `now` used for a file-name preview so the written name matches it.
 */
export async function exportWorkbook(
  snapshot: TripSnapshot,
  options: ExportOptions,
  now: Date = new Date(),
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

  XLSX.writeFile(wb, buildExportFilename(snapshot, options, now));
}
