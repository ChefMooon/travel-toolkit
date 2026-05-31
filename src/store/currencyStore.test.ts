import { beforeEach, describe, expect, it } from 'vitest';
import { useCurrencyStore } from './currencyStore';

describe('useCurrencyStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCurrencyStore.setState({ region: 'Europe', amount: '100', baseCurrency: 'EUR', targetCurrency: 'USD' });
  });

  it('has initial region of Europe', () => {
    expect(useCurrencyStore.getState().region).toBe('Europe');
  });

  it('setRegion updates the region', () => {
    useCurrencyStore.getState().setRegion('Asia');
    expect(useCurrencyStore.getState().region).toBe('Asia');
  });

  it('setRegion accepts all valid regions', () => {
    const regions = ['North America', 'Europe', 'Asia', 'Oceania', 'Americas', 'Africa'] as const;
    for (const region of regions) {
      useCurrencyStore.getState().setRegion(region);
      expect(useCurrencyStore.getState().region).toBe(region);
    }
  });

  it('persists state to localStorage under travel-toolkit-currency-data', () => {
    useCurrencyStore.getState().setRegion('Oceania');
    const stored = JSON.parse(localStorage.getItem('travel-toolkit-currency-data') ?? '{}') as {
      state?: { region?: string };
    };
    expect(stored.state?.region).toBe('Oceania');
  });

  it('has initial amount of 100', () => {
    expect(useCurrencyStore.getState().amount).toBe('100');
  });

  it('setAmount updates amount and persists to localStorage', () => {
    useCurrencyStore.getState().setAmount('250');
    expect(useCurrencyStore.getState().amount).toBe('250');
    const stored = JSON.parse(localStorage.getItem('travel-toolkit-currency-data') ?? '{}') as {
      state?: { amount?: string };
    };
    expect(stored.state?.amount).toBe('250');
  });

  it('has initial baseCurrency of EUR', () => {
    expect(useCurrencyStore.getState().baseCurrency).toBe('EUR');
  });

  it('setBaseCurrency updates baseCurrency and persists to localStorage', () => {
    useCurrencyStore.getState().setBaseCurrency('GBP');
    expect(useCurrencyStore.getState().baseCurrency).toBe('GBP');
    const stored = JSON.parse(localStorage.getItem('travel-toolkit-currency-data') ?? '{}') as {
      state?: { baseCurrency?: string };
    };
    expect(stored.state?.baseCurrency).toBe('GBP');
  });

  it('has initial targetCurrency of USD', () => {
    expect(useCurrencyStore.getState().targetCurrency).toBe('USD');
  });

  it('setTargetCurrency updates targetCurrency and persists to localStorage', () => {
    useCurrencyStore.getState().setTargetCurrency('JPY');
    expect(useCurrencyStore.getState().targetCurrency).toBe('JPY');
    const stored = JSON.parse(localStorage.getItem('travel-toolkit-currency-data') ?? '{}') as {
      state?: { targetCurrency?: string };
    };
    expect(stored.state?.targetCurrency).toBe('JPY');
  });
});
