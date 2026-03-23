# Tool Pages: Data & Query Logic

Reference for how the three utility tool pages — Currency Converter, Timezone Converter, and Destination Forecast — are built, where their data comes from, and how TanStack Query and TanStack Router are wired together.

---

## TanStack Shared Infrastructure

Before diving into each tool, here is the shared setup that all three rely on.

### QueryClient (`src/lib/queryClient.ts`)

A single `QueryClient` is created once per session inside `RootLayout` (via `useState`) and passed to all descendants through `QueryClientProvider`.

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,         // 1 minute default
      retry: 1,                  // retry failed fetches once
      refetchOnWindowFocus: false,
    },
  },
})
```

Each tool hook overrides `staleTime` to **5 minutes** (`1000 * 60 * 5`), which takes precedence over the global default.

### Provider (`src/routes/__root.tsx`)

`QueryClientProvider` wraps the root layout, so every route shares the same cache. In dev mode, `ReactQueryDevtools` and `TanStackRouterDevtools` are also mounted here.

### Router (`src/router.tsx`)

Built with `createRouter` from `@tanstack/react-router`. Key options:

| Option | Value | Effect |
|---|---|---|
| `scrollRestoration` | `true` | Restores scroll position on back/forward |
| `defaultPreload` | `'intent'` | Preloads a route's data on hover or focus of its link |
| `defaultPreloadStaleTime` | `0` | Always re-fetches preloaded data on navigation |

Routes are auto-generated into `src/routeTree.gen.ts` by the TanStack Router Vite plugin and registered via `createFileRoute` in each route file.

---

## Currency Converter

### Files

| File | Role |
|---|---|
| `src/features/currency/currencyData.ts` | Static rate data + fetch function |
| `src/features/currency/useCurrencySnapshot.ts` | TanStack Query hook |
| `src/features/currency/CurrencyTool.tsx` | UI component |
| `src/routes/currency.tsx` | Route definition |

### Data Source

All exchange rates are **hardcoded static data** inside `currencyData.ts`. There is no external API call.

Six base currencies are supported: `USD`, `EUR`, `GBP`, `CAD`, `JPY`, `AUD`. Each base has a full rate table to all six currencies stored in `RATE_SNAPSHOTS`.

`fetchCurrencySnapshot(base)` simulates a network request with a **180 ms artificial delay** then returns:

```ts
{
  base: SupportedCurrency,
  updatedAt: string,        // always "Updated moments ago"
  rates: Record<SupportedCurrency, number>
}
```

Throws if an unsupported base currency is passed.

### TanStack Query Hook (`useCurrencySnapshot`)

```ts
useQuery({
  queryKey: ['currency', 'snapshot', baseCurrency],
  queryFn: () => fetchCurrencySnapshot(baseCurrency),
  staleTime: 1000 * 60 * 5,   // 5 minutes
})
```

- The query key includes `baseCurrency`, so **each base currency gets its own cache entry**. Switching the base triggers a new fetch (or a cache hit if previously selected).
- `staleTime: 5 min` means cached results are reused without a network call for up to 5 minutes.

### Component Logic (`CurrencyTool`)

Three pieces of local state:

| State | Initial | Controls |
|---|---|---|
| `amountInput` | `'100'` | Text input for the amount |
| `baseCurrency` | `'USD'` | "From" select dropdown |
| `targetCurrency` | `'EUR'` | "To" select dropdown |

`amount` is derived by parsing `amountInput` through `parseAmount`, which coerces invalid or negative inputs to `0`.

`converted` is a `useMemo` that multiplies `amount` by `query.data.rates[targetCurrency]`. It recalculates whenever `amount`, the query data, or `targetCurrency` changes. Only `baseCurrency` triggers a new fetch — changing `targetCurrency` just re-reads from the already-fetched rates table.

Display states:
- **`query.isPending`** → "Loading rates..."
- **`query.isError`** → error card with a Retry button (`query.refetch()`)
- **`query.data`** → rate snapshot card showing the converted amount and the raw rate (formatted with `Intl.NumberFormat`)

---

## Destination Forecast

### Files

| File | Role |
|---|---|
| `src/features/forecast/forecastData.ts` | Static forecast data + fetch function |
| `src/features/forecast/useForecast.ts` | TanStack Query hook |
| `src/features/forecast/ForecastTool.tsx` | UI component |
| `src/features/forecast/index.ts` | Re-exports `ForecastTool` as default |
| `src/routes/forecast.tsx` | Route definition |

### Data Source

Forecast data is **hardcoded static data** in `forecastData.ts`. Three destinations are available:

| Destination | Pack Note |
|---|---|
| Barcelona | Light jacket + compact umbrella |
| Tokyo | Layer for warm days and cooler evenings |
| Reykjavik | Waterproof shell and warm layers |

Each destination has a **3-day forecast** with `dateLabel`, `condition`, `highC`, and `lowC` fields.

`fetchForecast(destination)` simulates a network call with a **170 ms artificial delay** and returns the matching `ForecastSummary` or `null` if not found.

`FORECAST_DESTINATIONS` is the exported list of destination strings derived from the array — used to populate the dropdown.

### TanStack Query Hook (`useForecast`)

```ts
useQuery({
  queryKey: ['forecast', destination],
  queryFn: () => fetchForecast(destination),
  staleTime: 1000 * 60 * 5,   // 5 minutes
})
```

- One cache entry per destination string.
- Returns `null` (not an error) when the destination is not found — the component handles this as its own display state.

### Component Logic (`ForecastTool`)

One piece of local state:

| State | Initial |
|---|---|
| `destination` | First entry in `FORECAST_DESTINATIONS` (`'Barcelona'`) |

Display states:
- **`query.isPending`** → "Loading forecast..."
- **`query.isError`** → "Unable to load forecast right now."
- **`query.data === null`** → "No forecast available for this destination."
- **`query.data` (truthy)** → card with a `<ul>` of days showing high/low temperatures in Celsius and the packing note

---

## Timezone Converter

### Files

| File | Role |
|---|---|
| `src/features/timezone/timezoneData.ts` | Static timezone entries + search function |
| `src/features/timezone/useTimezoneMatches.ts` | TanStack Query hook |
| `src/features/timezone/TimezoneTool.tsx` | UI component |
| `src/routes/timezone.tsx` | Route definition |

### Data Source

Seven cities are hardcoded in `timezoneData.ts`, each with a city name, country, and an **IANA timezone identifier**:

| City | Country | IANA Timezone |
|---|---|---|
| New York | United States | `America/New_York` |
| London | United Kingdom | `Europe/London` |
| Tokyo | Japan | `Asia/Tokyo` |
| Sydney | Australia | `Australia/Sydney` |
| Barcelona | Spain | `Europe/Madrid` |
| Sao Paulo | Brazil | `America/Sao_Paulo` |
| Cape Town | South Africa | `Africa/Johannesburg` |

`fetchTimezoneMatches(searchTerm)` simulates a network call with a **150 ms artificial delay**:
- If `searchTerm` is blank → returns the **first 4 entries** as a default list
- Otherwise → filters by case-insensitive substring match on `city` or `country`

### TanStack Query Hook (`useTimezoneMatches`)

```ts
const normalizedSearchTerm = searchTerm.trim().toLowerCase();

