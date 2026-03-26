import { useQuery } from '@tanstack/react-query';
import { fetchCurrencyMetadata } from './currencyData';

export function useCurrencyMetadata() {
  return useQuery({
    queryKey: ['currency', 'metadata'],
    queryFn: fetchCurrencyMetadata,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
