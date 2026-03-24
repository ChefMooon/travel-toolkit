# Destination Forecast — Implementation Plan

## Context & Constraints

- The forecast feature is **already implemented** with static hardcoded data. This task replaces the data layer and expands the UI while preserving the existing file structure.
- **Do not alter** `useForecast.ts`, `index.ts`, or `forecast.tsx` unless a change is explicitly listed below.
- The component (`ForecastTool.tsx`) will need UI additions for location search and date range inputs, but its existing display state logic (`isPending`, `isError`, `null`, `data`) should be extended — not replaced.
- No new dependencies are required. Use native `fetch` and the browser's `Intl` API throughout.

---

## New Dependencies (none — confirm before starting)

All API calls use native `fetch`. Local time at destination is derived from the browser's `Intl.DateTimeFormat` using the IANA timezone string returned by geocoding. No new `npm` packages are needed.

---

## Architecture Overview

The new data flow introduces three concerns that did not exist in the static implementation:

1. **Geocoding** — Convert a user's typed destination into a resolved `GeoLocation` (including `lat`, `lng`, `timezone`, `population`, `admin1`) via the Open-Meteo Geocoding API. This is a separate query with its own cache entry.
2. **Climate data** — Given resolved coordinates and a date range, fetch historical average temperatures, precipitation, snowfall, sunshine duration, daylight duration, and wind speed from the Open-Meteo Climate API.
3. **Event matching** — Given a resolved location name and a date range, filter the hardcoded events dataset for any overlap.

These are modeled as **two separate TanStack Query hooks** (geocoding and climate) and one **pure utility function** (event matching). The component coordinates them.

---

## File Structure

### Modified files

| File | Change |
|---|---|
| `src/features/forecast/forecastData.ts` | Full replacement — remove static data, add API fetch functions |
| `src/features/forecast/useForecast.ts` | Replace single hook with two hooks: `useGeocode` and `useClimateData` |
| `src/features/forecast/ForecastTool.tsx` | Add location search, date pickers, local time display, full climate display, events; extend existing display states |

### New files

| File | Role |
|---|---|
| `src/features/forecast/forecastEvents.ts` | Hardcoded events dataset + overlap matcher |
| `src/features/forecast/forecastTypes.ts` | All shared TypeScript types for this feature |

---

## 1. Types — `src/features/forecast/forecastTypes.ts`

Define all shared types here. Import from this file everywhere else in the feature.

```ts
// Geocoding
export interface GeoLocation {
  id: number;            // Open-Meteo's unique location ID
  name: string;          // City name, e.g. "Barcelona"
  country: string;       // e.g. "Spain"
  countryCode: string;   // e.g. "ES"
  admin1: string;        // State/province/region, e.g. "Catalonia" — used for disambiguation
  lat: number;
  lng: number;
  timezone: string;      // IANA timezone string, e.g. "Europe/Madrid"
  population: number;    // City population — used to sort/tiebreak suggestions
  displayName: string;   // Formatted: "Barcelona, Catalonia, Spain"
}

// Climate API — full daily record
export interface DailyClimate {
  date: string;                    // "MM-DD" — calendar date key, not a specific year
  tempMeanC: number;               // Average mean temp in Celsius
  tempMaxC: number;                // Average high in Celsius
  tempMinC: number;                // Average low in Celsius
  precipitationMm: number;         // Average total precipitation in mm
  rainMm: number;                  // Average rainfall specifically (mm)
  snowfallCm: number;              // Average snowfall in cm
  precipitationDisplay: 'rain' | 'snow';  // Which value to show in primary UI (see logic below)
  sunshineDurationHrs: number;     // Average sunshine hours per day
  daylightDurationHrs: number;     // Average total daylight hours per day
  windspeedMaxKmh: number;         // Average max windspeed in km/h
}

// Summary across the full selected range
export interface ClimateSummary {
  location: GeoLocation;
  dateFrom: string;                // "YYYY-MM-DD"
  dateTo: string;                  // "YYYY-MM-DD"
  // Temperature
  avgHighC: number;
  avgLowC: number;
  avgMeanC: number;
  // Precipitation
  avgPrecipitationMm: number;
  avgRainMm: number;
  avgSnowfallCm: number;
  precipitationDisplay: 'rain' | 'snow'; // Dominant type across the range
  // Sunshine / daylight
  avgSunshineDurationHrs: number;
  avgDaylightDurationHrs: number;
  // Wind
  avgWindspeedMaxKmh: number;
  // Per-day breakdown
  days: DailyClimate[];
}

// Events
export interface ForecastEvent {
  id: string;
  name: string;
  locationKey: string;    // Normalized lowercase city name, e.g. "barcelona"
  startDate: string;      // "MM-DD" — month and day only, year-agnostic
  endDate: string;        // "MM-DD" — inclusive
  description: string;
  type: 'festival' | 'holiday' | 'conference' | 'sporting' | 'other';
}
```

