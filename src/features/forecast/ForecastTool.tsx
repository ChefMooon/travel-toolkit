import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CloudRain,
  CloudSun,
  Droplets,
  Snowflake,
  Sunrise,
  Sun,
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  Wind,
} from 'lucide-react';
import { getLocalTimeAtDestination } from './forecastData';
import { getEventsForRange } from './forecastEvents';
import type { DailyClimate, ForecastEvent, GeoLocation } from './forecastTypes';
import { FORECAST_GEOCODE_MIN_QUERY_LENGTH, useClimateData, useGeocode } from './useForecast';

const FORECAST_GEOCODE_DEBOUNCE_MS = 500;

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatMonthDay(monthDay: string): string {
  const [monthRaw, dayRaw] = monthDay.split('-');
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return monthDay;
  }

  const date = new Date(Date.UTC(2001, month - 1, day));
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatPopulation(population: number): string {
  if (population >= 1_000_000_000) {
    return `Pop. ${(population / 1_000_000_000).toFixed(1)}B`;
  }
  if (population >= 1_000_000) {
    return `Pop. ${(population / 1_000_000).toFixed(1)}M`;
  }
  if (population >= 1_000) {
    return `Pop. ${(population / 1_000).toFixed(1)}K`;
  }
  return `Pop. ${population}`;
}

function renderEventDateRange(event: ForecastEvent): string {
  const start = formatMonthDay(event.startDate);
  const end = formatMonthDay(event.endDate);
  return `${start} - ${end}`;
}

type SummaryMetric = {
  label: string;
  value: number;
  unit: string;
  Icon: typeof Thermometer;
};

type DetailMetric = SummaryMetric;
type DailyMetric = SummaryMetric;

function getDailyPrimaryPrecipMetric(day: DailyClimate): DailyMetric {
  if (day.precipitationDisplay === 'snow') {
    return {
      label: 'Snowfall',
      value: day.snowfallCm,
      unit: 'cm',
      Icon: Snowflake,
    };
  }

  return {
    label: 'Precipitation',
    value: day.precipitationMm,
    unit: 'mm',
    Icon: CloudRain,
  };
}

function getDailyDetailMetrics(day: DailyClimate): DailyMetric[] {
  return [
    { label: 'Avg Mean Temp', value: day.tempMeanC, unit: '°C', Icon: Thermometer },
    { label: 'Rainfall', value: day.rainMm, unit: 'mm', Icon: Droplets },
    { label: 'Snowfall', value: day.snowfallCm, unit: 'cm', Icon: Snowflake },
    { label: 'Total Precipitation', value: day.precipitationMm, unit: 'mm', Icon: CloudRain },
    { label: 'Max Wind Speed', value: day.windspeedMaxKmh, unit: 'km/h', Icon: Wind },
  ];
}

