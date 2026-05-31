# Data Sources and APIs

This project does not use a project-owned backend or database. All runtime data comes from a mix of third-party APIs, checked-in datasets, and browser-provided APIs/state.

## Runtime Data Inventory

| Surface | Source | Type | Used by | Notes |
|---|---|---|---|---|
| Currency exchange rates | Frankfurter v2 API (`/v2/rates`) | External HTTP API | `CurrencyTool` via `useCurrencySnapshot` | Fetches live rates for the selected base currency scoped to region-visible currencies. Cached 5 minutes and auto-refetched while the page is open; also refetched on base or region change. |
| Trip Cost exchange rates | Frankfurter v2 API (`/v2/rates`) | External HTTP API | `CostSummary` via `useTripRates` | Fetches live rates base=USD for the trip region currencies. Shares TanStack Query cache with `useCurrencySnapshot('USD', region)`. Cached 5 minutes; auto-refetched on window focus. |
| Currency metadata | Frankfurter v2 API (`/v2/currencies`) | External HTTP API | `CurrencyTool` via `useCurrencyMetadata` | Full currency names and symbols used in dropdowns. Cached 24 hours; fetched once per session. |
| Currency providers | Frankfurter v2 API (`/v2/providers`) | External HTTP API | `CurrencyTool` via `useCurrencyProviders` | Provider list with source links and per-provider currency coverage. Filtered client-side to show providers relevant to the selected pair. Cached 24 hours. |
| Currency converter state | Browser `localStorage` via Zustand `persist` | Browser storage | [src/store/currencyStore.ts](../src/store/currencyStore.ts) | Persists the selected region, last-used amount, base currency, and target currency under `travel-toolkit-currency-data`. On page reload the converter restores exactly where the user left off. When the region changes, any stored currency not available in the new region is reset to a valid default. |
| Destination search | Open-Meteo geocoding API | External HTTP API | Forecast destination search in [src/features/forecast/forecastData.ts](../src/features/forecast/forecastData.ts) | Called with the user’s search query to resolve candidate destinations, coordinates, timezone, and population. |
| Climate summary | Open-Meteo climate API | External HTTP API | Forecast climate lookup in [src/features/forecast/forecastData.ts](../src/features/forecast/forecastData.ts) | Called with destination coordinates and the selected date range. The implementation requests daily climate variables and averages them across matching month/day windows. |
| Forecast events | Checked-in event list generated from an external CSV source | Local generated dataset | Forecast event overlay in [src/features/forecast/forecastEvents.ts](../src/features/forecast/forecastEvents.ts) | Runtime code filters the generated event list by destination and date range. The source sheet is synced by [scripts/sync-forecast-events.mjs](../scripts/sync-forecast-events.mjs). |
| Trip state | Browser `localStorage` via Zustand `persist` | Browser storage | [src/store/tripStore.ts](../src/store/tripStore.ts) | Persists trip name, markup, couples, costs, exchange rates, theme, region, and `targetCurrency` under `travel-toolkit-trip-data`. `isOverridden` flag on exchange rate entries is backward-compatible with existing persisted data. |
| Timezone state | Browser `localStorage` via Zustand `persist` | Browser storage | [src/store/timezoneStore.ts](../src/store/timezoneStore.ts) | Persists the local timezone preference and tracked timezone cards under `travel-toolkit-timezone-data`. |

## External APIs

### Frankfurter API

#### Exchange Rates

- Endpoint: `https://api.frankfurter.dev/v2/rates`
- Location: [src/features/currency/currencyData.ts](../src/features/currency/currencyData.ts)
- Purpose: Fetch live exchange rates for the currency converter
- Input: `base` (selected base currency ISO code), `quotes` (comma-separated region-scoped target currencies)
- Output used: `date` (mapped to `updatedAt`), `quote` and `rate` pairs from the response array
- Cache: `staleTime: 5 minutes`; refetched every 5 minutes while the currency page is mounted, paused in hidden tabs, and refetched when base currency or region changes (`queryKey` includes both)

#### Trip Cost Exchange Rates (`useTripRates`)

- Endpoint: `https://api.frankfurter.dev/v2/rates`
- Location: [src/features/currency/useTripRates.ts](../src/features/currency/useTripRates.ts)
- Purpose: Auto-hydrate live exchange rates for the Trip Cost tool (base=USD, region currencies)
- Input: `base=USD`, `quotes` = region currencies minus USD
- Output used: `rates` Record inverted to `rateToUSD` (e.g. `rates['EUR'] = 0.91` → stored `rateToUSD = 1/0.91`)
- Cache: `queryKey: ['currency', 'snapshot', 'USD', region]` — intentionally matches `useCurrencySnapshot('USD', region)` so the TanStack Query cache is shared when the currency page also has base=USD; `staleTime: 5 minutes`, refetched every 5 minutes on window focus

