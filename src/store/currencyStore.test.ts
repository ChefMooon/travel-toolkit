import { beforeEach, describe, expect, it } from 'vitest';
import { useCurrencyStore } from './currencyStore';

describe('useCurrencyStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCurrencyStore.setState({ region: 'Europe' });
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

  it('persists state to localStorage under mkt-currency-data', () => {
    useCurrencyStore.getState().setRegion('Oceania');
    const stored = JSON.parse(localStorage.getItem('mkt-currency-data') ?? '{}') as {
      state?: { region?: string };
    };
    expect(stored.state?.region).toBe('Oceania');
  });
});
