import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from './tripStore';
import { useToastStore } from './toastStore';
import {
  MAX_GROUPS,
  MAX_KIDS_PER_GROUP,
  MAX_COST_ENTRIES,
  MAX_TRIP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MAX_COST_NAME_LENGTH,
} from './types';

describe('tripStore — new actions', () => {
  beforeEach(() => {
    useTripStore.getState().resetTrip();
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
