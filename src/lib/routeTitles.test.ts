import { describe, expect, it } from 'vitest';
import { getRouteTitle } from '@/lib/routeTitles';

describe('route titles', () => {
  it('returns the app title for the home route', () => {
    expect(getRouteTitle('/')).toBe('Travel Toolkit');
  });

  it('returns friendly titles for tool routes', () => {
    expect(getRouteTitle('/trip')).toBe('Travel Toolkit - Trip Cost');
    expect(getRouteTitle('/currency')).toBe('Travel Toolkit - Currency Converter');
    expect(getRouteTitle('/timezone')).toBe('Travel Toolkit - Timezone Tracker');
    expect(getRouteTitle('/forecast')).toBe('Travel Toolkit - Destination Forecast');
  });

  it('falls back to the app title for unknown routes', () => {
    expect(getRouteTitle('/unknown')).toBe('Travel Toolkit');
  });
});