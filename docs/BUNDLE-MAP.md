# Bundle Map and Code-Splitting Reference

This document tracks how the app is split into browser bundles, what each bundle contains, and where the split logic is implemented.

Last updated: 2026-03-30

## How Bundling Works in This Repo

- Vite uses default Rollup chunking behavior.
- There are no custom chunk rules in [vite.config.ts](../vite.config.ts).
- Route registration is file-based and statically wired in [src/routeTree.gen.ts](../src/routeTree.gen.ts).
- The main bundle size optimization comes from route-level dynamic imports via `lazyRouteComponent` in route modules.

## Bundle Inventory

## 1. Initial Shell and Home Bundle

Contains:
- App bootstrap and router wiring
- Root shell layout and providers
- Home page route
- Shared shell UI used across all pages

Primary files:
- [src/main.tsx](../src/main.tsx)
- [src/router.tsx](../src/router.tsx)
- [src/routeTree.gen.ts](../src/routeTree.gen.ts)
- [src/routes/__root.tsx](../src/routes/__root.tsx)
- [src/routes/index.tsx](../src/routes/index.tsx)
- [src/components/Navbar/Navbar.tsx](../src/components/Navbar/Navbar.tsx)
- [src/components/GridPanel/GridPanel.tsx](../src/components/GridPanel/GridPanel.tsx)
- [src/components/ToastViewport/ToastViewport.tsx](../src/components/ToastViewport/ToastViewport.tsx)
- [src/lib/queryClient.ts](../src/lib/queryClient.ts)
- [src/lib/tools.ts](../src/lib/tools.ts)
- [src/index.css](../src/index.css)

