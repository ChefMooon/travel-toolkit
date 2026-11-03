import { describe, expect, it } from 'vitest';
import { buildSummary, getTripTotal } from '@/lib/calculations';
import { computeSlotDetails, isUnavailable, type SlotDetails } from './slotDetails';
import { makeSlot } from './slotDetailsFixtures';

function details(slot = makeSlot()): SlotDetails {
  const result = computeSlotDetails(slot);
  if (isUnavailable(result)) throw new Error(`unavailable: ${result.unavailable}`);
  return result;
}

describe('computeSlotDetails', () => {
  it('gives the same total as the dashboard summary', () => {
    const slot = makeSlot();
    const d = slot.data;
    const expected = getTripTotal(buildSummary(d.couples, d.costs, d.globalMarkup, d.exchangeRates, d.targetCurrency));
    expect(expected).not.toBeNull();
    expect(details(slot).total).toBe(expected);
  });

  it('breaks the total down by cost type, with unknown and missing types in Other, and the bar sums to the total', () => {
    const result = details();
    expect(result.costTypes.map((share) => share.id).sort()).toEqual(['accommodation', 'food', 'other']);
    expect(result.costTypes.find((share) => share.id === 'other')?.color).toBeNull();
    expect(result.costTypes.find((share) => share.id === 'accommodation')?.color).toMatch(/^#/);
    const sum = result.costTypes.reduce((acc, share) => acc + share.amount, 0);
    expect(Math.abs(sum - result.total)).toBeLessThan(0.05);
    const percent = result.costTypes.reduce((acc, share) => acc + share.percent, 0);
    expect(Math.abs(percent - 100)).toBeLessThanOrEqual(2);
    expect(result.costTypes.map((share) => share.amount)).toEqual([...result.costTypes.map((share) => share.amount)].sort((a, b) => b - a));
  });

  it('treats a type that is not in the catalogue as Other', () => {
    const slot = makeSlot({}, {
      costs: [{ id: 'k1', name: 'Mystery', currency: 'USD', value: 50, markupOverride: 0, splitType: 'shared', assignedCoupleIds: [], sortOrder: 0, type: 'spaceflight' }],
    });
    expect(details(slot).costTypes).toEqual([{ id: 'other', color: null, amount: 50, percent: 100 }]);
  });

  it('counts entries, cached and overridden rates, markup, groups and travellers', () => {
    const result = details();
    expect(result.entryCount).toBe(3);
    expect(result.ratesCached).toBe(1);
    expect(result.ratesOverridden).toBe(1);
    expect(result.globalMarkup).toBe(10);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0]).toMatchObject({ name: 'Rivera family', colorIndex: 1, iconIndex: 1, nonPayingCount: 1 });
    expect(result.groups[1]).toMatchObject({ name: 'Okafor pair', nonPayingCount: 0 });
    expect(result.groups.reduce((sum, group) => sum + (group.grandTotal ?? 0), 0)).toBeCloseTo(result.total, 2);
    expect(result.nonPayingCount).toBe(1);
  });

  it('reports trip facts: nights from the dates, region, ID, schema and save time', () => {
    const result = details();
    expect(result).toMatchObject({
      startDate: '2026-10-08',
      endDate: '2026-10-21',
      nights: 13,
      region: 'Asia',
      tripId: '123456',
      schemaVersion: 1,
      savedAt: '2026-11-03T06:14:52.000Z',
    });
    expect(details(makeSlot({}, { tripStartDate: undefined, tripEndDate: undefined })).nights).toBeNull();
    expect(details(makeSlot({}, { tripEndDate: undefined })).nights).toBeNull();
  });

  it('is unavailable (schema) for another schema version, without touching the data', () => {
    expect(computeSlotDetails(makeSlot({ schemaVersion: 2 }))).toEqual({ unavailable: 'schema' });
  });

  it('is unavailable (rates) when a needed exchange rate is missing', () => {
    expect(computeSlotDetails(makeSlot({}, { exchangeRates: [] }))).toEqual({ unavailable: 'rates' });
  });

  it('is unavailable (rates) for a trip without groups', () => {
    expect(computeSlotDetails(makeSlot({}, { couples: [] }))).toEqual({ unavailable: 'rates' });
  });

  it('is unavailable (invalid) for corrupt data instead of throwing', () => {
    const corrupt = makeSlot();
    (corrupt.data as unknown as { costs: unknown }).costs = [null];
    expect(computeSlotDetails(corrupt)).toEqual({ unavailable: 'invalid' });
    const noCouples = makeSlot();
    (noCouples.data as unknown as { couples: unknown }).couples = undefined;
    expect(computeSlotDetails(noCouples)).toEqual({ unavailable: 'invalid' });
  });
});
