import type { Couple, CostEntry, ExchangeRate, NonPayingTraveller, SplitType } from '@/store/types';
import type { ExportableSnapshot } from './types';
import {
  SS_COST_COL,
  SS_EXCHANGE_COL,
  SS_NPT_COL,
  SS_PARTY_COL,
  SS_SECTION_DATA_START_ROW,
} from './constants';

/**
 * Parse a single-sheet (v1) workbook into an ExportableSnapshot.
 *
 * Expected layout matches singleSheetBuilder output.
 */
export function parseSingleSheet(
  sheet: import('xlsx').WorkSheet,
  XLSX: typeof import('xlsx'),
): Partial<ExportableSnapshot> {
  const aoa: (string | number | boolean | null | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });

  const get = (row: number, col: number) => aoa[row]?.[col] ?? null;
  const str = (row: number, col: number) => {
    const v = get(row, col);
    return v != null ? String(v) : '';
  };

  // ── Metadata from A2:B7 ──
  const tripId = str(2, 1);
  const tripName = str(3, 1);
  const globalMarkup = Number(get(4, 1)) || 66;
  const region = str(5, 1);
  const targetCurrency = str(6, 1);

  // ── Cost ledger from L3 downward ──
  const costs: Partial<CostEntry>[] = [];
  for (let r = SS_SECTION_DATA_START_ROW; r < aoa.length; r++) {
    const name = str(r, SS_COST_COL);
    if (!name) break; // end of cost data

    const assignedRaw = str(r, SS_COST_COL + 5);
    const assignedCoupleIds = assignedRaw
      ? assignedRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    costs.push({
      name: name || 'Cost',
      currency: str(r, SS_COST_COL + 1) || 'USD',
      value: Number(get(r, SS_COST_COL + 2)) || 0,
      markupOverride:
        get(r, SS_COST_COL + 3) != null && get(r, SS_COST_COL + 3) !== ''
          ? Number(get(r, SS_COST_COL + 3))
          : null,
      splitType: (str(r, SS_COST_COL + 4) || 'shared') as SplitType,
      assignedCoupleIds,
      type: str(r, SS_COST_COL + 6) || null,
    });
  }

  // ── Travelling Party ──
  const couples: Partial<Couple>[] = [];
  const nonPayingTravellers: Partial<NonPayingTraveller>[] = [];
  const exchangeRates: Partial<ExchangeRate>[] = [];

  // Parse couples from D3+
  for (let r = SS_SECTION_DATA_START_ROW; r < aoa.length; r++) {
    const name = str(r, SS_PARTY_COL);
    if (!name) break;
    couples.push({
      name,
      colorIndex: Number(get(r, SS_PARTY_COL + 1)) || 1,
      iconIndex: Number(get(r, SS_PARTY_COL + 2)) || 1,
      sortOrder: Number(get(r, SS_PARTY_COL + 3)) || couples.length,
    });
  }

  // Parse NPTs from I3+
  for (let r = SS_SECTION_DATA_START_ROW; r < aoa.length; r++) {
    const label = str(r, SS_NPT_COL);
    if (!label) break;
    nonPayingTravellers.push({
      label,
      coupleId: str(r, SS_NPT_COL + 1), // parent group name — resolved in validate step
    });
  }

  // Parse exchange rates from T3+
  for (let r = SS_SECTION_DATA_START_ROW; r < aoa.length; r++) {
    const currency = str(r, SS_EXCHANGE_COL);
    if (!currency) break;
    exchangeRates.push({
      currency,
      rateToUSD: Number(get(r, SS_EXCHANGE_COL + 1)) || 0,
      isOverridden: str(r, SS_EXCHANGE_COL + 2).toLowerCase() === 'yes',
    });
  }

  return {
    tripId,
    tripName,
    globalMarkup,
    region: region as ExportableSnapshot['region'],
    targetCurrency,
    couples: couples as Couple[],
    nonPayingTravellers: nonPayingTravellers as NonPayingTraveller[],
    costs: costs as CostEntry[],
    exchangeRates: exchangeRates as ExchangeRate[],
  };
}
