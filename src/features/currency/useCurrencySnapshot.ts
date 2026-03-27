import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchCurrencySnapshot } from './currencyData';
import { getAvailableCurrencies } from '@/store/types';
import type { Region } from '@/store/types';

export function useCurrencySnapshot(baseCurrency: string, region: Region) {
  const quotes = getAvailableCurrencies(region).filter((c) => c !== baseCurrency);
  return useQuery({
    queryKey: ['currency', 'snapshot', baseCurrency, region],
    queryFn: () => fetchCurrencySnapshot(baseCurrency, quotes),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}
