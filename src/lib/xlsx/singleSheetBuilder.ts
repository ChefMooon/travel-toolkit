import type { WorkBook } from 'xlsx';
import type { ExportableSnapshot } from './types';
import { XLSX_SCHEMA_VERSION } from './types';
import {
  COST_HEADERS,
  EXCHANGE_RATE_HEADERS,
  SS_COST_COL,
  SS_EXCHANGE_COL,
  SS_NPT_COL,
  SS_PARTY_COL,
  SS_SECTION_DATA_START_ROW,
  SS_SECTION_HEADER_ROW,
  SS_SECTION_LABEL_ROW,
} from './constants';

/**
 * Build a single-sheet workbook (v1 schema).
 *
 * Layout:
 *   A1   : "Summary"
 *   A2:B2: "schema" / version
 *   A3:B3: "Trip ID" / value
 *   A4:B4: "Trip Name" / value
 *   A5:B5: "Global Markup" / value
 *   A6:B6: "Region" / value
 *   A7:B7: "Trip Currency" / value
 *
 *   D1           : "Travelling Party"
 *   D2:G2        : couple headers
 *   D3+          : couple rows
 *
 *   I1           : "Non-Paying Travellers"
 *   I2:J2        : NPT headers
 *   I3+          : NPT rows
 *
 *   L1           : "Cost Ledger"
 *   L2:R2        : cost headers
 *   L3+          : cost rows
 *
 *   T1           : "Exchange Rates"
 *   T2:V2        : exchange headers
 *   T3+          : rate rows
 */
