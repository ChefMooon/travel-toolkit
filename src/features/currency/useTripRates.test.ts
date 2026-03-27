/// <reference types="vitest" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTripRates } from './useTripRates';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('./currencyData', () => ({
  fetchCurrencySnapshot: vi.fn(),
}));

vi.mock('@/store/types', () => ({
  getAvailableCurrencies: vi.fn(() => ['CAD', 'EUR', 'GBP', 'USD']),
}));

import { useQuery } from '@tanstack/react-query';
import { fetchCurrencySnapshot } from './currencyData';

describe('useTripRates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({});
  });

  it('uses the shared query key matching useCurrencySnapshot with base=USD', async () => {
    useTripRates('Europe');

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['currency', 'snapshot', 'USD', 'Europe'],
        staleTime: 1000 * 60 * 5,
        refetchInterval: 1000 * 60 * 5,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
      }),
    );
  });

  it('fetches region currencies minus USD', async () => {
    useTripRates('Europe');

    const queryOptions = (useQuery as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    await queryOptions.queryFn();

    // getAvailableCurrencies returns ['CAD','EUR','GBP','USD']; USD excluded
    expect(fetchCurrencySnapshot).toHaveBeenCalledWith('USD', ['CAD', 'EUR', 'GBP']);
  });

  it('exposes loading state while fetch is in-flight', () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ isPending: true });
    const result = useTripRates('Europe');
    expect((result as { isPending?: boolean }).isPending).toBe(true);
  });

  it('exposes error state on fetch failure', () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({ isError: true });
    const result = useTripRates('Europe');
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});
