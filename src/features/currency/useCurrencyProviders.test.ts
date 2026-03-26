/// <reference types="vitest" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCurrencyProviders } from './currencyData';

const mockProvidersResponse = [
  {
    key: 'ECB',
    name: 'European Central Bank',
    data_url: 'https://ecb.europa.eu',
    currencies: ['EUR', 'USD', 'GBP'],
  },
  {
    key: 'BOC',
    name: 'Bank of Canada',
    data_url: 'https://bankofcanada.ca',
    currencies: ['CAD', 'USD'],
  },
];

describe('fetchCurrencyProviders', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes array response mapping data_url to url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProvidersResponse),
      }),
    );

    const result = await fetchCurrencyProviders();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      key: 'ECB',
      name: 'European Central Bank',
      url: 'https://ecb.europa.eu',
      currencies: ['EUR', 'USD', 'GBP'],
    });
    expect(result[1]?.url).toBe('https://bankofcanada.ca');
  });

  it('fetches from the correct v2 endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProvidersResponse),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchCurrencyProviders();

    expect(fetchMock).toHaveBeenCalledWith('https://api.frankfurter.dev/v2/providers');
  });

  it('preserves the currencies array per provider', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProvidersResponse),
      }),
    );

    const result = await fetchCurrencyProviders();

    expect(result[0]?.currencies).toContain('EUR');
    expect(result[1]?.currencies).toContain('CAD');
  });

  it('throws on a non-OK response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' }),
    );

    await expect(fetchCurrencyProviders()).rejects.toThrow('Frankfurter API error: 429');
  });
});
