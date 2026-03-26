/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCurrencyMetadata } from './currencyData';

const mockCurrenciesResponse = [
  { iso_code: 'EUR', name: 'Euro', symbol: '€' },
  { iso_code: 'USD', name: 'US Dollar', symbol: '$' },
  { iso_code: 'GBP', name: 'British Pound', symbol: '£' },
];

describe('fetchCurrencyMetadata', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes array response into a keyed record', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCurrenciesResponse),
      }),
    );

    const result = await fetchCurrencyMetadata();

    expect(result['EUR']).toEqual({ name: 'Euro', symbol: '€' });
    expect(result['USD']).toEqual({ name: 'US Dollar', symbol: '$' });
    expect(result['GBP']).toEqual({ name: 'British Pound', symbol: '£' });
  });

  it('fetches from the correct v2 endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCurrenciesResponse),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchCurrencyMetadata();

    expect(fetchMock).toHaveBeenCalledWith('https://api.frankfurter.dev/v2/currencies');
  });

  it('throws on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' }),
    );

    await expect(fetchCurrencyMetadata()).rejects.toThrow('Frankfurter API error: 503');
  });
});
