import { useQuery } from '@tanstack/react-query';
import { fetchCurrencyProviders } from './currencyData';

export function useCurrencyProviders() {
  return useQuery({
    queryKey: ['currency', 'providers'],
    queryFn: fetchCurrencyProviders,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
