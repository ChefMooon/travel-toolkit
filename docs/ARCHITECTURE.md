# Architecture

## Overview

MKT is a single-page React application with no backend. All state lives in the browser via Zustand's `persist` middleware, which serialises to `localStorage` on every change and rehydrates automatically on page load. The app is built with Vite and served as a static asset bundle from Cloudflare Workers.

---

## Component Tree

```
App
├── Topbar            Trip name, global markup, theme toggle, Start New Trip
├── ToastViewport     Global non-blocking notifications (success/warning/error)
├── RegionSelector    Geographic region picker for currency filtering
├── GroupSetup        Add / rename / reorder couples and non-paying travellers
├── CostLedger        Cost entry list with drag-and-drop (dnd-kit)
│   ├── CostRow       Read-only display row for a single cost entry
│   ├── EditRow       Inline edit form for a cost entry
│   └── BulkActionBar Floating bar shown when one or more cost entries are selected
└── CostSummary       Per-couple cost breakdown
    └── CoupleCard    Summary card for a single couple
```

Supporting primitives: `Modal` — shared confirmation / alert overlay used by Topbar, GroupSetup, and CostLedger. `ToastViewport` subscribes to `src/store/toastStore.ts` for ephemeral session notifications.

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
| `region` | `Region` | Active geographic region for currency filtering (e.g. 'North America', 'Europe', 'Asia') |

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
| `setRegion` | Update the active region to filter available currencies |
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

### Split Modal Behavior

When a cost is set to `subset` or `individual` split type, users open `SplitAssignmentModal` to select one or more couples. The modal enforces these rules:

- **`subset` mode**: Checkbox selection of multiple couples; requires at least one selection to confirm
- **`individual` mode**: Radio selection of exactly one couple; auto-closes and applies when a selection is made
- **Auto-reset on close**: If the modal is closed without any selections in `subset` or `individual` mode, the split type automatically resets to `shared` (with empty `assignedCoupleIds`)

This auto-reset prevents invalid cost states (e.g., a cost marked as `subset` but with no assigned couples). It allows users to change their mind about a split type without being forced to select groups.

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

## Region Filtering

Regions organize currencies by geography and are defined in `src/store/types.ts` as a mapping from region name to available currency codes:
- **North America**: CAD, USD
- **Europe**: EUR, GBP
- **Asia**: JPY, SGD, HKD, INR, THB
- **Oceania**: AUD, NZD
- **Americas**: MXN, BRL
- **Africa**: ZAR

CAD and USD are globally available in all regions as fallbacks. When a user selects a region via the `RegionSelector` component, the cost entry form displays currencies available in that region plus the always-available currencies. This streamlines the currency selection UX for users on multi-region trips.

---

## Toast Notifications

Global toasts are handled by `src/store/toastStore.ts` and rendered by `src/components/ToastViewport.tsx`.

- Toast state is **ephemeral** and intentionally not persisted to `localStorage`.
- Supported variants: `success`, `warning`, `error`.
- Each toast includes a title, message, and auto-dismiss duration.
- For save failures, `CostLedger` normalizes runtime/storage errors to user-friendly messages explaining why save failed.
- `EditRow` emits warning toasts for validation failures (missing name, invalid amount, missing assignment for subset/solo).

This design allows any component to emit a toast through a shared store while keeping trip data persistence isolated to `tripStore`.

---

## Responsive Design

The app uses a mobile-first responsive CSS approach:

1. **Mobile Card Layout** — Cost ledger displays as a card-based layout on small screens (defined in `src/index.css`), with each cost rendered as a horizontal card.
2. **Adaptive Grid** — Edit forms use responsive grid layout that adjusts field widths and spacing for different screen sizes.
3. **Toast Viewport Placement** — Toasts are fixed near the top of the viewport and repositioned by breakpoint to remain visible on mobile, tablet, and desktop without conflicting with sticky navigation.
4. **Theme-aware Styling** — All components use CSS custom properties (`--bg-1`, `--text`, `--border`, etc.) to adapt colors for light and dark modes without component-level logic.
5. **Touch-friendly** — Interactive elements use sufficient padding and border-radius for touch targets on mobile devices.

---

## Testing

The project uses **Vitest** as the test runner with React Testing Library for component testing.

### Test Files
- `src/**/*.test.tsx` — Unit and integration tests colocated with source files
- `src/integration.test.tsx` — High-level integration tests covering couple management, dark mode, and persistence

### Tested Areas (v1.0.1)
- Couple icon and color updates
- Dark mode theme toggling and persistence
- State persistence to `localStorage`
- CostRow component rendering and interactions

Run tests with `npm run test` or `npm run test:watch` for development.

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