---

## 2. Events Dataset — `src/features/forecast/forecastEvents.ts`

This file contains the hardcoded events array and the overlap detection utility. No changes to shape from the original plan.

### Events array

```ts
import { ForecastEvent } from './forecastTypes';

export const FORECAST_EVENTS: ForecastEvent[] = [
  {
    id: 'barcelona-mwc',
    name: 'Mobile World Congress',
    locationKey: 'barcelona',
    startDate: '02-24',
    endDate: '02-27',
    description: 'World\'s largest mobile technology conference.',
    type: 'conference',
  },
  {
    id: 'barcelona-la-merce',
    name: 'La Mercè Festival',
    locationKey: 'barcelona',
    startDate: '09-24',
    endDate: '09-24',
    description: 'Barcelona\'s main civic festival with free concerts and events.',
    type: 'festival',
  },
  {
    id: 'tokyo-cherry-blossom',
    name: 'Cherry Blossom Season',
    locationKey: 'tokyo',
    startDate: '03-20',
    endDate: '04-10',
    description: 'Peak sakura viewing season across Tokyo\'s parks.',
    type: 'festival',
  },
  {
    id: 'reykjavik-culture-night',
    name: 'Culture Night',
    locationKey: 'reykjavik',
    startDate: '08-23',
    endDate: '08-23',
    description: 'Annual free arts and culture celebration across the city.',
    type: 'festival',
  },
  // Add more events here as the dataset grows
];
```

### Overlap detection utility

```ts
export function getEventsForRange(
  locationName: string,
  dateFrom: string,   // "YYYY-MM-DD"
  dateTo: string      // "YYYY-MM-DD"
): ForecastEvent[] {
  const locationKey = locationName.toLowerCase().trim();
  const toMD = (date: string) => date.slice(5); // "YYYY-MM-DD" → "MM-DD"
  const rangeStart = toMD(dateFrom);
  const rangeEnd   = toMD(dateTo);

  return FORECAST_EVENTS.filter((event) => {
    if (event.locationKey !== locationKey) return false;
    return event.startDate <= rangeEnd && event.endDate >= rangeStart;
  });
}
```

> **Note on year-boundary ranges:** The string comparison above is correct for ranges within a single calendar year. If support for Dec → Jan ranges is needed in future, split the range into two sub-ranges before filtering.

---

## 3. Data & Fetch Functions — `src/features/forecast/forecastData.ts`

Replace the entire file. Keep no static data from the original.

### 3a. Geocoding fetch

Returns results sorted by population descending so the most prominent city appears first when names are ambiguous (e.g. "Paris, France" before "Paris, Texas").

```ts
export async function fetchGeocodingResults(query: string, count = 5): Promise<GeoLocation[]> {
  if (!query.trim()) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);

  const data = await res.json();
  if (!data.results?.length) return [];

  const results: GeoLocation[] = data.results.map((r: any): GeoLocation => ({
    id: r.id,
    name: r.name,
    country: r.country ?? '',
    countryCode: r.country_code ?? '',
    admin1: r.admin1 ?? '',
    lat: r.latitude,
    lng: r.longitude,
    timezone: r.timezone ?? 'UTC',
    population: r.population ?? 0,
    // Build a display name using admin1 for disambiguation when it differs from city name
    displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }));

  // Sort by population descending — most prominent city first
  return results.sort((a, b) => b.population - a.population);
}
```

### 3b. Climate data fetch

Fetches 20 years of historical data (2000–2020) for the same calendar period, then groups and averages by `MM-DD` to produce climate normals.

**All climate variables to request:**

```
temperature_2m_mean, temperature_2m_max, temperature_2m_min,
precipitation_sum, rain_sum, snowfall_sum,
sunshine_duration, daylight_duration,
windspeed_10m_max
```