export default function ForecastTool() {
  const suggestionListId = 'forecast-suggestion-list';
  const today = useMemo(() => new Date(), []);
  const todayInput = useMemo(() => toInputDate(today), [today]);
  const defaultToInput = useMemo(() => toInputDate(addDays(today, 7)), [today]);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dateFrom, setDateFrom] = useState(todayInput);
  const [dateTo, setDateTo] = useState(defaultToInput);
  const [localTime, setLocalTime] = useState('');
  const suggestionListRef = useRef<HTMLUListElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, FORECAST_GEOCODE_DEBOUNCE_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!selectedLocation) {
      setLocalTime('');
      return;
    }

    setLocalTime(getLocalTimeAtDestination(selectedLocation.timezone));
    const intervalId = globalThis.setInterval(() => {
      setLocalTime(getLocalTimeAtDestination(selectedLocation.timezone));
    }, 1000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [selectedLocation]);

  const geocodeQuery = useGeocode(debouncedSearch);
  const climateQuery = useClimateData(selectedLocation, dateFrom, dateTo);
  const geocodeSuggestions = geocodeQuery.data ?? [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [geocodeSuggestions]);

  useEffect(() => {
    if (!showSuggestions) {
      setActiveIndex(-1);
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }

    const activeOption = suggestionListRef.current?.querySelector<HTMLElement>(`#forecast-option-${activeIndex}`);
    activeOption?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const matchedEvents = useMemo(
    () => (selectedLocation ? getEventsForRange(selectedLocation.name, dateFrom, dateTo) : []),
    [selectedLocation, dateFrom, dateTo],
  );

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    if (!climateQuery.data) {
      return [];
    }

    const primaryPrecipMetric = climateQuery.data.precipitationDisplay === 'snow'
      ? {
          label: 'Snowfall',
          value: climateQuery.data.avgSnowfallCm,
          unit: 'cm/day',
          Icon: Snowflake,
        }
      : {
          label: 'Precipitation',
          value: climateQuery.data.avgPrecipitationMm,
          unit: 'mm/day',
          Icon: CloudRain,
        };

    return [
      { label: 'Avg High', value: climateQuery.data.avgHighC, unit: '°C', Icon: ThermometerSun },
      { label: 'Avg Low', value: climateQuery.data.avgLowC, unit: '°C', Icon: ThermometerSnowflake },
      { label: 'Avg Mean', value: climateQuery.data.avgMeanC, unit: '°C', Icon: Thermometer },
      primaryPrecipMetric,
      { label: 'Sunshine', value: climateQuery.data.avgSunshineDurationHrs, unit: 'hrs/day', Icon: Sun },
      { label: 'Daylight', value: climateQuery.data.avgDaylightDurationHrs, unit: 'hrs/day', Icon: Sunrise },
    ];
  }, [climateQuery.data]);

  const summaryDetailMetrics = useMemo<DetailMetric[]>(() => {
    if (!climateQuery.data) {
      return [];
    }

    return [
      { label: 'Avg Rainfall', value: climateQuery.data.avgRainMm, unit: 'mm/day', Icon: Droplets },
      { label: 'Avg Snowfall', value: climateQuery.data.avgSnowfallCm, unit: 'cm/day', Icon: Snowflake },
      {
        label: 'Avg Total Precipitation',
        value: climateQuery.data.avgPrecipitationMm,
        unit: 'mm/day',
        Icon: CloudRain,
      },
      {
        label: 'Avg Max Wind Speed',
        value: climateQuery.data.avgWindspeedMaxKmh,
        unit: 'km/h',
        Icon: Wind,
      },
    ];
  }, [climateQuery.data]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setShowSuggestions(true);
    setActiveIndex(-1);

    if (!value.trim()) {
      setSelectedLocation(null);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedLocation(null);
    setShowSuggestions(false);
    setActiveIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleSelectLocation = (location: GeoLocation) => {
    setSelectedLocation(location);
    setSearchInput(location.displayName);
    setDebouncedSearch(location.displayName);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleDestinationKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((previousIndex) => {
        if (geocodeSuggestions.length === 0) {
          return -1;
        }
        return Math.min(previousIndex + 1, geocodeSuggestions.length - 1);
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((previousIndex) => {
        if (geocodeSuggestions.length === 0) {
          return -1;
        }
        return Math.max(previousIndex - 1, -1);
      });
      return;
    }

    if (event.key === 'Enter') {
      if (activeIndex < 0 || activeIndex >= geocodeSuggestions.length) {
        return;
      }

      const selectedSuggestion = geocodeSuggestions[activeIndex];
      if (!selectedSuggestion) {
        return;
      }

      event.preventDefault();
      handleSelectLocation(selectedSuggestion);
      return;
    }

    if (event.key === 'Escape') {
      if (!showSuggestions) {
        return;
      }

      event.preventDefault();
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    if (value > dateTo) {
      setDateTo(value);
    }
  };

  return (
    <section className="tool-page" aria-label="Destination forecast">
      <h1>Destination Forecast</h1>

      <div className="card forecast-search-card">
        <div className="card-header">
          <p className="card-title">Location Search & Date Range</p>
        </div>
        <div className="card-body tool-controls">
          <div className="forecast-location-grid">
            <div className="forecast-search-wrap">
              <label className="tool-field">
                <span className="tool-label">Destination</span>
                <div className="forecast-search-input-wrap">
                  <input
                    ref={searchInputRef}
                    className="tool-input"
                    type="text"
                    value={searchInput}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    onKeyDown={handleDestinationKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      globalThis.setTimeout(() => setShowSuggestions(false), 100);
                    }}
                    placeholder="Search city name"
                    role="combobox"
                    aria-expanded={showSuggestions && geocodeSuggestions.length > 0}
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    aria-controls={suggestionListId}
                    aria-activedescendant={activeIndex >= 0 ? `forecast-option-${activeIndex}` : undefined}
                    aria-label="Search destination"
                  />
                  {searchInput.length > 0 ? (
                    <button
                      type="button"
                      className="forecast-search-clear"
                      aria-label="Clear search"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleClearSearch}
                    >
                      &#x2715;
                    </button>
                  ) : null}
                </div>
              </label>

              {showSuggestions && geocodeSuggestions.length > 0 ? (
                <ul ref={suggestionListRef} id={suggestionListId} className="forecast-suggestion-list" role="listbox">
                  {geocodeSuggestions.map((option, index) => (
                    <li key={option.id} id={`forecast-option-${index}`} role="option" aria-selected={index === activeIndex}>
                      <button
                        type="button"
                        className={`forecast-suggestion-btn${index === activeIndex ? ' is-active' : ''}`}
                        onMouseDown={() => handleSelectLocation(option)}
                      >
                        <span>{option.displayName}</span>
                        <span className="forecast-suggestion-meta">{formatPopulation(option.population)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <label className="tool-field">
              <span className="tool-label">From</span>
              <input
                className="tool-input"
                type="date"
                value={dateFrom}
                min={todayInput}
                onChange={(event) => handleDateFromChange(event.target.value)}
              />
            </label>

            <label className="tool-field">
              <span className="tool-label">To</span>
              <input
                className="tool-input"
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
          </div>
          {debouncedSearch.trim().length >= FORECAST_GEOCODE_MIN_QUERY_LENGTH && geocodeSuggestions.length === 0 && !geocodeQuery.isPending ? (
            <p className="tool-status">No matching destinations found.</p>
          ) : null}
          {geocodeQuery.isError ? (
            <p className="tool-status tool-status-error">Unable to resolve destination right now.</p>
          ) : null}
        </div>
      </div>

      {selectedLocation ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Destination Summary</p>
          </div>
          <div className="card-body tool-results">
            <div className="forecast-destination-summary" aria-label="Destination summary details">
              <div className="forecast-destination-summary-item">
                <span className="forecast-destination-summary-label">Local time</span>
                <span className="forecast-destination-summary-value">🕐 {localTime}</span>
              </div>
              <div className="forecast-destination-summary-item">
                <span className="forecast-destination-summary-label">Time zone</span>
                <span className="forecast-destination-summary-value">
                  🌍 {selectedLocation.timezone} ({selectedLocation.countryCode})
                </span>
              </div>
              <div className="forecast-destination-summary-item">
                <span className="forecast-destination-summary-label">Population</span>
                <span className="forecast-destination-summary-value">
                  👥 {selectedLocation.population.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!selectedLocation ? <p className="tool-status">Select a destination to load climate data.</p> : null}
      {selectedLocation && climateQuery.isPending ? <p className="tool-status">Loading climate data...</p> : null}

      {selectedLocation && climateQuery.isError ? (
        <div className="card">
          <div className="card-body tool-controls">
            <p className="tool-status tool-status-error">Unable to load climate data right now.</p>
            <button type="button" className="tool-button" onClick={() => climateQuery.refetch()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {climateQuery.data ? (
        <>
          {matchedEvents.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <p className="card-title">Events During Your Dates</p>
              </div>
              <div className="card-body tool-results">
                {matchedEvents.map((event) => (
                  <article key={event.id} className="forecast-event-card">
                    <div className="forecast-event-title-row">
                      <h2>{event.name}</h2>
                      <span className="forecast-event-type">{event.type}</span>
                    </div>
                    <p className="forecast-event-dates">{renderEventDateRange(event)}</p>
                    <p>{event.description}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="card-header">
              <p className="card-title">Climate Summary</p>
            </div>
            <div className="card-body tool-results">
              <div className="forecast-summary-layout">
                <div className="forecast-summary-strip" role="list" aria-label="Climate summary highlights">
                  {summaryMetrics.map((metric) => (
                    <article key={metric.label} className="forecast-summary-metric" role="listitem">
                      <div className="forecast-summary-metric-image" aria-hidden="true">
                        <metric.Icon size={18} strokeWidth={2} />
                      </div>
                      <p className="forecast-summary-metric-label">{metric.label}</p>
                      <p className="forecast-summary-metric-value">
                        {metric.value}
                        <span>{metric.unit}</span>
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <details className="forecast-details">
                <summary>More Details</summary>
                <div className="forecast-details-metric-grid" role="list" aria-label="Climate summary details">
                  {summaryDetailMetrics.map((metric) => (
                    <article key={metric.label} className="forecast-details-metric" role="listitem">
                      <div className="forecast-summary-metric-image" aria-hidden="true">
                        <metric.Icon size={18} strokeWidth={2} />
                      </div>
                      <p className="forecast-summary-metric-label">{metric.label}</p>
                      <p className="forecast-summary-metric-value">
                        {metric.value}
                        <span>{metric.unit}</span>
                      </p>
                    </article>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <p className="card-title">Daily Breakdown</p>
            </div>
            <div className="card-body tool-results">
              <div className="forecast-daily-grid" role="list" aria-label="Daily climate breakdown">
                {climateQuery.data.days.map((day) => (
                  <article key={day.date} className="forecast-daily-card" role="listitem">
                    <div className="forecast-daily-card-header">
                      <div className="forecast-summary-metric-image" aria-hidden="true">
                        <CalendarDays size={18} strokeWidth={2} />
                      </div>
                      <h3>{formatMonthDay(day.date)}</h3>
                    </div>

                    <div className="forecast-daily-card-metrics">
                      <article className="forecast-daily-card-metric">
                        <div className="forecast-summary-metric-image" aria-hidden="true">
                          <Thermometer size={18} strokeWidth={2} />
                        </div>
                        <p className="forecast-summary-metric-label">High / Low</p>
                        <p className="forecast-summary-metric-value">
                          {day.tempMaxC} / {day.tempMinC}
                          <span>°C</span>
                        </p>
                      </article>

                      {(() => {
                        const precipMetric = getDailyPrimaryPrecipMetric(day);
                        return (
                          <article className="forecast-daily-card-metric">
                            <div className="forecast-summary-metric-image" aria-hidden="true">
                              <precipMetric.Icon size={18} strokeWidth={2} />
                            </div>
                            <p className="forecast-summary-metric-label">{precipMetric.label}</p>
                            <p className="forecast-summary-metric-value">
                              {precipMetric.value}
                              <span>{precipMetric.unit}</span>
                            </p>
                          </article>
                        );
                      })()}

                      <article className="forecast-daily-card-metric">
                        <div className="forecast-summary-metric-image" aria-hidden="true">
                          <CloudSun size={18} strokeWidth={2} />
                        </div>
                        <p className="forecast-summary-metric-label">Sunshine</p>
                        <p className="forecast-summary-metric-value">
                          {day.sunshineDurationHrs}
                          <span>hrs</span>
                        </p>
                      </article>

                      <article className="forecast-daily-card-metric">
                        <div className="forecast-summary-metric-image" aria-hidden="true">
                          <Sunrise size={18} strokeWidth={2} />
                        </div>
                        <p className="forecast-summary-metric-label">Daylight</p>
                        <p className="forecast-summary-metric-value">
                          {day.daylightDurationHrs}
                          <span>hrs</span>
                        </p>
                      </article>
                    </div>

                    <details className="forecast-details forecast-daily-details">
                      <summary>View day details</summary>
                      <div className="forecast-day-detail-metrics" role="list" aria-label={`${formatMonthDay(day.date)} details`}>
                        {getDailyDetailMetrics(day).map((metric) => (
                          <article key={`${day.date}-${metric.label}`} className="forecast-day-detail-metric" role="listitem">
                            <div className="forecast-summary-metric-image" aria-hidden="true">
                              <metric.Icon size={18} strokeWidth={2} />
                            </div>
                            <p className="forecast-summary-metric-label">{metric.label}</p>
                            <p className="forecast-summary-metric-value">
                              {metric.value}
                              <span>{metric.unit}</span>
                            </p>
                          </article>
                        ))}
                      </div>
                    </details>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
