import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from './tripStore';
import { useSettingsStore } from './settingsStore';
import { useToastStore } from './toastStore';
import { useSaveSlotStore } from './saveSlotStore';
import { activateLanguage } from '@/i18n';
import {
  MAX_GROUPS,
  MAX_KIDS_PER_GROUP,
  MAX_COST_ENTRIES,
  MAX_TRIP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MAX_COST_NAME_LENGTH,
  type TripSnapshot,
} from './types';

describe('tripStore — new actions', () => {
  beforeEach(() => {
    useTripStore.getState().resetTrip();
    useTripStore.getState().markClean();
    useSaveSlotStore.setState({ slots: [null, null, null], labels: ['Slot 1', 'Slot 2', 'Slot 3'] });
    useToastStore.getState().clearToasts();
    });

    describe('trip id and dirty state', () => {
    it('creates localized validation warnings in the active language', async () => {
      await activateLanguage('fr-CA');
      try {
        const previous = useTripStore.getState().tripId;
        useTripStore.getState().setTripId('bad');
        expect(useTripStore.getState().tripId).toBe(previous);
        const toasts = useToastStore.getState().toasts;
        expect(toasts[toasts.length - 1]).toMatchObject({ title: 'L’identifiant du voyage doit comporter 6 chiffres', message: 'Saisissez un identifiant numérique comme 123456.' });
      } finally { await activateLanguage('en'); }
    });
    it('setTripId accepts a valid 6-digit value', () => {
      useTripStore.getState().setTripId('123456');
      expect(useTripStore.getState().tripId).toBe('123456');
    });

    it('setTripId rejects invalid formats and raises warning toast', () => {
      const prevId = useTripStore.getState().tripId;
      useTripStore.getState().setTripId('12ab');
      expect(useTripStore.getState().tripId).toBe(prevId);
      const toasts = useToastStore.getState().toasts;
      expect(toasts[toasts.length - 1]?.title).toBe('Trip ID must be 6 digits');
    });

    it('setTripId rejects duplicates already stored in save slots', () => {
      useSaveSlotStore.setState({
        slots: [
          {
            slotIndex: 0,
            schemaVersion: 1,
            label: 'Slot 1',
            tripId: '222222',
            tripName: 'Saved Trip',
            savedAt: new Date().toISOString(),
            coupleCount: 0,
            costCount: 0,
            targetCurrency: 'USD',
            data: {
              tripId: '222222',
              tripName: 'Saved Trip',
              globalMarkup: 66,
              couples: [],
              nonPayingTravellers: [],
              costs: [],
              exchangeRates: [],
              region: 'Europe',
              targetCurrency: 'USD',
            },
          },
          null,
          null,
        ],
      });

      const prevId = useTripStore.getState().tripId;
      useTripStore.getState().setTripId('222222');

      expect(useTripStore.getState().tripId).toBe(prevId);
      const toasts = useToastStore.getState().toasts;
      expect(toasts[toasts.length - 1]?.title).toBe('Duplicate trip ID');
    });

    it('keeps legacy theme out of snapshots, loaded state, and persisted trip data', () => {
      useSettingsStore.getState().setThemePreference('system');
      const legacySnapshot = {
        ...useTripStore.getState().getSnapshot(),
        tripName: 'Legacy trip',
        theme: 'dark',
      } as TripSnapshot;

      useTripStore.getState().loadSnapshot(legacySnapshot);

      expect(useSettingsStore.getState().themePreference).toBe('system');
      expect(useTripStore.getState().getSnapshot()).not.toHaveProperty('theme');
      expect(useTripStore.getState()).not.toHaveProperty('theme');
      expect(JSON.parse(localStorage.getItem('travel-toolkit-trip-data') ?? '{}').state).not.toHaveProperty('theme');

      useTripStore.getState().resetTrip();
      expect(useSettingsStore.getState().themePreference).toBe('system');
      expect(useTripStore.getState()).not.toHaveProperty('theme');
      expect(useTripStore.getState().getSnapshot()).not.toHaveProperty('theme');
    });

    it('strips legacy trip theme during persisted-state rehydration without losing trip data', () => {
      const currentState = useTripStore.getState().getSnapshot();
      localStorage.setItem('travel-toolkit-trip-data', JSON.stringify({
        state: { ...currentState, tripName: 'Migrated trip', theme: 'dark' },
        version: 0,
      }));

      useTripStore.persist.rehydrate();

      expect(useTripStore.getState().tripName).toBe('Migrated trip');
      expect(useTripStore.getState()).not.toHaveProperty('theme');
      expect(JSON.parse(localStorage.getItem('travel-toolkit-trip-data') ?? '{}').state).not.toHaveProperty('theme');
    });

    it('markClean resets isDirty to false', () => {
      useTripStore.getState().setTripName('Changed');
      expect(useTripStore.getState().isDirty).toBe(true);
      useTripStore.getState().markClean();
      expect(useTripStore.getState().isDirty).toBe(false);
    });
  });

  describe('setTargetCurrency', () => {
    it('sets targetCurrency without mutating couples', () => {
      useTripStore.getState().addCouple('Couple A');
      useTripStore.getState().setTargetCurrency('EUR');
      const state = useTripStore.getState();
      expect(state.targetCurrency).toBe('EUR');
      expect(state.couples).toHaveLength(1);
    });
  });

  describe('undo and redo history', () => {
    it('rejects invalid date pairs atomically', () => {
      useTripStore.getState().setTripDates('2027-02-30', '2027-03-01');
      expect(useTripStore.getState().tripStartDate).toBe('');
      expect(useTripStore.getState().tripEndDate).toBe('');
      useTripStore.getState().setTripDates('2027-03-02', '2027-03-01');
      expect(useTripStore.getState().tripStartDate).toBe('');
      expect(useTripStore.getState().tripEndDate).toBe('');
    });
    it('tracks trip dates in snapshots and undo/redo history', () => {
      useTripStore.getState().setTripDates('2027-03-04', '2027-03-04');
      expect(useTripStore.getState().getSnapshot()).toMatchObject({ tripStartDate: '2027-03-04', tripEndDate: '2027-03-04' });
      useTripStore.getState().undo();
      expect(useTripStore.getState().tripStartDate).toBe('');
      useTripStore.getState().redo();
      expect(useTripStore.getState().tripEndDate).toBe('2027-03-04');
    });
    it('undoes and redoes edits, returning to the saved clean baseline', () => {
      useTripStore.getState().setTripName('First edit');
      expect(useTripStore.getState().canUndo).toBe(true);
      useTripStore.getState().markClean();
      useTripStore.getState().setTripName('Second edit');
      expect(useTripStore.getState().isDirty).toBe(true);
      useTripStore.getState().undo();
      expect(useTripStore.getState().tripName).toBe('First edit');
      expect(useTripStore.getState().isDirty).toBe(false);
      useTripStore.getState().redo();
      expect(useTripStore.getState().tripName).toBe('Second edit');
      expect(useTripStore.getState().isDirty).toBe(true);
    });

    it('clears redo after a new edit and starts clean history after load/reset', () => {
      useTripStore.getState().setTripName('One');
      useTripStore.getState().setTripName('Two');
      useTripStore.getState().undo();
      useTripStore.getState().setTripName('Three');
      expect(useTripStore.getState().canRedo).toBe(false);
      useTripStore.getState().loadSnapshot(useTripStore.getState().getSnapshot());
      expect(useTripStore.getState().canUndo).toBe(false);
      expect(useTripStore.getState().isDirty).toBe(false);
      useTripStore.getState().resetTrip();
      expect(useTripStore.getState().canUndo).toBe(false);
      expect(useTripStore.getState().canRedo).toBe(false);
    });

    it('does not add automatic exchange-rate hydration to history or dirty state', () => {
      useTripStore.getState().markClean();
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.9 });
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(useTripStore.getState().canUndo).toBe(false);
    });

    it('ignores fetched rate changes in saved history and recalculates dirty state at the baseline', () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.9 });
      useTripStore.getState().markClean();
      useTripStore.getState().setTripName('Changed');
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.8 });
      useTripStore.getState().undo();
      expect(useTripStore.getState().tripName).toBe('My Trip');
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(useTripStore.getState().exchangeRates.find((rate) => rate.currency === 'EUR')?.rateToUSD).toBeCloseTo(1 / 0.8);
      useTripStore.getState().setTripName('Changed');
      useTripStore.getState().setTripName('My Trip');
      expect(useTripStore.getState().isDirty).toBe(false);
    });

    it('restores exchange-rate overrides without duplicating a currency', () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.9 });
      useTripStore.getState().markClean();
      useTripStore.getState().setExchangeRate('EUR', 1.5);
      useTripStore.getState().undo();
      expect(useTripStore.getState().exchangeRates.filter((rate) => rate.currency === 'EUR')).toHaveLength(1);
      expect(useTripStore.getState().exchangeRates.find((rate) => rate.currency === 'EUR')?.isOverridden).toBe(false);
      useTripStore.getState().redo();
      expect(useTripStore.getState().exchangeRates.filter((rate) => rate.currency === 'EUR')).toHaveLength(1);
      expect(useTripStore.getState().exchangeRates.find((rate) => rate.currency === 'EUR')?.rateToUSD).toBe(1.5);
    });

    it('clears dirty state when a nested edit returns to its saved value', () => {
      const coupleId = useTripStore.getState().addCouple('Group A');
      useTripStore.getState().addCost({ name: 'Train', currency: 'EUR', value: 10, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], type: null });
      useTripStore.getState().markClean();
      useTripStore.getState().renameCouple(coupleId, 'Group B');
      const costId = useTripStore.getState().costs[0]!.id;
      useTripStore.getState().editCost(costId, { name: 'Flight' });
      expect(useTripStore.getState().isDirty).toBe(true);
      useTripStore.getState().editCost(costId, { name: 'Train' });
      useTripStore.getState().renameCouple(coupleId, 'Group A');
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(useTripStore.getState().canUndo).toBe(true);
    });

    it('does not create history or retain dirty state for semantic no-op array updates', () => {
      useTripStore.getState().addCouple('Group A');
      useTripStore.getState().markClean();
      const canUndoBeforeNoOp = useTripStore.getState().canUndo;
      useTripStore.getState().renameCouple('missing-id', 'No change');
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(useTripStore.getState().canUndo).toBe(canUndoBeforeNoOp);
    });

    it('keeps transient undo and redo availability out of persisted trip data', () => {
      useTripStore.getState().setTripName('Changed');
      const persisted = JSON.parse(localStorage.getItem('travel-toolkit-trip-data') ?? '{}').state;
      expect(persisted).not.toHaveProperty('canUndo');
      expect(persisted).not.toHaveProperty('canRedo');
    });
  });

  describe('hydrateExchangeRates', () => {
    it('inverts incoming rate and stores rateToUSD', () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate).toBeDefined();
      expect(rate!.rateToUSD).toBeCloseTo(1 / 0.91, 5);
    });

    it('skips currencies where isOverridden is true', () => {
      useTripStore.getState().setExchangeRate('EUR', 1.5); // marks as overridden
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate!.rateToUSD).toBe(1.5); // unchanged
    });

    it('inserts new currencies not yet in store with isOverridden: false', () => {
      useTripStore.getState().hydrateExchangeRates({ GBP: 0.77 });
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'GBP');
      expect(rate).toBeDefined();
      expect(rate!.isOverridden).toBe(false);
    });

    it('does not insert a USD entry', () => {
      useTripStore.getState().hydrateExchangeRates({ USD: 1, EUR: 0.91 });
      const usdRate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'USD');
      expect(usdRate).toBeUndefined();
    });

    it('updates existing non-overridden rate', () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.85 });
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate!.rateToUSD).toBeCloseTo(1 / 0.85, 5);
    });
  });

  describe('setExchangeRate (updated)', () => {
    it('sets isOverridden: true on stored entry', () => {
      useTripStore.getState().setExchangeRate('EUR', 1.25);
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate!.isOverridden).toBe(true);
      expect(rate!.rateToUSD).toBe(1.25);
    });

    it('updates existing rate and marks as overridden', () => {
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      useTripStore.getState().setExchangeRate('EUR', 1.5);
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate!.rateToUSD).toBe(1.5);
      expect(rate!.isOverridden).toBe(true);
    });
  });

  describe('clearExchangeRateOverride', () => {
    it('sets isOverridden to false', () => {
      useTripStore.getState().setExchangeRate('EUR', 1.5);
      useTripStore.getState().clearExchangeRateOverride('EUR');
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate!.isOverridden).toBe(false);
    });

    it('subsequent hydrateExchangeRates call overwrites the rate after override cleared', () => {
      useTripStore.getState().setExchangeRate('EUR', 1.5);
      useTripStore.getState().clearExchangeRateOverride('EUR');
      useTripStore.getState().hydrateExchangeRates({ EUR: 0.91 });
      const rate = useTripStore.getState().exchangeRates.find((r) => r.currency === 'EUR');
      expect(rate!.rateToUSD).toBeCloseTo(1 / 0.91, 5);
    });
  });

  describe('resetTrip', () => {
    it('resets targetCurrency to USD', () => {
      useTripStore.getState().setTargetCurrency('EUR');
      useTripStore.getState().resetTrip();
      expect(useTripStore.getState().targetCurrency).toBe('USD');
    });

    it('uses the current preferred currency for a new trip and selects a supporting region', () => {
      useSettingsStore.getState().setPreferredRegion(null);
      useSettingsStore.getState().setPreferredCurrency('JPY');
      useTripStore.getState().resetTrip();
      expect(useTripStore.getState()).toMatchObject({ region: 'Asia', targetCurrency: 'JPY' });
      useSettingsStore.getState().setPreferredCurrency('USD');
    });

    it('uses the selected preferred region and falls back to its default currency when needed', () => {
      useSettingsStore.getState().setPreferredRegion('Asia');
      useSettingsStore.getState().setPreferredCurrency('EUR');
      useTripStore.getState().resetTrip();
      expect(useTripStore.getState()).toMatchObject({ region: 'Asia', targetCurrency: 'HKD' });
      useSettingsStore.getState().setPreferredCurrency('USD');
      useSettingsStore.getState().setPreferredRegion(null);
    });

    it('refreshes the ledger identity revision on reset and snapshot load', () => {
      const initialRevision = useTripStore.getState().tripIdentityRevision;
      const snapshot = useTripStore.getState().getSnapshot();
      useTripStore.getState().loadSnapshot(snapshot);
      expect(useTripStore.getState().tripIdentityRevision).toBe(initialRevision + 1);
      useTripStore.getState().resetTrip();
      expect(useTripStore.getState().tripIdentityRevision).toBe(initialRevision + 2);
    });
  });
});