export function buildSingleSheet(
  snapshot: ExportableSnapshot,
  XLSX: typeof import('xlsx'),
): WorkBook {
  const rows: (string | number | boolean | null)[][] = [];

  // Helper to track max columns for range
  let maxCol = 0;

  // ── Summary region (columns A-B) ──
  rows[0] = ['Summary'];
  rows[1] = ['schema', XLSX_SCHEMA_VERSION];
  rows[2] = ['Trip ID', snapshot.tripId];
  rows[3] = ['Trip Name', snapshot.tripName];
  rows[4] = ['Global Markup', snapshot.globalMarkup];
  rows[5] = ['Region', snapshot.region];
  rows[6] = ['Trip Currency', snapshot.targetCurrency];
  rows[7] = []; // blank separator

  // ── Travelling Party region at D1 ──
  ensureRow(rows, SS_SECTION_LABEL_ROW);
  rows[SS_SECTION_LABEL_ROW]![SS_PARTY_COL] = 'Travelling Party';

  ensureRow(rows, SS_SECTION_HEADER_ROW);
  rows[SS_SECTION_HEADER_ROW]![SS_PARTY_COL] = 'Name';
  rows[SS_SECTION_HEADER_ROW]![SS_PARTY_COL + 1] = 'Color Index';
  rows[SS_SECTION_HEADER_ROW]![SS_PARTY_COL + 2] = 'Icon Index';
  rows[SS_SECTION_HEADER_ROW]![SS_PARTY_COL + 3] = 'Sort Order';

  for (let i = 0; i < snapshot.couples.length; i++) {
    const couple = snapshot.couples[i]!;
    const rowIdx = SS_SECTION_DATA_START_ROW + i;
    ensureRow(rows, rowIdx);
    rows[rowIdx]![SS_PARTY_COL] = couple.name;
    rows[rowIdx]![SS_PARTY_COL + 1] = couple.colorIndex;
    rows[rowIdx]![SS_PARTY_COL + 2] = couple.iconIndex;
    rows[rowIdx]![SS_PARTY_COL + 3] = couple.sortOrder;
  }
  maxCol = Math.max(maxCol, SS_PARTY_COL + 3);

  // ── Non-Paying Travellers region at I1 ──
  ensureRow(rows, SS_SECTION_LABEL_ROW);
  rows[SS_SECTION_LABEL_ROW]![SS_NPT_COL] = 'Non-Paying Travellers';

  ensureRow(rows, SS_SECTION_HEADER_ROW);
  rows[SS_SECTION_HEADER_ROW]![SS_NPT_COL] = 'Label';
  rows[SS_SECTION_HEADER_ROW]![SS_NPT_COL + 1] = 'Parent Group';

  for (let i = 0; i < snapshot.nonPayingTravellers.length; i++) {
    const npt = snapshot.nonPayingTravellers[i]!;
    const parentName = snapshot.couples.find((c) => c.id === npt.coupleId)?.name ?? '';
    const rowIdx = SS_SECTION_DATA_START_ROW + i;
    ensureRow(rows, rowIdx);
    rows[rowIdx]![SS_NPT_COL] = npt.label;
    rows[rowIdx]![SS_NPT_COL + 1] = parentName;
  }
  maxCol = Math.max(maxCol, SS_NPT_COL + 1);

  // ── Cost ledger region at L1 ──
  ensureRow(rows, SS_SECTION_LABEL_ROW);
  rows[SS_SECTION_LABEL_ROW]![SS_COST_COL] = 'Cost Ledger';

  ensureRow(rows, SS_SECTION_HEADER_ROW);
  for (let c = 0; c < COST_HEADERS.length; c++) {
    rows[SS_SECTION_HEADER_ROW]![SS_COST_COL + c] = COST_HEADERS[c]!;
  }

  for (let i = 0; i < snapshot.costs.length; i++) {
    const cost = snapshot.costs[i]!;
    const rowIdx = SS_SECTION_DATA_START_ROW + i;
    ensureRow(rows, rowIdx);
    const coupleNames = resolveAssignedNames(cost.assignedCoupleIds, snapshot.couples);
    rows[rowIdx]![SS_COST_COL] = cost.name;
    rows[rowIdx]![SS_COST_COL + 1] = cost.currency;
    rows[rowIdx]![SS_COST_COL + 2] = cost.value;
    rows[rowIdx]![SS_COST_COL + 3] = cost.markupOverride ?? '';
    rows[rowIdx]![SS_COST_COL + 4] = cost.splitType;
    rows[rowIdx]![SS_COST_COL + 5] = coupleNames;
    rows[rowIdx]![SS_COST_COL + 6] = cost.type ?? '';
  }
  maxCol = Math.max(maxCol, SS_COST_COL + COST_HEADERS.length - 1);

  // ── Exchange Rates region at T1 ──
  ensureRow(rows, SS_SECTION_LABEL_ROW);
  rows[SS_SECTION_LABEL_ROW]![SS_EXCHANGE_COL] = 'Exchange Rates';

  ensureRow(rows, SS_SECTION_HEADER_ROW);
  rows[SS_SECTION_HEADER_ROW]![SS_EXCHANGE_COL] = EXCHANGE_RATE_HEADERS[0]!;
  rows[SS_SECTION_HEADER_ROW]![SS_EXCHANGE_COL + 1] = EXCHANGE_RATE_HEADERS[1]!;
  rows[SS_SECTION_HEADER_ROW]![SS_EXCHANGE_COL + 2] = EXCHANGE_RATE_HEADERS[2]!;

  for (let i = 0; i < snapshot.exchangeRates.length; i++) {
    const rate = snapshot.exchangeRates[i]!;
    const rowIdx = SS_SECTION_DATA_START_ROW + i;
    ensureRow(rows, rowIdx);
    rows[rowIdx]![SS_EXCHANGE_COL] = rate.currency;
    rows[rowIdx]![SS_EXCHANGE_COL + 1] = rate.rateToUSD;
    rows[rowIdx]![SS_EXCHANGE_COL + 2] = rate.isOverridden ? 'yes' : 'no';
  }
  maxCol = Math.max(maxCol, SS_EXCHANGE_COL + 2);

  // Convert rows → sheet
  const aoa = rows.map((row) => row ?? []);
  const sheet = XLSX.utils.aoa_to_sheet(aoa);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Trip');
  return wb;
}

// ── Helpers ──

function ensureRow(rows: (string | number | boolean | null)[][], idx: number): void {
  if (!rows[idx]) {
    rows[idx] = [];
  }
}

function resolveAssignedNames(ids: string[], couples: ExportableSnapshot['couples']): string {
  return ids
    .map((id) => couples.find((c) => c.id === id)?.name ?? id)
    .join(', ');
}
