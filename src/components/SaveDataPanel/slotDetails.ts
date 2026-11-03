import { buildSummary, getTripTotal, roundHalfUp, splitCost } from '@/lib/calculations';
import { isValidDateOnly } from '@/components/DatePicker/dateUtils';
import { COST_ENTRY_TYPES, SAVE_SLOT_SCHEMA_VERSION, type Region, type SaveSlot } from '@/store/types';

export type SlotUnavailableReason = 'schema' | 'rates' | 'invalid';

export interface SlotUnavailable {
  unavailable: SlotUnavailableReason;
}

export interface CostTypeShare {
  /** A COST_ENTRY_TYPES id, or 'other' for unknown or missing types. */
  id: string;
  /** Hex from COST_ENTRY_TYPES; null for "other" (the UI uses a neutral token). */
  color: string | null;
  /** In the trip's target currency. */
  amount: number;
  /** Whole percent of the type breakdown (the shares sum to about 100). */
  percent: number;
}

export interface GroupDetails {
  id: string;
  name: string;
  colorIndex: number;
  iconIndex: number;
  grandTotal: number | null;
  nonPayingCount: number;
}

export interface SlotDetails {
  total: number;
  currency: string;
  costTypes: CostTypeShare[];
  entryCount: number;
  ratesCached: number;
  ratesOverridden: number;
  globalMarkup: number;
  groups: GroupDetails[];
  nonPayingCount: number;
  startDate: string | null;
  endDate: string | null;
  /** Nights between start and end; null without both dates. */
  nights: number | null;
  region: Region;
  tripId: string;
  schemaVersion: number;
  savedAt: string;
}

export type SlotDetailsResult = SlotDetails | SlotUnavailable;

export function isUnavailable(result: SlotDetailsResult): result is SlotUnavailable {
  return 'unavailable' in result;
}

const OTHER_TYPE_ID = 'other';
const DAY_MS = 86_400_000;

function nightsBetween(start: string | null, end: string | null): number | null {
  if (!start || !end || end <= start) return null;
  const nights = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS);
  return Number.isFinite(nights) && nights > 0 ? nights : null;
}

/**
 * Totals and breakdowns for a saved trip, calculated on demand from `slot.data` with the snapshot's
 * own saved exchange rates. Never stored on the slot or in a store. The total is the dashboard's
 * number (buildSummary + getTripTotal) so the two always agree.
 */
export function computeSlotDetails(slot: SaveSlot): SlotDetailsResult {
  if (slot.schemaVersion !== SAVE_SLOT_SCHEMA_VERSION) return { unavailable: 'schema' };
  try {
    const d = slot.data;
    const summaries = buildSummary(d.couples, d.costs, d.globalMarkup, d.exchangeRates, d.targetCurrency);
    const total = getTripTotal(summaries);
    if (total === null) return { unavailable: 'rates' };

    const rateMap = new Map(d.exchangeRates.map((rate) => [rate.currency, rate.rateToUSD]));
    if (!rateMap.has('USD')) rateMap.set('USD', 1);
    const targetRate = d.targetCurrency === 'USD' ? 1 : rateMap.get(d.targetCurrency);

    // Per-cost allocations converted to the target currency, grouped by cost type.
    const byType = new Map<string, number>();
    for (const cost of d.costs) {
      const rate = rateMap.get(cost.currency);
      if (rate === undefined || targetRate === undefined) continue;
      let allocated = 0;
      for (const amount of splitCost(cost, d.couples, d.globalMarkup).values()) allocated += amount;
      const known = COST_ENTRY_TYPES.some((type) => type.id === cost.type);
      const id = known ? (cost.type as string) : OTHER_TYPE_ID;
      byType.set(id, (byType.get(id) ?? 0) + (roundHalfUp(allocated) * rate) / targetRate);
    }
    const typeSum = [...byType.values()].reduce((sum, amount) => sum + amount, 0);
    const costTypes: CostTypeShare[] = [...byType.entries()]
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => ({
        id,
        color: COST_ENTRY_TYPES.find((type) => type.id === id)?.color ?? null,
        amount: roundHalfUp(amount),
        percent: typeSum > 0 ? Math.round((amount / typeSum) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const nonPayingByGroup = new Map<string, number>();
    for (const traveller of d.nonPayingTravellers) {
      nonPayingByGroup.set(traveller.coupleId, (nonPayingByGroup.get(traveller.coupleId) ?? 0) + 1);
    }
    const startDate = d.tripStartDate && isValidDateOnly(d.tripStartDate) ? d.tripStartDate : null;
    const endDate = d.tripEndDate && isValidDateOnly(d.tripEndDate) ? d.tripEndDate : null;

    return {
      total,
      currency: d.targetCurrency,
      costTypes,
      entryCount: d.costs.length,
      ratesCached: d.exchangeRates.filter((rate) => !rate.isOverridden).length,
      ratesOverridden: d.exchangeRates.filter((rate) => rate.isOverridden).length,
      globalMarkup: d.globalMarkup,
      groups: summaries.map((summary) => ({
        id: summary.coupleId,
        name: summary.coupleName,
        colorIndex: summary.colorIndex,
        iconIndex: summary.iconIndex,
        grandTotal: summary.grandTotal,
        nonPayingCount: nonPayingByGroup.get(summary.coupleId) ?? 0,
      })),
      nonPayingCount: d.nonPayingTravellers.length,
      startDate,
      endDate,
      nights: startDate ? nightsBetween(startDate, endDate) : null,
      region: d.region,
      tripId: slot.tripId,
      schemaVersion: slot.schemaVersion,
      savedAt: slot.savedAt,
    };
  } catch {
    // Per-item cost and group fields are not validated on load, so corrupt data lands here.
    return { unavailable: 'invalid' };
  }
}
