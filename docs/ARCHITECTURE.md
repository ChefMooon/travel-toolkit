# Architecture

## Overview

MKT is a single-page React application with no backend. All state lives in the browser via Zustand's `persist` middleware, which serialises to `localStorage` on every change and rehydrates automatically on page load. The app is built with Vite and served as a static asset bundle from Cloudflare Workers.

---

## Component Tree

```
App
├── Topbar            Trip name, global markup, theme toggle, Start New Trip
├── GroupSetup        Add / rename / reorder couples and non-paying travellers
├── CostLedger        Cost entry list with drag-and-drop (dnd-kit)
│   ├── CostRow       Read-only display row for a single cost entry
│   ├── EditRow       Inline edit form for a cost entry
│   └── BulkActionBar Floating bar shown when one or more cost entries are selected
└── CostSummary       Per-couple cost breakdown
    └── CoupleCard    Summary card for a single couple
```

Supporting primitives: `Modal` — shared confirmation / alert overlay used by Topbar, GroupSetup, and CostLedger.

---

## State (Zustand Store)

Defined in `src/store/tripStore.ts`. Persisted to `localStorage` under the key `mkt-trip-store` (Zustand default key from the store name).

### State Shape

| Field | Type | Description |
|---|---|---|
| `tripName` | `string` | Display name for the trip |
| `globalMarkup` | `number` | Default markup % applied to all costs |
| `couples` | `Couple[]` | Ordered list of paying couples |
| `nonPayingTravellers` | `NonPayingTraveller[]` | Non-paying travellers, each linked to a parent couple |
| `costs` | `CostEntry[]` | All cost entries |
| `exchangeRates` | `ExchangeRate[]` | Per-currency USD exchange rates entered by the user |
| `theme` | `'light' \| 'dark'` | Active UI theme |

Full type definitions are in `src/store/types.ts`.

### Key Actions

| Action | Description |
|---|---|
| `addCouple` / `removeCouple` / `renameCouple` | Manage paying couples |
| `reorderCouples` | Persist a new couple sort order |
| `addNonPayingTraveller` / `removeNonPayingTraveller` | Manage non-paying travellers |
| `addCost` / `editCost` / `deleteCost` | Manage cost entries |
| `reorderCosts` | Persist a new cost sort order after drag-and-drop |
| `bulkSetCurrency` | Apply a currency to an array of cost IDs in one action |
| `setExchangeRate` | Set or update the USD rate for a given currency |
| `resetTrip` | Clear all state and `localStorage`; return to initial values |

---

## Cost Splitting

Core logic lives in `src/lib/calculations.ts`. The main entry point for building the per-couple summary is `buildSummary`.

### Split Types

| Split type | Who pays | Divisor |
|---|---|---|
| `shared` | All paying couples | `couples.length` |
| `subset` | Selected paying couples only | `assignedCoupleIds.length` |
| `individual` | Single couple, no division | 1 |

Non-paying travellers are never included in the divisor regardless of split type.

### Markup

```
effectiveMarkup = cost.markupOverride !== null ? cost.markupOverride : globalMarkup
finalCost = baseValue × (1 + effectiveMarkup / 100)
```

### Rounding

Half-up rounding to 2 decimal places (`roundHalfUp` in `calculations.ts`). Where the rounded per-couple amount multiplied back produces a remainder versus the true total, the difference is added to the **first couple** in the list. This guarantees the sum of all per-couple shares always equals the total cost exactly.

---

## Currency Handling

Costs retain their original currency code and are never automatically converted. The `CostSummary` component groups each couple's costs by currency and shows:

1. Per-currency subtotals (shared + subset + individual buckets)
2. USD equivalents — computed only after the user supplies an exchange rate for that currency
3. Grand total USD across all currencies (shown only when all currencies have rates)

No aggregation across currencies occurs until the user provides exchange rates.

---

## Data Persistence

Zustand's `persist` middleware serialises the entire store to `localStorage` as JSON on every state change. On page load, the middleware rehydrates automatically — no explicit save action is needed.

The **Start New Trip** action calls `resetTrip()`, which:
1. Resets all state fields to their initial values (empty arrays, default markup, etc.)
2. Clears the `localStorage` key via Zustand's `persist` `clearStorage` utility

---

## Deployment

The app is a fully static output (`dist/`). `wrangler.toml` configures Cloudflare Workers to serve the `dist/` directory as a static asset bundle. No serverless functions are used.

```toml
name = "mkt"
compatibility_date = "2024-01-01"

[assets]
directory = "./dist"
```

Build and deploy:

```sh
npm run build
wrangler deploy
```
