import { useQuery } from '@tanstack/react-query';
import { fetchClimateData, fetchGeocodingResults } from './forecastData';
import type { GeoLocation } from './forecastTypes';

export function useGeocode(query: string) {
  return useQuery({
    queryKey: ['forecast', 'geocode', query],
    queryFn: () => fetchGeocodingResults(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 60,
    placeholderData: [],
  });
}

export function useClimateData(location: GeoLocation | null, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['forecast', 'climate', location?.id, dateFrom, dateTo],
    queryFn: () => fetchClimateData(location!, dateFrom, dateTo),
    enabled: Boolean(location && dateFrom && dateTo),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
