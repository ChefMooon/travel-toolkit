/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ForecastTool from '@/features/forecast/ForecastTool';
import type { ClimateSummary, GeoLocation } from '@/features/forecast/forecastTypes';

vi.mock('@/features/forecast/useForecast', () => ({
  useGeocode: vi.fn(),
  useClimateData: vi.fn(),
}));

import { useGeocode, useClimateData } from '@/features/forecast/useForecast';

const mockLocation: GeoLocation = {
  id: 1,
  name: 'barcelona',
  country: 'Spain',
  countryCode: 'ES',
  admin1: 'Catalonia',
  lat: 41.38,
  lng: 2.17,
  timezone: 'Europe/Madrid',
  population: 1620000,
  displayName: 'Barcelona, Catalonia, Spain',
};

const mockClimateSummary: ClimateSummary = {
  location: mockLocation,
  dateFrom: '2026-03-23',
  dateTo: '2026-03-30',
  avgHighC: 18.5,
  avgLowC: 10.2,
  avgMeanC: 14.3,
  avgPrecipitationMm: 2.1,
  avgRainMm: 2.1,
  avgSnowfallCm: 0,
  precipitationDisplay: 'rain',
  avgSunshineDurationHrs: 6.4,
  avgDaylightDurationHrs: 12.0,
  avgWindspeedMaxKmh: 18.0,
  days: [],
};

const emptyGeoQuery = { data: [], isPending: false, isError: false };
const errorGeoQuery = { data: [], isPending: false, isError: true };
const readyGeoQuery = { data: [mockLocation], isPending: false, isError: false };

const pendingClimateQuery = { data: undefined, isPending: true, isError: false, refetch: vi.fn() };
const readyClimateQuery = { data: mockClimateSummary, isPending: false, isError: false, refetch: vi.fn() };

/** Helper: select the first geocode suggestion via ArrowDown + Enter */
function selectFirstSuggestion() {
  const searchInput = screen.getByLabelText('Search destination');
  fireEvent.change(searchInput, { target: { value: 'Bar' } });
  fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
  fireEvent.keyDown(searchInput, { key: 'Enter' });
  return searchInput;
}

describe('ForecastTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom does not implement scrollIntoView; mock it to prevent errors
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    (useGeocode as ReturnType<typeof vi.fn>).mockReturnValue(emptyGeoQuery);
    (useClimateData as ReturnType<typeof vi.fn>).mockReturnValue(pendingClimateQuery);
  });

  it('FE-FOR-001 renders location search input and date range inputs with defaults', () => {
    render(<ForecastTool />);

    expect(screen.getByLabelText('Search destination')).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('FE-FOR-002 typing in search shows suggestion list from geocode results', () => {
    (useGeocode as ReturnType<typeof vi.fn>).mockReturnValue(readyGeoQuery);
    render(<ForecastTool />);

    const searchInput = screen.getByLabelText('Search destination');
    fireEvent.change(searchInput, { target: { value: 'Bar' } });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Barcelona, Catalonia, Spain')).toBeInTheDocument();
  });

  it('FE-FOR-003 pressing ArrowDown then Enter selects the focused suggestion', () => {
    (useGeocode as ReturnType<typeof vi.fn>).mockReturnValue(readyGeoQuery);
    (useClimateData as ReturnType<typeof vi.fn>).mockReturnValue(readyClimateQuery);
    render(<ForecastTool />);

    const searchInput = selectFirstSuggestion();

    expect(searchInput).toHaveValue('Barcelona, Catalonia, Spain');
  });

  it('FE-FOR-004 shows loading state while climate data is fetching', () => {
    (useGeocode as ReturnType<typeof vi.fn>).mockReturnValue(readyGeoQuery);
    (useClimateData as ReturnType<typeof vi.fn>).mockReturnValue(pendingClimateQuery);
    render(<ForecastTool />);

    selectFirstSuggestion();

    expect(screen.getByText('Loading climate data...')).toBeInTheDocument();
  });

  it('FE-FOR-005 shows error state when geocoding fails', () => {
    (useGeocode as ReturnType<typeof vi.fn>).mockReturnValue(errorGeoQuery);
    render(<ForecastTool />);

    expect(screen.getByText(/Unable to resolve destination/i)).toBeInTheDocument();
  });

  it('FE-FOR-006 climate metric cards render after a location and data are loaded', () => {
    (useGeocode as ReturnType<typeof vi.fn>).mockReturnValue(readyGeoQuery);
    (useClimateData as ReturnType<typeof vi.fn>).mockReturnValue(readyClimateQuery);
    render(<ForecastTool />);

    selectFirstSuggestion();

    expect(screen.getByText('Avg High')).toBeInTheDocument();
    expect(screen.getByText('Avg Low')).toBeInTheDocument();
    expect(screen.getByText('Avg Mean')).toBeInTheDocument();
  });

  it('FE-FOR-007 events section appears when events overlap the selected date range', () => {
    (useGeocode as ReturnType<typeof vi.fn>).mockReturnValue(readyGeoQuery);
    (useClimateData as ReturnType<typeof vi.fn>).mockReturnValue(readyClimateQuery);
    render(<ForecastTool />);

    // Select Barcelona
    selectFirstSuggestion();

    // Change date range to overlap Barcelona's MWC event (02-24 to 02-27)
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-02-24' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-02-27' } });

    expect(screen.getByText('Events During Your Dates')).toBeInTheDocument();
    expect(screen.getByText('Mobile World Congress')).toBeInTheDocument();
  });
});
