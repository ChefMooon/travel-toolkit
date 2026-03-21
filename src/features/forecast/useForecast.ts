import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from './forecastData';

export function useForecast(destination: string) {
  return useQuery({
    queryKey: ['forecast', destination],
    queryFn: () => fetchForecast(destination),
    staleTime: 1000 * 60 * 5,
  });
}
