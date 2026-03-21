import { useQuery } from '@tanstack/react-query';
import { fetchCurrencySnapshot, type SupportedCurrency } from './currencyData';

export function useCurrencySnapshot(baseCurrency: SupportedCurrency) {
  return useQuery({
    queryKey: ['currency', 'snapshot', baseCurrency],
    queryFn: () => fetchCurrencySnapshot(baseCurrency),
    staleTime: 1000 * 60 * 5,
  });
}