**Precipitation display logic (per day and for the summary):**
- If `avgPrecipitationMm === 0` AND `avgSnowfallCm > 0` → set `precipitationDisplay = 'snow'`
- Otherwise → set `precipitationDisplay = 'rain'`

This determines which value the UI shows in the primary display slot. Both values are always stored in the data.

```ts
export async function fetchClimateData(
  location: GeoLocation,
  dateFrom: string,
  dateTo: string
): Promise<ClimateSummary> {
  const BASELINE_START_YEAR = 2000;
  const BASELINE_END_YEAR   = 2020;

  const fromMD = dateFrom.slice(5);
  const toMD   = dateTo.slice(5);

  const apiStart = `${BASELINE_START_YEAR}-${fromMD}`;
  const apiEnd   = `${BASELINE_END_YEAR}-${toMD}`;

  const variables = [
    'temperature_2m_mean',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'rain_sum',
    'snowfall_sum',
    'sunshine_duration',
    'daylight_duration',
    'windspeed_10m_max',
  ].join(',');

  const url = [
    `https://climate-api.open-meteo.com/v1/climate`,
    `?latitude=${location.lat}`,
    `&longitude=${location.lng}`,
    `&start_date=${apiStart}`,
    `&end_date=${apiEnd}`,
    `&models=EC_Earth3P_HR`,
    `&daily=${variables}`,
  ].join('');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Climate API error: ${res.status}`);

  const data = await res.json();
  const d = data.daily;

  // Group all variables by "MM-DD" and accumulate values across years
  type DayAccumulator = {
    means: number[]; maxes: number[]; mins: number[];
    precip: number[]; rain: number[]; snow: number[];
    sunshine: number[]; daylight: number[]; wind: number[];
  };
  const grouped: Record<string, DayAccumulator> = {};

  d.time.forEach((dateStr: string, i: number) => {
    const md = dateStr.slice(5);
    if (!grouped[md]) grouped[md] = {
      means: [], maxes: [], mins: [],
      precip: [], rain: [], snow: [],
      sunshine: [], daylight: [], wind: [],
    };
    const g = grouped[md];
    const push = (arr: number[], val: number | null) => { if (val != null) arr.push(val); };

    push(g.means,    d.temperature_2m_mean[i]);
    push(g.maxes,    d.temperature_2m_max[i]);
    push(g.mins,     d.temperature_2m_min[i]);
    push(g.precip,   d.precipitation_sum[i]);
    push(g.rain,     d.rain_sum[i]);
    push(g.snow,     d.snowfall_sum[i]);
    // API returns seconds — convert sunshine and daylight to hours
    push(g.sunshine, d.sunshine_duration[i] != null ? d.sunshine_duration[i] / 3600 : null);
    push(g.daylight, d.daylight_duration[i] != null ? d.daylight_duration[i] / 3600 : null);
    push(g.wind,     d.windspeed_10m_max[i]);
  });

  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

  const days: DailyClimate[] = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([md, g]) => {
      const precipMm = avg(g.precip);
      const snowCm   = avg(g.snow);
      return {
        date: md,
        tempMeanC:              avg(g.means),
        tempMaxC:               avg(g.maxes),
        tempMinC:               avg(g.mins),
        precipitationMm:        precipMm,
        rainMm:                 avg(g.rain),
        snowfallCm:             snowCm,
        precipitationDisplay:   precipMm === 0 && snowCm > 0 ? 'snow' : 'rain',
        sunshineDurationHrs:    avg(g.sunshine),
        daylightDurationHrs:    avg(g.daylight),
        windspeedMaxKmh:        avg(g.wind),
      };
    });

  // Compute summary-level averages
  const avgPrecip = avg(days.map(d => d.precipitationMm));
  const avgSnow   = avg(days.map(d => d.snowfallCm));

  return {
    location,
    dateFrom,
    dateTo,
    avgHighC:                avg(days.map(d => d.tempMaxC)),
    avgLowC:                 avg(days.map(d => d.tempMinC)),
    avgMeanC:                avg(days.map(d => d.tempMeanC)),
    avgPrecipitationMm:      avgPrecip,
    avgRainMm:               avg(days.map(d => d.rainMm)),
    avgSnowfallCm:           avgSnow,
    precipitationDisplay:    avgPrecip === 0 && avgSnow > 0 ? 'snow' : 'rain',
    avgSunshineDurationHrs:  avg(days.map(d => d.sunshineDurationHrs)),
    avgDaylightDurationHrs:  avg(days.map(d => d.daylightDurationHrs)),
    avgWindspeedMaxKmh:      avg(days.map(d => d.windspeedMaxKmh)),
    days,
  };
}
```

