import type { Couple, CostEntry, ExchangeRate, NonPayingTraveller, SplitType } from '@/store/types';
import type { ExportableSnapshot } from './types';
import { SHEET_SUMMARY, SHEET_COSTS, SHEET_PARTY } from './constants';

/**
 * Parse a three-sheet (v2) workbook into an ExportableSnapshot.
 *
 * Expected sheets: Summary, Costs, Party.
 */
export function parseThreeSheet(
  wb: import('xlsx').WorkBook,
  XLSX: typeof import('xlsx'),
): Partial<ExportableSnapshot> {
  const toAoa = (name: string) => {
    const ws = wb.Sheets[name];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(ws, {
      header: 1,
      defval: null,
    });
  };

  const summaryAoa = toAoa(SHEET_SUMMARY);
  const costsAoa = toAoa(SHEET_COSTS);
  const partyAoa = toAoa(SHEET_PARTY);

  const str = (aoa: typeof summaryAoa, r: number, c: number) => {
    const v = aoa[r]?.[c];
    return v != null ? String(v) : '';
  };
  const num = (aoa: typeof summaryAoa, r: number, c: number) => {
    const v = aoa[r]?.[c];
    return v != null ? Number(v) : NaN;
  };

  // ── Summary sheet metadata ──
  // Row layout: [key, value] pairs, then blank row, then "Exchange Rates" header, then rate rows
  const meta: Record<string, string> = {};
  let erStartRow = -1;

  for (let r = 0; r < summaryAoa.length; r++) {
    const key = str(summaryAoa, r, 0);
    if (key === 'Exchange Rates') {
      erStartRow = r;
      break;
    }
    if (key) {
      meta[key] = str(summaryAoa, r, 1);
    }
  }

  const tripId = meta['Trip ID'] ?? '';
  const tripName = meta['Trip Name'] ?? '';
  const globalMarkup = Number(meta['Global Markup']) || 66;
  const region = meta['Region'] ?? 'Europe';
  const targetCurrency = meta['Trip Currency'] ?? 'USD';
  const tripStartDate = meta['Trip Start Date'] ?? '';
  const tripEndDate = meta['Trip End Date'] ?? '';

  // Exchange rates from summary sheet
  const exchangeRates: Partial<ExchangeRate>[] = [];
  if (erStartRow >= 0) {
    // Skip the "Exchange Rates" label and header row
    for (let r = erStartRow + 2; r < summaryAoa.length; r++) {
      const currency = str(summaryAoa, r, 0);
      if (!currency) break;
      exchangeRates.push({
        currency,
        rateToUSD: num(summaryAoa, r, 1) || 0,
        isOverridden: str(summaryAoa, r, 2).toLowerCase() === 'yes',
      });
    }
  }

  // ── Costs sheet ──
  // Row 0 = headers, data from row 1
  const costs: Partial<CostEntry>[] = [];
  for (let r = 1; r < costsAoa.length; r++) {
    const name = str(costsAoa, r, 0);
    if (!name) break;

    const assignedRaw = str(costsAoa, r, 5);
    const assignedCoupleIds = assignedRaw
      ? assignedRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    costs.push({
      name,
      currency: str(costsAoa, r, 1) || 'USD',
      value: num(costsAoa, r, 2) || 0,
      markupOverride: str(costsAoa, r, 3) !== '' ? num(costsAoa, r, 3) : null,
      splitType: (str(costsAoa, r, 4) || 'shared') as SplitType,
      assignedCoupleIds,
      type: str(costsAoa, r, 6) || null,
    });
  }

  // ── Party sheet ──
  // "Couples" label, then header row, then couple data
  // Then blank, "Non-Paying Travellers" label, header row, then NPT data
  const couples: Partial<Couple>[] = [];
  const nonPayingTravellers: Partial<NonPayingTraveller>[] = [];

  let nptLabelRow = -1;
  for (let r = 0; r < partyAoa.length; r++) {
    if (str(partyAoa, r, 0) === 'Non-Paying Travellers') {
      nptLabelRow = r;
      break;
    }
  }

  // Couples start at row 2 (after "Couples" label and header)
  const coupleEndRow = nptLabelRow >= 0 ? nptLabelRow : partyAoa.length;
  for (let r = 2; r < coupleEndRow; r++) {
    const name = str(partyAoa, r, 0);
    if (!name) break;
    couples.push({
      name,
      colorIndex: num(partyAoa, r, 1) || 1,
      iconIndex: num(partyAoa, r, 2) || 1,
      sortOrder: num(partyAoa, r, 3) || couples.length,
    });
  }

  // NPTs
  if (nptLabelRow >= 0) {
    for (let r = nptLabelRow + 2; r < partyAoa.length; r++) {
      const label = str(partyAoa, r, 0);
      if (!label) break;
      nonPayingTravellers.push({
        label,
        coupleId: str(partyAoa, r, 1), // parent group name — resolved in validate step
      });
    }
  }

  return {
    tripId,
    tripName,
    globalMarkup,
    region: region as ExportableSnapshot['region'],
    targetCurrency,
    tripStartDate,
    tripEndDate,
    couples: couples as Couple[],
    nonPayingTravellers: nonPayingTravellers as NonPayingTraveller[],
    costs: costs as CostEntry[],
    exchangeRates: exchangeRates as ExchangeRate[],
  };
}
