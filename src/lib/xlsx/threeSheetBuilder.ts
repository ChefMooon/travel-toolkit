import type { WorkBook } from 'xlsx';
import type { ExportableSnapshot } from './types';
import { XLSX_SCHEMA_VERSION } from './types';
import {
  SHEET_SUMMARY,
  SHEET_COSTS,
  SHEET_PARTY,
  COST_HEADERS,
  EXCHANGE_RATE_HEADERS,
} from './constants';

/**
 * Build a three-sheet workbook (v2 schema).
 *
 * Sheets:
 *   Summary — trip metadata + exchange rates
 *   Costs   — tabular cost ledger
 *   Party   — couples + non-paying travellers
 */
export function buildThreeSheet(
  snapshot: ExportableSnapshot,
  XLSX: typeof import('xlsx'),
): WorkBook {
  const wb = XLSX.utils.book_new();

  // ── Summary sheet ──
  const summaryAoa: (string | number | boolean)[][] = [
    ['schema', XLSX_SCHEMA_VERSION],
    ['Trip ID', snapshot.tripId],
    ['Trip Name', snapshot.tripName],
    ['Global Markup', snapshot.globalMarkup],
    ['Region', snapshot.region],
    ['Trip Currency', snapshot.targetCurrency],
    ['Trip Start Date', snapshot.tripStartDate ?? ''],
    ['Trip End Date', snapshot.tripEndDate ?? ''],
    [],
    ['Exchange Rates'],
    [...EXCHANGE_RATE_HEADERS],
  ];

  for (const rate of snapshot.exchangeRates) {
    summaryAoa.push([rate.currency, rate.rateToUSD, rate.isOverridden ? 'yes' : 'no']);
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryAoa), SHEET_SUMMARY);

  // ── Costs sheet ──
  const costsAoa: (string | number)[][] = [
    [...COST_HEADERS],
  ];

  for (const cost of snapshot.costs) {
    const coupleNames = cost.assignedCoupleIds
      .map((id) => snapshot.couples.find((c) => c.id === id)?.name ?? id)
      .join(', ');

    costsAoa.push([
      cost.name,
      cost.currency,
      cost.value,
      cost.markupOverride ?? '',
      cost.splitType,
      coupleNames,
      cost.type ?? '',
    ] as (string | number)[]);
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(costsAoa), SHEET_COSTS);

  // ── Party sheet ──
  const partyAoa: (string | number)[][] = [
    ['Couples'],
    ['Name', 'Color Index', 'Icon Index', 'Sort Order'],
  ];

  for (const couple of snapshot.couples) {
    partyAoa.push([couple.name, couple.colorIndex, couple.iconIndex, couple.sortOrder]);
  }

  partyAoa.push([]); // blank separator
  partyAoa.push(['Non-Paying Travellers']);
  partyAoa.push(['Label', 'Parent Group']);

  for (const npt of snapshot.nonPayingTravellers) {
    const parentName = snapshot.couples.find((c) => c.id === npt.coupleId)?.name ?? '';
    partyAoa.push([npt.label, parentName]);
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(partyAoa), SHEET_PARTY);

  return wb;
}
