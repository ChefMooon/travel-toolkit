import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  CloudSun,
  Droplets,
  Info,
  PanelTop,
  Snowflake,
  Sunrise,
  Sun,
  Table2,
  Thermometer,
  Wind,
} from 'lucide-react';
import { getLocalTimeAtDestination } from './forecastData';
import { getEventsForRange } from './forecastEvents';
import type { DailyClimate, ForecastEvent, GeoLocation } from './forecastTypes';
import { FORECAST_GEOCODE_MIN_QUERY_LENGTH, useClimateData, useGeocode } from './useForecast';
import { useForecastStore } from '../../store/forecastStore';

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
  if (event.year > 0) {
    return `${start}, ${event.year} - ${end}, ${event.year}`;
  }
  return `${start} - ${end}`;
}

type SummaryMetric = {
  label: string;
  value: number;
  unit: string;
  Icon: typeof Thermometer;
};

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

function ForecastAttribution() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="forecast-badge forecast-badge-attribution" ref={ref}>
      <button
        type="button"
        className="forecast-badge-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Weather data source information"
      >
        Weather data from{' '}
        <a
          href="https://open-meteo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="forecast-badge-link"
          onClick={(e) => e.stopPropagation()}
        >
          Open-Meteo
        </a>
        <Info size={14} strokeWidth={2} />
      </button>
      {open && (
        <div className="forecast-popover" role="tooltip">
          Climate averages are sourced from Open-Meteo's Climate API, based on historical weather model data spanning multiple decades.
        </div>
      )}
    </div>
  );
}

function ForecastEventDisclaimer() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="forecast-badge" ref={ref}>
      <button
        type="button"
        className="forecast-badge-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Event data source information"
      >
        <Info size={14} strokeWidth={2} />
      </button>
      {open && (
        <div className="forecast-popover" role="tooltip">
          This is a personal data source. All event dates are estimates and may not reflect exact scheduling.
        </div>
      )}
    </div>
  );
}

function DailyBreakdownToggle() {
  const { dailyBreakdownView, setDailyBreakdownView } = useForecastStore();

  return (
    <div className="forecast-view-toggle" role="radiogroup" aria-label="Daily breakdown view mode">
      <button
        type="button"
        className={`forecast-view-toggle-btn${dailyBreakdownView === 'table' ? ' is-active' : ''}`}
        onClick={() => setDailyBreakdownView('table')}
        role="radio"
        aria-checked={dailyBreakdownView === 'table'}
        aria-label="Table view"
      >
        <Table2 size={14} strokeWidth={2} />
        <span className="forecast-view-toggle-label">Table</span>
      </button>
      <button
        type="button"
        className={`forecast-view-toggle-btn${dailyBreakdownView === 'single-day' ? ' is-active' : ''}`}
        onClick={() => setDailyBreakdownView('single-day')}
        role="radio"
        aria-checked={dailyBreakdownView === 'single-day'}
        aria-label="Day view"
      >
        <PanelTop size={14} strokeWidth={2} />
        <span className="forecast-view-toggle-label">Day View</span>
      </button>
    </div>
  );
}

