import { isValidDateOnly } from '@/components/DatePicker/dateUtils';
import type {
  Couple,
  NonPayingTraveller,
  CostEntry,
  ExchangeRate,
  Region,
  SplitType,
} from '@/store/types';
import {
  MAX_GROUPS,
  MAX_COST_ENTRIES,
  MAX_KIDS_PER_GROUP,
  MAX_TRIP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MAX_COST_NAME_LENGTH,
  CURRENCIES,
  REGION_LIST,
} from '@/store/types';
import type { ExportableSnapshot } from './types';

const VALID_CURRENCIES = new Set(CURRENCIES);
const VALID_REGIONS = new Set<string>(REGION_LIST);
const VALID_SPLIT_TYPES = new Set<string>(['shared', 'subset', 'individual']);

export function validateImportedSnapshot(
  raw: Partial<ExportableSnapshot>,
  warnings: string[],
): ExportableSnapshot {
  const tripId = validateTripId(raw.tripId);
  const tripName = clampString(raw.tripName ?? 'Imported Trip', MAX_TRIP_NAME_LENGTH);
  const globalMarkup = clampNumber(raw.globalMarkup, 0, 9999, 66);
  const region = validateRegion(raw.region);
  const targetCurrency = validateCurrency(raw.targetCurrency, 'USD');
  let tripStartDate = validateDate(raw.tripStartDate);
  let tripEndDate = validateDate(raw.tripEndDate);
  if ((raw.tripStartDate && !tripStartDate) || (raw.tripEndDate && !tripEndDate)) warnings.push('Invalid trip dates were omitted.');
  if (tripEndDate && (!tripStartDate || tripEndDate < tripStartDate)) {
    warnings.push('Trip end date must be on or after the start date; trip dates were omitted.');
    tripStartDate = '';
    tripEndDate = '';
  }

  // Couples — deduplicate names
  const couples = validateCouples(raw.couples ?? [], warnings);
  if (couples.length > MAX_GROUPS) {
    warnings.push(`Party truncated to ${MAX_GROUPS} groups.`);
    couples.length = MAX_GROUPS;
  }

  // Build a name→id map from validated couples
  const coupleNameToId = new Map<string, string>();
  for (const c of couples) {
    coupleNameToId.set(c.name.toLowerCase(), c.id);
  }

  // Non-paying travellers
  const nonPayingTravellers = validateNPTs(raw.nonPayingTravellers ?? [], couples, coupleNameToId, warnings);

  // Costs
  const costs = validateCosts(raw.costs ?? [], coupleNameToId, warnings);
  if (costs.length > MAX_COST_ENTRIES) {
    warnings.push(`Costs truncated to ${MAX_COST_ENTRIES} entries.`);
    costs.length = MAX_COST_ENTRIES;
  }

  // Exchange rates
  const exchangeRates = validateExchangeRates(raw.exchangeRates ?? []);

  return {
    tripId,
    tripName,
    globalMarkup,
    couples,
    nonPayingTravellers,
    costs,
    exchangeRates,
    region,
    targetCurrency,
    tripStartDate,
    tripEndDate,
  };
}

function validateDate(raw: unknown): string {
  return typeof raw === 'string' && isValidDateOnly(raw) ? raw : '';
}

