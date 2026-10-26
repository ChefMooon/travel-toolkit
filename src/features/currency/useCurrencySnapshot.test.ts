/// <reference types="vitest" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCurrencySnapshot } from './useCurrencySnapshot';

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('./currencyData', () => ({
  fetchCurrencySnapshot: vi.fn(),
}));

vi.mock('@/store/types', () => ({
  getAvailableCurrencies: vi.fn(() => ['CAD', 'EUR', 'GBP', 'USD']),
}));

import { useQuery } from '@tanstack/react-query';
import { fetchCurrencySnapshot } from './currencyData';

describe('useCurrencySnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({});
  });

  it('configures a 5 minute polling interval for the currency snapshot query', async () => {
    useCurrencySnapshot('USD', 'Europe');

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['currency', 'snapshot', 'USD', 'Europe'],
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 5,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
      }),
    );

    expect((useQuery as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).not.toHaveProperty('placeholderData');

    const queryOptions = (useQuery as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    await queryOptions.queryFn();

    expect(fetchCurrencySnapshot).toHaveBeenCalledWith('USD', ['CAD', 'EUR', 'GBP']);
  });
});