function DailyTableView({ days }: { days: DailyClimate[] }) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const toggleRow = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  return (
    <div className="forecast-table" role="table" aria-label="Daily climate breakdown">
      <div className="forecast-table-header" role="row">
        <span role="columnheader">Date</span>
        <span role="columnheader">High / Low</span>
        <span role="columnheader" className="forecast-table-col-hide">Precip.</span>
        <span role="columnheader" className="forecast-table-col-hide-sm">Sunshine</span>
        <span role="columnheader" className="forecast-table-col-hide-sm">Daylight</span>
        <span role="columnheader" className="forecast-table-col-expand"><span className="sr-only">Expand</span></span>
      </div>
      {days.map((day) => {
        const isExpanded = expandedDate === day.date;
        const precipMetric = getDailyPrimaryPrecipMetric(day);
        return (
          <div key={day.date} className="forecast-table-row-group">
            <button
              type="button"
              className={`forecast-table-row${isExpanded ? ' is-expanded' : ''}`}
              onClick={() => toggleRow(day.date)}
              role="row"
              aria-expanded={isExpanded}
            >
              <span className="forecast-table-cell" role="cell">
                <CalendarDays size={14} strokeWidth={2} />
                {formatMonthDay(day.date)}
              </span>
              <span className="forecast-table-cell" role="cell">
                {day.tempMaxC} / {day.tempMinC} <span className="forecast-table-unit">°C</span>
              </span>
              <span className="forecast-table-cell forecast-table-col-hide" role="cell">
                {precipMetric.value} <span className="forecast-table-unit">{precipMetric.unit}</span>
              </span>
              <span className="forecast-table-cell forecast-table-col-hide-sm" role="cell">
                {day.sunshineDurationHrs} <span className="forecast-table-unit">hrs</span>
              </span>
              <span className="forecast-table-cell forecast-table-col-hide-sm" role="cell">
                {day.daylightDurationHrs} <span className="forecast-table-unit">hrs</span>
              </span>
              <span className="forecast-table-cell forecast-table-col-expand" role="cell">
                <ChevronDown size={16} strokeWidth={2} className={`forecast-table-chevron${isExpanded ? ' is-rotated' : ''}`} />
              </span>
            </button>
            <div className={`forecast-table-expand${isExpanded ? ' is-open' : ''}`} role="row">
              <div className="forecast-table-expand-content">
                {getDailyDetailMetrics(day).map((metric) => (
                  <article key={`${day.date}-${metric.label}`} className="forecast-day-detail-metric">
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
          </div>
        );
      })}
    </div>
  );
}

function DailySingleDayView({ days }: { days: DailyClimate[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const selectedDay = days[selectedIndex];

  useEffect(() => {
    if (!stripRef.current) return;
    const chip = stripRef.current.children[selectedIndex] as HTMLElement | undefined;
    chip?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  if (!selectedDay) return null;

  const goToPrev = () => setSelectedIndex((i) => Math.max(0, i - 1));
  const goToNext = () => setSelectedIndex((i) => Math.min(days.length - 1, i + 1));

  const precipMetric = getDailyPrimaryPrecipMetric(selectedDay);

  return (
    <div className="forecast-single-day">
      <div className="forecast-day-strip-wrap">
        <button
          type="button"
          className="forecast-day-strip-arrow"
          onClick={goToPrev}
          disabled={selectedIndex === 0}
          aria-label="Previous day"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <div className="forecast-day-strip" ref={stripRef} role="tablist" aria-label="Select forecast day">
          {days.map((day, index) => (
            <button
              key={day.date}
              type="button"
              className={`forecast-day-chip${index === selectedIndex ? ' is-active' : ''}`}
              onClick={() => setSelectedIndex(index)}
              role="tab"
              aria-selected={index === selectedIndex}
            >
              {formatMonthDay(day.date)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="forecast-day-strip-arrow"
          onClick={goToNext}
          disabled={selectedIndex === days.length - 1}
          aria-label="Next day"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="forecast-single-day-panel" role="tabpanel" aria-label={`Forecast for ${formatMonthDay(selectedDay.date)}`}>
        <h3 className="forecast-single-day-title">{formatMonthDay(selectedDay.date)}</h3>

        <div className="forecast-single-day-primary">
          <article className="forecast-summary-metric">
            <div className="forecast-summary-metric-image" aria-hidden="true">
              <Thermometer size={18} strokeWidth={2} />
            </div>
            <p className="forecast-summary-metric-label">High / Low</p>
            <p className="forecast-summary-metric-value">
              {selectedDay.tempMaxC} / {selectedDay.tempMinC}<span>°C</span>
            </p>
          </article>
          <article className="forecast-summary-metric">
            <div className="forecast-summary-metric-image" aria-hidden="true">
              <precipMetric.Icon size={18} strokeWidth={2} />
            </div>
            <p className="forecast-summary-metric-label">{precipMetric.label}</p>
            <p className="forecast-summary-metric-value">
              {precipMetric.value}<span>{precipMetric.unit}</span>
            </p>
          </article>
          <article className="forecast-summary-metric">
            <div className="forecast-summary-metric-image" aria-hidden="true">
              <CloudSun size={18} strokeWidth={2} />
            </div>
            <p className="forecast-summary-metric-label">Sunshine</p>
            <p className="forecast-summary-metric-value">
              {selectedDay.sunshineDurationHrs}<span>hrs</span>
            </p>
          </article>
          <article className="forecast-summary-metric">
            <div className="forecast-summary-metric-image" aria-hidden="true">
              <Sunrise size={18} strokeWidth={2} />
            </div>
            <p className="forecast-summary-metric-label">Daylight</p>
            <p className="forecast-summary-metric-value">
              {selectedDay.daylightDurationHrs}<span>hrs</span>
            </p>
          </article>
        </div>

        <div className="forecast-single-day-secondary">
          {getDailyDetailMetrics(selectedDay).map((metric) => (
            <article key={metric.label} className="forecast-summary-metric">
              <div className="forecast-summary-metric-image" aria-hidden="true">
                <metric.Icon size={18} strokeWidth={2} />
              </div>
              <p className="forecast-summary-metric-label">{metric.label}</p>
              <p className="forecast-summary-metric-value">
                {metric.value}<span>{metric.unit}</span>
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
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

  const { dailyBreakdownView } = useForecastStore();

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

  const supportMetrics = useMemo<SummaryMetric[]>(() => {
    if (!climateQuery.data) {
      return [];
    }

    return [
      { label: 'Precipitation', value: climateQuery.data.avgPrecipitationMm, unit: 'mm/day', Icon: CloudRain },
      { label: 'Sunshine', value: climateQuery.data.avgSunshineDurationHrs, unit: 'hrs/day', Icon: Sun },
      { label: 'Daylight', value: climateQuery.data.avgDaylightDurationHrs, unit: 'hrs/day', Icon: Sunrise },
      { label: 'Rainfall', value: climateQuery.data.avgRainMm, unit: 'mm/day', Icon: Droplets },
      { label: 'Snowfall', value: climateQuery.data.avgSnowfallCm, unit: 'cm/day', Icon: Snowflake },
      { label: 'Max Wind', value: climateQuery.data.avgWindspeedMaxKmh, unit: 'km/h', Icon: Wind },
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
          <p className="card-title">Location Search &amp; Date Range</p>
          <ForecastAttribution />
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
              <div className="card-header card-header-inline-mobile">
                <p className="card-title">Events During Your Dates</p>
                <ForecastEventDisclaimer />
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
              <div className="forecast-summary-hero-layout">
                <article className="forecast-hero-card">
                  <div className="forecast-summary-metric-image forecast-hero-card-icon" aria-hidden="true">
                    <Thermometer size={28} strokeWidth={2} />
                  </div>
                  <p className="forecast-summary-metric-label">Avg Mean Temp</p>
                  <p className="forecast-hero-card-value">
                    {climateQuery.data.avgMeanC}<span>°C</span>
                  </p>
                  <p className="forecast-hero-card-sublabel">
                    High {climateQuery.data.avgHighC}° · Low {climateQuery.data.avgLowC}°
                  </p>
                </article>
                <div className="forecast-support-grid" role="list" aria-label="Climate summary stats">
                  {supportMetrics.map((metric) => (
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
            </div>
          </div>

          <div className="card">
            <div className="card-header card-header-inline-mobile">
              <p className="card-title">Daily Breakdown</p>
              <DailyBreakdownToggle />
            </div>
            <div className="card-body tool-results">
              {dailyBreakdownView === 'table' ? (
                <DailyTableView days={climateQuery.data.days} />
              ) : (
                <DailySingleDayView days={climateQuery.data.days} />
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