useQuery({
  queryKey: ['timezone', 'matches', normalizedSearchTerm],
  queryFn: () => fetchTimezoneMatches(normalizedSearchTerm),
  staleTime: 1000 * 60 * 5,   // 5 minutes
})
```

- The hook normalizes the search term (trim + lowercase) **before** it reaches the query key and the fetch function. This means `"  Tokyo  "` and `"tokyo"` share the same cache entry.
- One cache entry per unique normalized search string.

### Component Logic (`TimezoneTool`)

Two pieces of local state:

| State | Initial | Controls |
|---|---|---|
| `searchTerm` | `''` | City/country text input |
| `referenceTime` | Current local datetime | `datetime-local` input |

`referenceDate` is a `useMemo` that parses `referenceTime` into a `Date` object. Falls back to `new Date()` if the string is not a valid date.

`toLocalDatetimeInputValue(date)` formats a `Date` into the `YYYY-MM-DDTHH:mm` string that `<input type="datetime-local">` requires — accounting for local month/day/hour padding.

`formatCityTime(timezone, referenceDate)` uses `Intl.DateTimeFormat` with a specific `timeZone` option to convert the reference date into the destination's local time. No external date library is used — this is pure browser API.

Display states:
- **`query.isPending`** → "Looking up destinations..."
- **`query.isError`** → "Unable to load timezone destinations right now."
- **`query.data?.length === 0`** → "No destinations matched your search."
- **`query.data?.length > 0`** → card with `<ul>` showing each city's local time for the chosen reference moment

---

## Summary Comparison

| | Currency | Forecast | Timezone |
|---|---|---|---|
| **Data source** | Hardcoded rate tables | Hardcoded forecast array | Hardcoded city list |
| **Fetch delay** | 180 ms | 170 ms | 150 ms |
| **Cache key** | `['currency', 'snapshot', base]` | `['forecast', destination]` | `['timezone', 'matches', term]` |
| **staleTime** | 5 min | 5 min | 5 min |
| **Re-fetches on** | Base currency change | Destination change | Search term change |
| **Null result?** | No (throws) | Yes (`null`) | No (empty array) |
| **Client-side computation** | `Intl.NumberFormat` for display | None | `Intl.DateTimeFormat` per city |
| **Local state** | amount, base, target | destination | searchTerm, referenceTime |