describe('tripStore — hard limits', () => {
  beforeEach(() => {
    useTripStore.getState().resetTrip();
    useToastStore.getState().clearToasts();
  });

  describe('addCouple — MAX_GROUPS', () => {
    it('allows adding up to MAX_GROUPS groups', () => {
      for (let i = 0; i < MAX_GROUPS; i++) {
        useTripStore.getState().addCouple();
      }
      expect(useTripStore.getState().couples).toHaveLength(MAX_GROUPS);
    });

    it('does not add a group beyond MAX_GROUPS', () => {
      for (let i = 0; i < MAX_GROUPS; i++) {
        useTripStore.getState().addCouple();
      }
      useTripStore.getState().addCouple();
      expect(useTripStore.getState().couples).toHaveLength(MAX_GROUPS);
    });

    it('fires a warning toast when group limit is hit', () => {
      for (let i = 0; i < MAX_GROUPS; i++) {
        useTripStore.getState().addCouple();
      }
      useTripStore.getState().addCouple();
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]!.type).toBe('warning');
      expect(toasts[0]!.title).toBe('Group limit reached');
    });
  });

  describe('addNonPayingTraveller — MAX_KIDS_PER_GROUP', () => {
    it('allows adding up to MAX_KIDS_PER_GROUP children per group', () => {
      const id = useTripStore.getState().addCouple();
      for (let i = 0; i < MAX_KIDS_PER_GROUP; i++) {
        useTripStore.getState().addNonPayingTraveller(id);
      }
      const kids = useTripStore.getState().nonPayingTravellers.filter((t) => t.coupleId === id);
      expect(kids).toHaveLength(MAX_KIDS_PER_GROUP);
    });

    it('does not add a child beyond MAX_KIDS_PER_GROUP for a group', () => {
      const id = useTripStore.getState().addCouple();
      for (let i = 0; i < MAX_KIDS_PER_GROUP; i++) {
        useTripStore.getState().addNonPayingTraveller(id);
      }
      useTripStore.getState().addNonPayingTraveller(id);
      const kids = useTripStore.getState().nonPayingTravellers.filter((t) => t.coupleId === id);
      expect(kids).toHaveLength(MAX_KIDS_PER_GROUP);
    });

    it('fires a warning toast when child limit is hit', () => {
      const id = useTripStore.getState().addCouple();
      for (let i = 0; i < MAX_KIDS_PER_GROUP; i++) {
        useTripStore.getState().addNonPayingTraveller(id);
      }
      useTripStore.getState().addNonPayingTraveller(id);
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]!.type).toBe('warning');
      expect(toasts[0]!.title).toBe('Child limit reached');
    });

    it('enforces limit per group, not globally', () => {
      const id1 = useTripStore.getState().addCouple();
      const id2 = useTripStore.getState().addCouple();
      for (let i = 0; i < MAX_KIDS_PER_GROUP; i++) {
        useTripStore.getState().addNonPayingTraveller(id1);
      }
      useTripStore.getState().addNonPayingTraveller(id2);
      const kids2 = useTripStore.getState().nonPayingTravellers.filter((t) => t.coupleId === id2);
      expect(kids2).toHaveLength(1);
    });
  });

  describe('addCost — MAX_COST_ENTRIES', () => {
    const baseCost = {
      name: 'Test',
      currency: 'USD',
      value: 10,
      markupOverride: null,
      splitType: 'shared' as const,
      assignedCoupleIds: [],
      type: null,
    };

    it('allows adding up to MAX_COST_ENTRIES cost entries', () => {
      for (let i = 0; i < MAX_COST_ENTRIES; i++) {
        useTripStore.getState().addCost(baseCost);
      }
      expect(useTripStore.getState().costs).toHaveLength(MAX_COST_ENTRIES);
    });

    it('does not add a cost entry beyond MAX_COST_ENTRIES', () => {
      for (let i = 0; i < MAX_COST_ENTRIES; i++) {
        useTripStore.getState().addCost(baseCost);
      }
      useTripStore.getState().addCost(baseCost);
      expect(useTripStore.getState().costs).toHaveLength(MAX_COST_ENTRIES);
    });

    it('fires a warning toast when cost entry limit is hit', () => {
      for (let i = 0; i < MAX_COST_ENTRIES; i++) {
        useTripStore.getState().addCost(baseCost);
      }
      useTripStore.getState().addCost(baseCost);
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]!.type).toBe('warning');
      expect(toasts[0]!.title).toBe('Cost entry limit reached');
    });
  });

  describe('duplicateCost', () => {
    it('copies a cost with a fresh ID and inserts it after the source', () => {
      const addCost = useTripStore.getState().addCost;
      addCost({
        name: 'Before',
        currency: 'USD',
        value: 10,
        markupOverride: null,
        splitType: 'shared',
        assignedCoupleIds: [],
      });
      addCost({
        name: 'Stay',
        currency: 'EUR',
        value: 120.5,
        markupOverride: 17,
        splitType: 'subset',
        assignedCoupleIds: ['couple-a', 'couple-b'],
        type: 'accommodation',
      });
      addCost({
        name: 'After',
        currency: 'JPY',
        value: 50,
        markupOverride: null,
        splitType: 'individual',
        assignedCoupleIds: ['couple-c'],
      });

      const originalCosts = useTripStore.getState().costs;
      const source = originalCosts[1]!;
      const originalOrder = originalCosts.map((cost) => cost.id);
      useTripStore.getState().markClean();

      useTripStore.getState().duplicateCost(source.id);

      const state = useTripStore.getState();
      const orderedCosts = [...state.costs].sort((a, b) => a.sortOrder - b.sortOrder);
      const duplicate = orderedCosts[2]!;
      expect(duplicate).toMatchObject({
        name: 'Stay',
        currency: 'EUR',
        value: 120.5,
        markupOverride: 17,
        splitType: 'subset',
        assignedCoupleIds: ['couple-a', 'couple-b'],
        type: 'accommodation',
      });
      expect(duplicate.id).not.toBe(source.id);
      expect(duplicate.assignedCoupleIds).not.toBe(source.assignedCoupleIds);
      expect(orderedCosts.map((cost) => cost.id)).toEqual([
        originalOrder[0],
        source.id,
        duplicate.id,
        originalOrder[2],
      ]);
      expect(orderedCosts.map((cost) => cost.sortOrder)).toEqual([0, 1, 2, 3]);
      expect(state.isDirty).toBe(true);
    });

    it('does not duplicate beyond MAX_COST_ENTRIES and emits the existing warning', () => {
      const cost = {
        name: 'Test',
        currency: 'USD',
        value: 10,
        markupOverride: null,
        splitType: 'shared' as const,
        assignedCoupleIds: [],
      };
      for (let i = 0; i < MAX_COST_ENTRIES; i++) {
        useTripStore.getState().addCost(cost);
      }
      useTripStore.getState().markClean();

      const sourceId = useTripStore.getState().costs[0]!.id;
      useTripStore.getState().duplicateCost(sourceId);

      expect(useTripStore.getState().costs).toHaveLength(MAX_COST_ENTRIES);
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(useToastStore.getState().toasts).toMatchObject([
        {
          type: 'warning',
          title: 'Cost entry limit reached',
        },
      ]);
    });
  });

  describe('deleteCosts', () => {
    it('removes all matching cost entries in one action', () => {
      useTripStore.getState().addCost({ name: 'Hotel', currency: 'USD', value: 50, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], type: null });
      useTripStore.getState().addCost({ name: 'Taxi', currency: 'USD', value: 20, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], type: null });
      useTripStore.getState().addCost({ name: 'Lunch', currency: 'USD', value: 15, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], type: null });

      const costs = useTripStore.getState().costs;
      useTripStore.getState().markClean();
      useTripStore.getState().deleteCosts([costs[0]!.id, costs[2]!.id]);

      expect(useTripStore.getState().costs.map((cost) => cost.name)).toEqual(['Taxi']);
      expect(useTripStore.getState().isDirty).toBe(true);
    });

    it('ignores an empty bulk delete request', () => {
      useTripStore.getState().addCost({ name: 'Hotel', currency: 'USD', value: 50, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], type: null });
      useTripStore.getState().markClean();

      useTripStore.getState().deleteCosts([]);

      expect(useTripStore.getState().costs).toHaveLength(1);
      expect(useTripStore.getState().isDirty).toBe(false);
    });
  });

  describe('string length truncation', () => {
    it('setTripName truncates at MAX_TRIP_NAME_LENGTH', () => {
      const long = 'x'.repeat(MAX_TRIP_NAME_LENGTH + 20);
      useTripStore.getState().setTripName(long);
      expect(useTripStore.getState().tripName).toHaveLength(MAX_TRIP_NAME_LENGTH);
    });

    it('renameCouple truncates at MAX_GROUP_NAME_LENGTH', () => {
      const id = useTripStore.getState().addCouple();
      const long = 'x'.repeat(MAX_GROUP_NAME_LENGTH + 20);
      useTripStore.getState().renameCouple(id, long);
      const couple = useTripStore.getState().couples.find((c) => c.id === id)!;
      expect(couple.name).toHaveLength(MAX_GROUP_NAME_LENGTH);
    });

    it('addCost truncates name at MAX_COST_NAME_LENGTH', () => {
      const long = 'x'.repeat(MAX_COST_NAME_LENGTH + 20);
      useTripStore.getState().addCost({ name: long, currency: 'USD', value: 5, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], type: null });
      expect(useTripStore.getState().costs[0]!.name).toHaveLength(MAX_COST_NAME_LENGTH);
    });

    it('editCost truncates name at MAX_COST_NAME_LENGTH', () => {
      useTripStore.getState().addCost({ name: 'Original', currency: 'USD', value: 5, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], type: null });
      const id = useTripStore.getState().costs[0]!.id;
      const long = 'x'.repeat(MAX_COST_NAME_LENGTH + 20);
      useTripStore.getState().editCost(id, { name: long });
      expect(useTripStore.getState().costs[0]!.name).toHaveLength(MAX_COST_NAME_LENGTH);
    });
  });
});