---

## 4. Local Time Utility

Add this pure utility function to `forecastData.ts`. It uses the browser's `Intl` API — no library needed — and derives the current local time at any IANA timezone.

```ts
export function getLocalTimeAtDestination(timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    weekday: 'short',
  }).format(new Date());
}
```

This is called inside the component on a 1-second interval (see Section 6) so the display stays live.

---

## 5. TanStack Query Hooks — `src/features/forecast/useForecast.ts`

Replace the single `useForecast` hook with two named exports. The original default export should be removed.

### `useGeocode`

```ts
export function useGeocode(query: string) {
  return useQuery({
    queryKey: ['forecast', 'geocode', query],
    queryFn:  () => fetchGeocodingResults(query),
    enabled:  query.trim().length >= 2,
    staleTime: 1000 * 60 * 60,  // 1 hour
    placeholderData: [],
  });
}
```

### `useClimateData`

```ts
export function useClimateData(
  location: GeoLocation | null,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['forecast', 'climate', location?.id, dateFrom, dateTo],
    queryFn:  () => fetchClimateData(location!, dateFrom, dateTo),
    enabled:  !!location && !!dateFrom && !!dateTo,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
```

---

## 6. Component — `src/features/forecast/ForecastTool.tsx`

### New local state

| State | Type | Initial | Purpose |
|---|---|---|---|
| `searchInput` | `string` | `''` | Controlled location search input |
| `debouncedSearch` | `string` | `''` | Debounced (250ms) version of `searchInput` |
| `selectedLocation` | `GeoLocation \| null` | `null` | Confirmed resolved location |
| `showSuggestions` | `boolean` | `false` | Controls geocoding dropdown visibility |
| `dateFrom` | `string` | today (`YYYY-MM-DD`) | Start date picker value |
| `dateTo` | `string` | today + 7 days (`YYYY-MM-DD`) | End date picker value |
| `localTime` | `string` | `''` | Live local time string at destination |

### Debounce pattern

```ts
useEffect(() => {
  const id = setTimeout(() => setDebouncedSearch(searchInput), 250);
  return () => clearTimeout(id);
}, [searchInput]);
```

### Local time tick

When `selectedLocation` is set, start a 1-second interval that updates `localTime` using `getLocalTimeAtDestination(selectedLocation.timezone)`. Clear the interval when `selectedLocation` changes or the component unmounts:

```ts
useEffect(() => {
  if (!selectedLocation) { setLocalTime(''); return; }
  setLocalTime(getLocalTimeAtDestination(selectedLocation.timezone)); // immediate
  const id = setInterval(() => {
    setLocalTime(getLocalTimeAtDestination(selectedLocation.timezone));
  }, 1000);
  return () => clearInterval(id);
}, [selectedLocation]);
```

### Hook wiring

```ts
const geocodeQuery  = useGeocode(debouncedSearch);
const climateQuery  = useClimateData(selectedLocation, dateFrom, dateTo);

const matchedEvents = useMemo(() =>
  selectedLocation
    ? getEventsForRange(selectedLocation.name, dateFrom, dateTo)
    : [],
  [selectedLocation, dateFrom, dateTo]
);
```

---

## 7. UI Layout & Display Spec

### Section 1 — Location search

- Text input bound to `searchInput`
- When `geocodeQuery.data` is non-empty and `showSuggestions` is true, render a suggestion dropdown
- Each suggestion displays `option.displayName` (includes `admin1` for disambiguation) with `option.population` formatted as a secondary label (e.g. "Pop. 1.6M")
- Results are already sorted by population descending from the fetch function — render in that order
- On selecting an option: set `selectedLocation`, set `searchInput` to `option.displayName`, close suggestions
- On clearing the input (empty string): reset `selectedLocation` to null

### Section 2 — Date range

- Two `<input type="date">` fields
- `dateFrom` min = today; `dateTo` min = `dateFrom`
- If user changes `dateFrom` to a date after `dateTo`, automatically advance `dateTo` to match

### Section 3 — Local time at destination

Only render when `selectedLocation` is not null.

Display:
```
📍 Barcelona, Catalonia, Spain
🕐 Mon, 02:45:30 PM  ← updates live every second from localTime state
```

