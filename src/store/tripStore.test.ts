import { describe, it, expect, beforeEach } from 'vitest';
import { useTripStore } from './tripStore';

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
