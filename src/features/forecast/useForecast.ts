import { useQuery } from '@tanstack/react-query';
import { fetchClimateData, fetchGeocodingResults } from './forecastData';
import type { GeoLocation } from './forecastTypes';

export const FORECAST_GEOCODE_MIN_QUERY_LENGTH = 3;

export function useGeocode(query: string) {
  return useQuery({
    queryKey: ['forecast', 'geocode', query],
    queryFn: ({ signal }) => fetchGeocodingResults(query, 5, signal),
    enabled: query.trim().length >= FORECAST_GEOCODE_MIN_QUERY_LENGTH,
    staleTime: 1000 * 60 * 60,
    placeholderData: [],
    retry: 0,
  });
}

export function useClimateData(location: GeoLocation | null, dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['forecast', 'climate', location?.id, dateFrom, dateTo],
    queryFn: ({ signal }) => fetchClimateData(location!, dateFrom, dateTo, signal),
    enabled: Boolean(location && dateFrom && dateTo),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 0,
  });
}
