# Architecture

## Overview

MKT is a travel-focused web app built as a set of routed tools under one shared TanStack Start shell. The current app includes a trip cost splitter, a currency converter, a timezone tracker, and a destination forecast tool. Persistent client state is stored locally with Zustand where appropriate, while async feature data is handled through TanStack Query.

## Runtime Model

- **Framework**: TanStack Start with React and file-based routing
- **Shared shell**: The root route provides the HTML document, theme bootstrap script, navigation, toast viewport, and route outlet
- **Async data**: TanStack Query manages remote and query-backed feature data
- **Client state**: Zustand stores persist trip data and timezone configuration to `localStorage`
- **Deployment target**: Cloudflare Workers using the TanStack Start server entry

The app has no project-owned backend or database. Some features fetch third-party data directly from the client, while others use in-repo datasets.

## Route Map

| Route | Module | Responsibility |
|---|---|---|
| `/` | `src/routes/index.tsx` | Travel Toolkit launcher page |
| `/trip` | `src/routes/trip.tsx` | Trip cost workflow |
| `/currency` | `src/routes/currency.tsx` | Currency converter |
| `/timezone` | `src/routes/timezone.tsx` | Timezone tracker |
| `/forecast` | `src/routes/forecast.tsx` | Destination forecast |

Tool metadata for labels, descriptions, and icons is centralized in `src/lib/tools.ts` and reused by the landing page and grid navigation.

## Shared App Shell

The root layout in `src/routes/__root.tsx` owns the shared runtime setup:

- Creates the TanStack Query client
- Injects the initial theme bootstrap script before hydration
- Renders the top navigation and route outlet inside a common app shell
- Mounts `ToastViewport` once for cross-tool notifications
- Enables React Query and TanStack Router devtools in development only

This allows each feature route to stay focused on its tool-specific UI while sharing the same document shell and navigation model.

## Feature Modules

### Trip Cost

The `/trip` route renders `TripToolbar` plus the existing cost-splitting application in `src/App.tsx`.

Key responsibilities:

- Manage trip groups, including non-paying travellers
- Record cost entries with shared, subset, or individual assignment
- Support per-trip and per-entry markup
- Group totals by original currency and compute USD totals from user-entered exchange rates
- Persist trip state between sessions

Primary modules:

- `src/components/GroupSetup`
- `src/components/CostLedger`
- `src/components/CostSummary`
- `src/store/tripStore.ts`
- `src/lib/calculations.ts`

### Currency Converter

The `/currency` route renders `CurrencyTool`, a focused converter for six supported currencies.

Key responsibilities:

- Accept a base amount and two selected currencies
- Load snapshot rate data through TanStack Query
- Show the current conversion and base-to-target rate
- Handle retry UI when the query fails
- Persist the selected amount, base currency, target currency, and region across page reloads via `useCurrencyStore`

Primary modules:

- `src/features/currency/CurrencyTool.tsx`
- `src/store/currencyStore.ts`

### Timezone Tracker

The `/timezone` route renders a configurable clock dashboard.

Key responsibilities:

- Save a local timezone preference
- Add, remove, rename, and reorder tracked zones
- Switch each zone between analog and digital display
- Toggle per-zone UTC, date, and seconds visibility
- Persist timezone configuration across sessions

Primary modules:

- `src/features/timezone/TimezoneNavbar.tsx`
- `src/features/timezone/ClockGrid.tsx`
- `src/features/timezone/ConfigModal`
- `src/store/timezoneStore.ts`

### Destination Forecast

The `/forecast` route renders a destination lookup and climate summary workflow.

Key responsibilities:

- Search destinations through geocoding
- Select a travel date range
- Fetch climate averages for that destination and date window
- Display local time, climate summary metrics, and daily breakdowns
- Overlay curated events that match the selected destination and date range

Forecast data is a mixed model:

- Geocoding and climate summaries are fetched from Open-Meteo APIs
- Event overlays come from the local `forecastEvents.ts` dataset

## State Ownership

### Persisted stores

| Store | Storage key | Purpose |
|---|---|---|
| `src/store/tripStore.ts` | `mkt-trip-data` | Trip cost data, theme, exchange rates, and region selection |
| `src/store/timezoneStore.ts` | `mkt-timezone-data` | Local timezone preference and tracked timezone cards |
| `src/store/currencyStore.ts` | `mkt-currency-data` | Selected region, last-used amount, base currency, and target currency for the currency converter |

### Ephemeral stores

| Store | Purpose |
|---|---|
| `src/store/toastStore.ts` | In-memory notification queue for success, warning, and error toasts |

### Query-managed data

TanStack Query handles feature data that does not belong in a persisted store:

- Currency snapshot queries
- Forecast geocoding lookups
- Forecast climate queries

## Trip Cost Domain Logic

Core trip calculations live in `src/lib/calculations.ts`.

### Split types

| Split type | Who pays | Divisor |
|---|---|---|
| `shared` | All paying groups | `couples.length` |
| `subset` | Selected paying groups only | `assignedCoupleIds.length` |
| `individual` | One selected group | `1` |

Non-paying travellers are never included in the divisor.

### Markup

```text
effectiveMarkup = cost.markupOverride !== null ? cost.markupOverride : globalMarkup
finalCost = baseValue × (1 + effectiveMarkup / 100)
```

### Currency handling inside the trip tool

- Cost entries retain their original currency code
- USD totals are computed only after the user supplies exchange rates for each currency in the trip ledger
- Grand USD totals appear only when all currencies in scope have rates

### Rounding

Half-up rounding is used for per-group cost allocation. Any remainder introduced by rounding is applied to the first group so that distributed totals still match the original total exactly.

## External Data and Integrations

| Feature | Data source | Notes |
|---|---|---|
| Currency converter | Local snapshot dataset | Simulated rate snapshots shipped with the app |
| Forecast geocoding | Open-Meteo geocoding API | Direct client fetch |
| Forecast climate | Open-Meteo climate API | Direct client fetch using selected location and date range |
| Forecast events | Local generated dataset | Refreshed through `scripts/sync-forecast-events.mjs` |

## Persistence and Storage

- Zustand `persist` rehydrates trip and timezone state automatically on page load
- Theme is restored before hydration through an inline bootstrap script in the root route
- Toasts are intentionally not persisted
- Query results are cached in memory by TanStack Query according to feature-specific query settings

The trip reset flow restores the trip store to its initial state while preserving the currently active theme.

## Testing

The repo uses Vitest and React Testing Library for unit, component, and integration coverage. Tests are colocated with feature modules and shared components, with additional integration coverage at the app level.

## Deployment

MKT is deployed to Cloudflare Workers through the TanStack Start server entry configured in `wrangler.toml`:

```toml
name = "mkt"
compatibility_date = "2025-09-02"
compatibility_flags = ["nodejs_compat"]
main = "@tanstack/react-start/server-entry"
```

`vite.config.ts` enables the Cloudflare Vite plugin in SSR mode alongside the TanStack Start plugin. The build produces separate client and server outputs under `dist/client` and `dist/server`.

Build and deploy:

```sh
npm run build
wrangler deploy
```

## Architecture Boundaries

- No first-party backend API or database is defined in this repo
- Remote data access is limited to direct client fetches for forecast data
- The currency converter currently uses shipped snapshot data rather than a live rates service
- The trip and timezone tools are fully client-side and persist locally in the browser
