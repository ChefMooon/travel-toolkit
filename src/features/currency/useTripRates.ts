import { useQuery } from '@tanstack/react-query';
import { fetchCurrencySnapshot } from './currencyData';
import { getAvailableCurrencies } from '@/store/types';
import type { Region } from '@/store/types';

export function useTripRates(region: Region) {
  const quotes = getAvailableCurrencies(region).filter((c) => c !== 'USD');
  return useQuery({
    queryKey: ['currency', 'snapshot', 'USD', region],
    queryFn: () => fetchCurrencySnapshot('USD', quotes),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
