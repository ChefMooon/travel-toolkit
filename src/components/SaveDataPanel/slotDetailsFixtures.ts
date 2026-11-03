import { SAVE_SLOT_SCHEMA_VERSION, type SaveSlot, type TripSnapshot } from '@/store/types';

/** A two-group trip in JPY with three cost types, one non-paying traveller and a saved JPY rate. */
export function makeSnapshot(overrides: Partial<TripSnapshot> = {}): TripSnapshot {
  return {
    tripId: '123456',
    tripName: 'Kyoto in Autumn',
    globalMarkup: 10,
    couples: [
      { id: 'c1', name: 'Rivera family', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
      { id: 'c2', name: 'Okafor pair', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
    ],
    nonPayingTravellers: [{ id: 'n1', label: 'Sam', coupleId: 'c1' }],
    costs: [
      { id: 'k1', name: 'Hotel', currency: 'EUR', value: 400, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], sortOrder: 0, type: 'accommodation' },
      { id: 'k2', name: 'Dinner', currency: 'USD', value: 90, markupOverride: 0, splitType: 'subset', assignedCoupleIds: ['c1'], sortOrder: 1, type: 'food' },
      { id: 'k3', name: 'Souvenir', currency: 'USD', value: 30, markupOverride: null, splitType: 'individual', assignedCoupleIds: ['c2'], sortOrder: 2, type: null },
    ],
    exchangeRates: [
      { currency: 'EUR', rateToUSD: 1.1 },
      { currency: 'JPY', rateToUSD: 0.0065, isOverridden: true },
    ],
    region: 'Asia',
    tripStartDate: '2026-10-08',
    tripEndDate: '2026-10-21',
    targetCurrency: 'USD',
    ...overrides,
  };
}

export function makeSlot(overrides: Partial<SaveSlot> = {}, data: Partial<TripSnapshot> = {}): SaveSlot {
  const snapshot = makeSnapshot(data);
  return {
    slotIndex: 0,
    schemaVersion: SAVE_SLOT_SCHEMA_VERSION,
    label: 'Autumn',
    tripId: snapshot.tripId,
    tripName: snapshot.tripName,
    savedAt: '2026-11-03T06:14:52.000Z',
    coupleCount: snapshot.couples.length,
    costCount: snapshot.costs.length,
    targetCurrency: snapshot.targetCurrency,
    data: snapshot,
    ...overrides,
  };
}