Split behavior source:
- Root route: [src/routes/__root.tsx](../src/routes/__root.tsx#L65)
- Static home route: [src/routes/index.tsx](../src/routes/index.tsx#L29)

## 2. Trip Cost Route Bundle (/trip)

Contains:
- Trip route page entry
- Trip tool shell and core app
- Ledger, summary, and group management components
- Trip-specific modal/editing components
- Trip calculations and persisted trip state

Primary files:
- [src/routes/trip.tsx](../src/routes/trip.tsx)
- [src/features/trip/TripCostPage.tsx](../src/features/trip/TripCostPage.tsx)
- [src/App.tsx](../src/App.tsx)
- [src/components/TripToolbar/TripToolbar.tsx](../src/components/TripToolbar/TripToolbar.tsx)
- [src/components/GroupSetup/GroupSetup.tsx](../src/components/GroupSetup/GroupSetup.tsx)
- [src/components/CostLedger/CostLedger.tsx](../src/components/CostLedger/CostLedger.tsx)
- [src/components/CostSummary/CostSummary.tsx](../src/components/CostSummary/CostSummary.tsx)
- [src/lib/calculations.ts](../src/lib/calculations.ts)
- [src/store/tripStore.ts](../src/store/tripStore.ts)

Split behavior source:
- Lazy boundary: [src/routes/trip.tsx](../src/routes/trip.tsx#L3)

Notes:
- This is the heaviest route subtree because it includes the largest UI/component graph.
- It also reuses rate-query logic from currency feature via `useTripRates`.

## 3. Currency Route Bundle (/currency)

Contains:
- Currency converter UI
- Currency region selector
- Currency query hooks and API fetch helpers
- Currency persisted store

Primary files:
- [src/routes/currency.tsx](../src/routes/currency.tsx)
- [src/features/currency/CurrencyTool.tsx](../src/features/currency/CurrencyTool.tsx)
- [src/features/currency/CurrencyRegionSelector.tsx](../src/features/currency/CurrencyRegionSelector.tsx)
- [src/features/currency/useCurrencySnapshot.ts](../src/features/currency/useCurrencySnapshot.ts)
- [src/features/currency/useCurrencyMetadata.ts](../src/features/currency/useCurrencyMetadata.ts)
- [src/features/currency/useCurrencyProviders.ts](../src/features/currency/useCurrencyProviders.ts)
- [src/features/currency/currencyData.ts](../src/features/currency/currencyData.ts)
- [src/store/currencyStore.ts](../src/store/currencyStore.ts)

Split behavior source:
- Lazy boundary: [src/routes/currency.tsx](../src/routes/currency.tsx#L3)

## 4. Timezone Route Bundle (/timezone)

Contains:
- Timezone page entry and navbar
- Clock grid/cards and analog/digital renderers
- Timezone selector and zone option building
- Timezone utility functions and ticking hook
- Timezone persisted store

Primary files:
- [src/routes/timezone.tsx](../src/routes/timezone.tsx)
- [src/features/timezone/TimezonePage.tsx](../src/features/timezone/TimezonePage.tsx)
- [src/features/timezone/TimezoneNavbar.tsx](../src/features/timezone/TimezoneNavbar.tsx)
- [src/features/timezone/ClockGrid.tsx](../src/features/timezone/ClockGrid.tsx)
- [src/features/timezone/ClockCard.tsx](../src/features/timezone/ClockCard.tsx)
- [src/features/timezone/AnalogClock.tsx](../src/features/timezone/AnalogClock.tsx)
- [src/features/timezone/DigitalClock.tsx](../src/features/timezone/DigitalClock.tsx)
- [src/features/timezone/TimezoneSelect.tsx](../src/features/timezone/TimezoneSelect.tsx)
- [src/features/timezone/timezones.ts](../src/features/timezone/timezones.ts)
- [src/features/timezone/timezoneFormat.ts](../src/features/timezone/timezoneFormat.ts)
- [src/features/timezone/useClockTick.ts](../src/features/timezone/useClockTick.ts)
- [src/store/timezoneStore.ts](../src/store/timezoneStore.ts)

Split behavior source:
- Lazy boundary: [src/routes/timezone.tsx](../src/routes/timezone.tsx#L3)

Async sub-chunks:
- [src/features/timezone/ConfigModal/ConfigModal.tsx](../src/features/timezone/ConfigModal/ConfigModal.tsx)
- [src/features/timezone/ConfigModal/ZoneList.tsx](../src/features/timezone/ConfigModal/ZoneList.tsx)
- [src/features/timezone/ConfigModal/ZoneConfigRow.tsx](../src/features/timezone/ConfigModal/ZoneConfigRow.tsx)

Notes:
- The settings modal subtree is lazy-loaded from [src/features/timezone/TimezoneNavbar.tsx](../src/features/timezone/TimezoneNavbar.tsx).
- dnd-kit dependencies now load with the modal chunk on demand.

## 5. Forecast Route Bundle (/forecast)

Contains:
- Forecast page UI
- Geocode and climate query hooks
- Forecast data fetch and transformation logic
- Curated event overlay dataset and filtering

Primary files:
- [src/routes/forecast.tsx](../src/routes/forecast.tsx)
- [src/features/forecast/index.ts](../src/features/forecast/index.ts)
- [src/features/forecast/ForecastTool.tsx](../src/features/forecast/ForecastTool.tsx)
- [src/features/forecast/useForecast.ts](../src/features/forecast/useForecast.ts)
- [src/features/forecast/forecastData.ts](../src/features/forecast/forecastData.ts)
- [src/features/forecast/forecastEvents.ts](../src/features/forecast/forecastEvents.ts)
- [src/features/forecast/forecastTypes.ts](../src/features/forecast/forecastTypes.ts)

Split behavior source:
- Lazy boundary: [src/routes/forecast.tsx](../src/routes/forecast.tsx#L3)

## 6. XLSX Async Bundle (Import/Export)

Contains:
- The `xlsx` library runtime
- Import/export workbook pipeline modules
- Single-sheet and three-sheet parser/builder modules

Primary files:
- [src/components/SaveDataPanel/SaveDataPanel.tsx](../src/components/SaveDataPanel/SaveDataPanel.tsx)
- [src/lib/xlsx/importWorkbook.ts](../src/lib/xlsx/importWorkbook.ts)
- [src/lib/xlsx/exportWorkbook.ts](../src/lib/xlsx/exportWorkbook.ts)
- [src/lib/xlsx/singleSheetParser.ts](../src/lib/xlsx/singleSheetParser.ts)
- [src/lib/xlsx/threeSheetParser.ts](../src/lib/xlsx/threeSheetParser.ts)
- [src/lib/xlsx/singleSheetBuilder.ts](../src/lib/xlsx/singleSheetBuilder.ts)
- [src/lib/xlsx/threeSheetBuilder.ts](../src/lib/xlsx/threeSheetBuilder.ts)

Split behavior source:
- UI-level lazy import: [src/components/SaveDataPanel/SaveDataPanel.tsx](../src/components/SaveDataPanel/SaveDataPanel.tsx#L316)
- UI-level lazy import: [src/components/SaveDataPanel/SaveDataPanel.tsx](../src/components/SaveDataPanel/SaveDataPanel.tsx#L435)
- Library-level dynamic import of `xlsx`: [src/lib/xlsx/importWorkbook.ts](../src/lib/xlsx/importWorkbook.ts#L16)
- Library-level dynamic import of `xlsx`: [src/lib/xlsx/exportWorkbook.ts](../src/lib/xlsx/exportWorkbook.ts#L12)

Observed output (2026-03-30, `npx vite build`):
- `dist/assets/xlsx-CNerDvZX.js`: 429.19 kB (gzip 142.94 kB)
- `dist/assets/importWorkbook-CuiOgAOk.js`: 3.98 kB (gzip 1.85 kB)
- `dist/assets/exportWorkbook-iQSV1aFC.js`: 1.52 kB (gzip 0.77 kB)
- `dist/assets/singleSheetParser-hQn624z4.js`: 1.21 kB (gzip 0.67 kB)
- `dist/assets/threeSheetParser-zf-My3Tw.js`: 1.54 kB (gzip 0.82 kB)
- `dist/assets/singleSheetBuilder-B9KIXGjK.js`: 1.72 kB (gzip 0.83 kB)
- `dist/assets/threeSheetBuilder-BpARiPfK.js`: 1.18 kB (gzip 0.61 kB)

Notes:
- This keeps XLSX parsing/writing code out of the initial route shell and route entry bundles.
- The `xlsx` chunk is expected to be the largest single JS asset, but it should only load during workbook import/export flows.

## 7. Shared Vendor and Common Chunks

Contains:
- Third-party libraries shared across routes (React, TanStack Router, TanStack Query, Zustand, lucide-react, luxon)
- Any app modules Rollup hoists because multiple lazy routes import them

Notes:
- dnd-kit is no longer expected in shared vendor/common chunks because it is used only by the timezone settings async subtree.
- `xlsx` is not expected in shared vendor/common chunks; it should remain in the on-demand XLSX async subtree.

Behavior source:
- Default Vite/Rollup chunking, since there is no `build.rollupOptions.output.manualChunks` override in [vite.config.ts](../vite.config.ts)

## Where Code-Splitting Is Defined

Primary split points:
- [src/routes/trip.tsx](../src/routes/trip.tsx#L3)
- [src/routes/currency.tsx](../src/routes/currency.tsx#L3)
- [src/routes/timezone.tsx](../src/routes/timezone.tsx#L3)
- [src/routes/forecast.tsx](../src/routes/forecast.tsx#L3)

Route wiring and preload policy:
- [src/router.tsx](../src/router.tsx)
  - `defaultPreload: 'intent'` preloads routes on navigation intent, improving perceived load time.

## Quick Update Checklist

When adding a new tool page or changing route splits:
1. Add or update the route file under [src/routes](../src/routes).
2. Confirm whether the route uses `lazyRouteComponent` dynamic import.
3. List the new route bundle in this document with its primary feature files.
4. Run a production build and inspect output chunks to validate expected boundaries.
5. If custom `manualChunks` is added later, update this document's bundling model section.
6. Confirm the `xlsx` chunk remains on-demand and is not pulled into initial shell/common vendor output.
7. If `npm run build` fails due to type-check errors, run `npx vite build` for a temporary bundle-only size snapshot while fixing TypeScript separately.
