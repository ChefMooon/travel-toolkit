import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activateLanguage } from '@/i18n';
import { useGeocode } from './useForecast';

describe('geocoding query locale identity', () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    await activateLanguage('en');
  });

  it('fetches separately for English and French while keeping provider IDs stable', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const language = url.searchParams.get('language');
      return {
        ok: true,
        json: async () => ({ results: [{ id: 123, name: language === 'fr' ? 'Montréal' : 'Montreal', latitude: 45.5, longitude: -73.5, country: 'Canada', country_code: 'CA' }] }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result, unmount } = renderHook(() => useGeocode('Mon'), { wrapper });

    try {
      await waitFor(() => expect(result.current.data?.[0]?.name).toBe('Montreal'));
      expect(result.current.data?.[0]?.id).toBe(123);

      await act(async () => { await activateLanguage('fr-CA'); });
      await waitFor(() => expect(result.current.data?.[0]?.name).toBe('Montréal'));
      expect(result.current.data?.[0]?.id).toBe(123);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams.get('language'))).toEqual(['en', 'fr']);
      expect(queryClient.getQueryCache().findAll({ queryKey: ['forecast', 'geocode'] }).map((query) => query.queryKey)).toEqual([
        ['forecast', 'geocode', 'en', 'Mon'],
        ['forecast', 'geocode', 'fr', 'Mon'],
      ]);
    } finally {
      unmount();
      queryClient.clear();
    }
  });
});