### Section 4 — Results (only when `selectedLocation` is set)

**Display state priority:**

1. `climateQuery.isPending` → "Loading climate data..."
2. `climateQuery.isError` → error card with Retry button (`climateQuery.refetch()`)
3. `climateQuery.data` → render full results below

---

### Results layout when data is available

#### Summary card (always visible)

| Field | Value | Display rule |
|---|---|---|
| Avg High | `avgHighC °C` | Always shown |
| Avg Low | `avgLowC °C` | Always shown |
| Avg Mean | `avgMeanC °C` | Always shown |
| Precipitation | `avgPrecipitationMm mm/day` | Shown when `precipitationDisplay === 'rain'` |
| Snowfall | `avgSnowfallCm cm/day` | Shown when `precipitationDisplay === 'snow'` |
| Sunshine | `avgSunshineDurationHrs hrs/day` | Always shown |
| Daylight | `avgDaylightDurationHrs hrs/day` | Always shown |

#### Daily breakdown (one row per `DailyClimate` in `days[]`)

Each row shows:
- `date` (formatted from "MM-DD" to e.g. "Mar 15")
- `tempMaxC / tempMinC °C`
- Precipitation or snowfall depending on that day's `precipitationDisplay`
- `sunshineDurationHrs` hrs sun
- `daylightDurationHrs` hrs daylight

#### Collapsed "More Details" section

Rendered as a `<details>` / `<summary>` element below the daily breakdown. When expanded, shows the full data per day including fields not in the primary view:

| Field | Value |
|---|---|
| Avg Mean Temp | `tempMeanC °C` |
| Rainfall | `rainMm mm` (shown regardless of snow/rain display — raw breakdown) |
| Snowfall | `snowfallCm cm` (shown regardless — raw breakdown) |
| Total Precipitation | `precipitationMm mm` |
| Max Wind Speed | `windspeedMaxKmh km/h` |

The summary-level equivalents of these fields (`avgRainMm`, `avgWindspeedMaxKmh`, etc.) should also appear in a "More Details" toggle on the summary card, following the same pattern.

#### Events section

Only rendered when `matchedEvents.length > 0`. Shown between the summary card and the daily breakdown.

Each event card shows:
- `name` (prominent)
- `type` as a badge/tag
- `startDate` – `endDate` (formatted from "MM-DD" to "Mar 15" style)
- `description`

---

## 8. Caching Summary

| Query | `staleTime` | `gcTime` | Rationale |
|---|---|---|---|
| Geocoding | 1 hour | default | City metadata rarely changes |
| Climate data | `Infinity` | 24 hours | Historical averages are immutable |

---

## 9. Open-Meteo API Reference

### Geocoding

```
GET https://geocoding-api.open-meteo.com/v1/search
  ?name=Barcelona
  &count=5
  &language=en
  &format=json
```

Returns `results[]`. Each result includes: `id`, `name`, `country`, `country_code`, `admin1`, `latitude`, `longitude`, `timezone`, `population`.

### Climate

```
GET https://climate-api.open-meteo.com/v1/climate
  ?latitude=41.38
  &longitude=2.17
  &start_date=2000-03-15
  &end_date=2020-03-22
  &models=EC_Earth3P_HR
  &daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,
         precipitation_sum,rain_sum,snowfall_sum,
         sunshine_duration,daylight_duration,
         windspeed_10m_max
```

Returns a `daily` object with parallel arrays keyed by variable name. All array indices correspond. Note: `sunshine_duration` and `daylight_duration` are returned in **seconds** — divide by 3600 to get hours.

---

## 10. Files Changed Summary

| File | Change |
|---|---|
| `src/features/forecast/forecastData.ts` | Full replacement — remove static data, add `fetchGeocodingResults`, `fetchClimateData`, `getLocalTimeAtDestination` |
| `src/features/forecast/useForecast.ts` | Replace single hook with `useGeocode` and `useClimateData` named exports |
| `src/features/forecast/ForecastTool.tsx` | Add search, date pickers, live local time, full climate display with primary + collapsed detail sections, events |
| `src/features/forecast/forecastEvents.ts` | **New file** — hardcoded events dataset and `getEventsForRange` |
| `src/features/forecast/forecastTypes.ts` | **New file** — all shared types |
| `src/features/forecast/index.ts` | **No changes** |
| `src/routes/forecast.tsx` | **No changes** |