function validateTripId(raw: unknown): string {
  const str = String(raw ?? '').replace(/\D/g, '').slice(0, 6);
  if (str.length === 6) return str;
  // Generate a random 6-digit ID
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validateRegion(raw: unknown): Region {
  const str = String(raw ?? '');
  if (VALID_REGIONS.has(str)) return str as Region;
  return 'Europe';
}

function validateCurrency(raw: unknown, fallback: string): string {
  const str = String(raw ?? '').toUpperCase();
  if (VALID_CURRENCIES.has(str as (typeof CURRENCIES)[number])) return str;
  return fallback;
}

function clampString(raw: string, maxLen: number): string {
  return raw.slice(0, maxLen);
}

function clampNumber(raw: unknown, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

let _idCounter = 0;
function nextId(): string {
  _idCounter += 1;
  return `imp-${Date.now()}-${_idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Reset counter (for tests). */
export function _resetIdCounter(): void {
  _idCounter = 0;
}

function validateCouples(
  raw: Partial<Couple>[],
  warnings: string[],
): Couple[] {
  const seen = new Map<string, number>(); // lowercased name → count
  const result: Couple[] = [];

  for (const c of raw) {
    let name = clampString(String(c.name ?? 'Group'), MAX_GROUP_NAME_LENGTH).trim();
    if (!name) name = 'Group';

    const lower = name.toLowerCase();
    const count = seen.get(lower) ?? 0;
    if (count > 0) {
      const deduped = `${name} ${count + 1}`;
      warnings.push(`Duplicate group name "${name}" renamed to "${deduped}".`);
      name = deduped;
    }
    seen.set(lower, count + 1);

    result.push({
      id: nextId(),
      name,
      colorIndex: clampNumber(c.colorIndex, 1, 10, ((result.length % 10) + 1)),
      iconIndex: clampNumber(c.iconIndex, 1, 10, ((result.length % 10) + 1)),
      sortOrder: result.length,
    });
  }

  return result;
}

function validateNPTs(
  raw: Partial<NonPayingTraveller>[],
  couples: Couple[],
  nameToId: Map<string, string>,
  warnings: string[],
): NonPayingTraveller[] {
  // Count per couple for limit enforcement
  const countPerCouple = new Map<string, number>();
  const result: NonPayingTraveller[] = [];

  for (const npt of raw) {
    const label = clampString(String(npt.label ?? 'Child'), 50).trim() || 'Child';

    // coupleId might be an actual id or a couple name (from xlsx)
    let coupleId = String(npt.coupleId ?? '');

    // Try name lookup first
    const byName = nameToId.get(coupleId.toLowerCase());
    if (byName) {
      coupleId = byName;
    } else if (!couples.some((c) => c.id === coupleId)) {
      // Unresolved parent
      if (couples.length > 0) {
        warnings.push(`Non-paying traveller "${label}" has unknown parent "${coupleId}", assigned to first group.`);
        coupleId = couples[0]!.id;
      } else {
        continue; // skip — no couples to assign to
      }
    }

    const current = countPerCouple.get(coupleId) ?? 0;
    if (current >= MAX_KIDS_PER_GROUP) {
      warnings.push(`Group limit reached: "${label}" skipped.`);
      continue;
    }
    countPerCouple.set(coupleId, current + 1);

    result.push({ id: nextId(), label, coupleId });
  }

  return result;
}

function validateCosts(
  raw: Partial<CostEntry>[],
  nameToId: Map<string, string>,
  warnings: string[],
): CostEntry[] {
  const result: CostEntry[] = [];

  for (const c of raw) {
    const name = clampString(String(c.name ?? 'Cost'), MAX_COST_NAME_LENGTH).trim() || 'Cost';
    const currency = validateCurrency(c.currency, 'USD');
    const value = clampNumber(c.value, 0, 999_999_999, 0);
    const markupRaw = c.markupOverride;
    const markupOverride = markupRaw == null ? null : clampNumber(markupRaw, 0, 9999, null as unknown as number);
    const splitType: SplitType = VALID_SPLIT_TYPES.has(String(c.splitType)) ? (c.splitType as SplitType) : 'shared';
    const type = c.type ?? null;

    // Resolve assigned couple IDs — may be names from xlsx
    const rawIds = c.assignedCoupleIds ?? [];
    const assignedCoupleIds: string[] = [];
    for (const raw of rawIds) {
      const byName = nameToId.get(String(raw).toLowerCase());
      if (byName) {
        assignedCoupleIds.push(byName);
      } else {
        warnings.push(`Cost "${name}": unresolved assignment "${raw}".`);
      }
    }

    result.push({
      id: nextId(),
      name,
      currency,
      value,
      markupOverride: typeof markupOverride === 'number' && !Number.isNaN(markupOverride) ? markupOverride : null,
      splitType,
      assignedCoupleIds,
      sortOrder: result.length,
      type,
    });
  }

  return result;
}

function validateExchangeRates(raw: Partial<ExchangeRate>[]): ExchangeRate[] {
  const result: ExchangeRate[] = [];
  const seen = new Set<string>();

  for (const r of raw) {
    const currency = String(r.currency ?? '').toUpperCase();
    if (!currency || seen.has(currency)) continue;
    seen.add(currency);

    const rateToUSD = Number(r.rateToUSD);
    if (Number.isNaN(rateToUSD) || rateToUSD <= 0) continue;

    result.push({
      currency,
      rateToUSD,
      isOverridden: r.isOverridden === true,
    });
  }

  return result;
}
