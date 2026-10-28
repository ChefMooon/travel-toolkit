import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGeocodingResults } from './forecastData';

describe('geocoding language', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('passes the explicit provider language without changing stable location IDs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 123, name: 'Montréal', latitude: 45.5, longitude: -73.5, country: 'Canada', country_code: 'CA' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchGeocodingResults('Montreal', 5, undefined, 'fr');

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('language=fr');
    expect(result[0]).toMatchObject({ id: 123, name: 'Montréal', lat: 45.5, lng: -73.5 });
  });
});
