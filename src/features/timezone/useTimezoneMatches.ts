import { useQuery } from '@tanstack/react-query';
import { fetchTimezoneMatches } from './timezoneData';

export function useTimezoneMatches(searchTerm: string) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  return useQuery({
    queryKey: ['timezone', 'matches', normalizedSearchTerm],
    queryFn: () => fetchTimezoneMatches(normalizedSearchTerm),
    staleTime: 1000 * 60 * 5,
  });
}
