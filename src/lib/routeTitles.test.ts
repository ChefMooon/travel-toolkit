import { describe, expect, it } from 'vitest';
import { getRouteTitle } from '@/lib/routeTitles';

describe('route titles', () => {
  it('returns the app title for the home route', () => {
    expect(getRouteTitle('/')).toBe('MKT');
  });

  it('returns friendly titles for tool routes', () => {
    expect(getRouteTitle('/trip')).toBe('MKT - Trip Cost');
    expect(getRouteTitle('/currency')).toBe('MKT - Currency Converter');
    expect(getRouteTitle('/timezone')).toBe('MKT - Timezone Tracker');
    expect(getRouteTitle('/forecast')).toBe('MKT - Destination Forecast');
  });

  it('falls back to the app title for unknown routes', () => {
    expect(getRouteTitle('/unknown')).toBe('MKT');
  });
});