#### Currency Metadata

- Endpoint: `https://api.frankfurter.dev/v2/currencies`
- Location: [src/features/currency/currencyData.ts](../src/features/currency/currencyData.ts)
- Purpose: Fetch full currency names and symbols for display in dropdowns
- Input: None
- Output used: `iso_code`, `name`, `symbol`
- Cache: `staleTime: 24 hours`; fetched once per session

#### Currency Providers

- Endpoint: `https://api.frankfurter.dev/v2/providers`
- Location: [src/features/currency/currencyData.ts](../src/features/currency/currencyData.ts)
- Purpose: List all data sources behind the Frankfurter rates; displayed in the Data Sources section of the currency page
- Input: None
- Output used: `key`, `name`, `data_url`, `currencies` (used client-side to filter providers that cover the selected base and target currency)
- Cache: `staleTime: 24 hours`; fetched once per session

### Open-Meteo Geocoding API

- Endpoint: `https://geocoding-api.open-meteo.com/v1/search`
- Location: [src/features/forecast/forecastData.ts](../src/features/forecast/forecastData.ts)
- Purpose: Search destinations for the forecast tool
- Input: search text, result count, language, and JSON format flag
- Output used: `id`, `name`, `country`, `country_code`, `admin1`, `latitude`, `longitude`, `timezone`, and `population`

### Open-Meteo Climate API

- Endpoint: `https://climate-api.open-meteo.com/v1/climate`
- Location: [src/features/forecast/forecastData.ts](../src/features/forecast/forecastData.ts)
- Purpose: Fetch climate averages for a destination and date window
- Input: latitude, longitude, baseline start and end dates, model, and daily metric list
- Output used: daily temperature, precipitation, rainfall, snowfall, sunshine duration, daylight duration, and windspeed series

## In-Repo Datasets

### Forecast events

The forecast tool overlays a small set of curated events from [src/features/forecast/forecastEvents.ts](../src/features/forecast/forecastEvents.ts). The file is generated by [scripts/sync-forecast-events.mjs](../scripts/sync-forecast-events.mjs) from a CSV source referenced by the `FORECAST_SHEET_URL` environment variable.

The sync script validates each row, keeps only supported event types, and rewrites the checked-in TypeScript dataset.

#### Syncing the dataset locally

- Run `npm run sync:events` from the project root.
- The script reads `FORECAST_SHEET_URL` from [./.env](../.env) via Node's `--env-file` support.
- The workspace requires Node 22.12 or later.
- The spreadsheet columns must be ordered as: ID, Name, Location Key, Start Date, End Date, Year, Description, Type.
- Events with the same ID can appear in multiple years; runtime matching prefers a year-specific row and falls back to the widest date range.

## Browser and Runtime APIs

### Timezone and date APIs

- `Intl.DateTimeFormat().resolvedOptions().timeZone` is used to detect the user’s local timezone in [src/store/timezoneStore.ts](../src/store/timezoneStore.ts) and [src/features/timezone/timezones.ts](../src/features/timezone/timezones.ts)
- `Intl.supportedValuesOf('timeZone')` is used in [src/features/timezone/timezones.ts](../src/features/timezone/timezones.ts) to build the available timezone list when the browser supports it
- `Intl.DateTimeFormat` is used for time and date formatting in [src/features/forecast/forecastData.ts](../src/features/forecast/forecastData.ts) and [src/features/forecast/ForecastTool.tsx](../src/features/forecast/ForecastTool.tsx)

### Storage and IDs

- Zustand `persist` writes trip and timezone state to `localStorage`
- `crypto.randomUUID()` is used for generated IDs in [src/store/tripStore.ts](../src/store/tripStore.ts), [src/store/timezoneStore.ts](../src/store/timezoneStore.ts), and [src/features/timezone/timezones.ts](../src/features/timezone/timezones.ts)

### Network requests

- The currency converter uses the browser `fetch` API for Frankfurter v2 requests in [src/features/currency/currencyData.ts](../src/features/currency/currencyData.ts)
- The forecast tool uses the browser `fetch` API for Open-Meteo requests in [src/features/forecast/forecastData.ts](../src/features/forecast/forecastData.ts)
- The forecast sync script uses Node’s built-in `fetch` to download the CSV source in [scripts/sync-forecast-events.mjs](../scripts/sync-forecast-events.mjs)

## Summary

- Currency conversion uses live rates from the Frankfurter v2 API; metadata and providers are cached for 24 hours, and rates refresh every 5 minutes while the currency page is open
- Forecast search and climate data are fetched live from Open-Meteo
- Forecast events are sourced externally but committed into the repo as generated data
- Trip, timezone, and currency region tools persist only in the browser
- There is no first-party API server in this repository