# Plan: Shared Currency Layer + Trip Cost Live Rates

## TL;DR
Extract a shared Frankfurter fetch layer, add a `useTripRates` hook for trip cost's region currencies (base=USD), wire it into the trip store with auto-hydration + manual override, add a selectable grand-total currency defaulting to USD, a Frankfurter disclaimer footer in CostSummary, and replace the manual rate inputs in CoupleCard with a smart live/override display.

---

## Phase 1 — Shared Currency Client (parallel with nothing, blocks Phases 2–5)

1. Create `src/features/currency/useTripRates.ts`
   - Calls `fetchCurrencySnapshot('USD', getAvailableCurrencies(region).filter(c => c !== 'USD'))`
   - Query key: `['currency', 'snapshot', 'USD', region]` — intentionally matches `useCurrencySnapshot('USD', region)` so TanStack Query cache is shared when currency page also has base=USD
   - Settings: `staleTime: 5min`, `refetchInterval: 5min`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`
   - Returns `CurrencySnapshotResponse` (same type already in currencyData.ts)
   - Note: response `rates['EUR'] = 0.91` means 1 USD = 0.91 EUR → `rateToUSD_EUR = 1 / 0.91`

---

## Phase 2 — Type System + Store + Calculations (depends on Phase 1)

2. Update `src/store/types.ts`
   - `ExchangeRate`: add `isOverridden?: boolean` (optional for backward compat with persisted data)
   - `CurrencyBreakdown`: rename `usdEquivalent` → `targetEquivalent`
   - `CoupleSummary`: rename `grandTotalUSD` → `grandTotal`; add `targetCurrency: string`

3. Update `src/lib/calculations.ts`
   - `buildSummary` signature: add `targetCurrency: string = 'USD'` parameter
   - New conversion formula: `targetEquivalent = subtotal * rateToUSD[currency] / rateToUSD[targetCurrency]` where `rateToUSD['USD'] = 1` always
   - `rateForTarget = targetCurrency === 'USD' ? 1 : rateMap.get(targetCurrency)` — if missing, `targetEquivalent = null`
   - `grandTotal` inherits same null-propagation logic as old `grandTotalUSD`
   - Propagate `targetCurrency` into each returned `CoupleSummary`

4. Update `src/store/tripStore.ts`
   - Add `targetCurrency: string` to `TripStore` interface and `initialState` (default `'USD'`)
   - Add `setTargetCurrency(currency: string)` action
   - Add `hydrateExchangeRates(freshRates: Record<string, number>)` action:
     - `freshRates['EUR'] = 0.91` → store `rateToUSD = 1/0.91` only for non-overridden entries
     - Also inserts entries for new currencies not yet in store (with `isOverridden: false`)
     - Skips currencies where `isOverridden === true`
   - Update `setExchangeRate`: add `isOverridden = true` flag (marks rate as user-supplied)
   - Add `clearExchangeRateOverride(currency: string)` action: sets `isOverridden = false` and re-exposes the hydrated rate on next effect cycle
   - `resetTrip` resets `targetCurrency` to `'USD'`

---

## Phase 3 — CostSummary UI (depends on Phase 2)

5. Update `src/components/CostSummary/CostSummary.tsx`
   - Read `region` and `targetCurrency` from `useTripStore`
   - Call `useTripRates(region)` hook
   - Add `useEffect` on `tripsRatesQuery.data`: when data arrives, call `hydrateExchangeRates(tripsRatesQuery.data.rates)`
   - Pass `targetCurrency` into `buildSummary(..., targetCurrency)`
   - Add target currency dropdown **above** the couple cards:
     - Label: "Convert to"
     - Options: `getAvailableCurrencies(region)` (includes USD always)
     - Calls `setTargetCurrency` on change
     - Default: 'USD'
   - Add Frankfurter disclaimer **footer** below couple cards (only render when `tripsRatesQuery.data` exists):
     - "Rates sourced from [Frankfurter](https://frankfurter.dev)" with collapsible details (same style as CurrencyTool's `detailsOpen` toggle)
     - Details text: same ECB/update cadence copy as CurrencyTool
     - Show rate date (`tripsRatesQuery.data.updatedAt`) and "Retrieved [time]" (`fetchedAt`)
   - When `tripsRatesQuery.isPending`: show subtle loading indicator near the footer area (not blocking the whole card)
   - When `tripsRatesQuery.isError`: show small inline error with "Retry" button; manual overrides still work

---

## Phase 4 — CoupleCard UI (depends on Phase 2, parallel with Phase 3)

6. Update `src/components/CoupleCard/CoupleCard.tsx`
   - Pull `targetCurrency` from `useTripStore`
   - Grand total section: label becomes `"Grand Total"` with sub-label `"(${targetCurrencySymbol})"` when target ≠ USD; amount formatted in target currency symbol using `CURRENCY_SYMBOLS`
   - Per-currency rate row replaces current `<input>` with smart display:
     - **Auto state** (`isOverridden` falsy, rate exists): `"1 EUR = 1.0899 USD"` as text + small pencil/edit icon
     - **Override state** (`isOverridden === true`): number input (existing behavior) + lock icon + "Reset to live" link that calls `clearExchangeRateOverride`
     - **No-rate state** (no rate yet, no override): `"1 EUR = — USD"` + edit affordance
     - Click/pencil on auto state → activates inline number input → on blur/change calls `setExchangeRate(currency, val, true)` (marks as overridden)
   - `targetEquivalent` replaces `usdEquivalent` for the `"≈ $X"` line; format with correct symbol
   - `isUSD` check: USD still skips the rate row if target currency is USD, but if target is non-USD and cost currency is USD, an implied rate row should be shown for USD → T (derived from rateToUSD of T)

---

## Phase 5 — Tests + Documentation (depends on Phases 2–4)

7. Update `src/lib/calculations.test.ts`
   - Update field name assertions: `usdEquivalent` → `targetEquivalent`, `grandTotalUSD` → `grandTotal`
   - Add tests for non-USD `targetCurrency` conversion formula
   - Add test: target = cost currency → `targetEquivalent === subtotal`
   - Add test: `targetCurrency` missing from rate map → `targetEquivalent` is null, `grandTotal` is null

8. Update `src/store/types.test.ts`
   - Update any field name assertions that reference `usdEquivalent` or `grandTotalUSD` (renamed fields will cause type errors at compile time but runtime string checks must also be updated)
   - Verify `isOverridden` is optional and defaults to `undefined` on existing persisted-shape objects

9. Update `src/store/tripStore.test.ts` *(new file — no existing coverage for store actions)*
   - `setTargetCurrency`: sets `targetCurrency`; does not mutate couples
   - `hydrateExchangeRates`: inverts incoming rate (e.g. `rates['EUR'] = 0.91` → stored `rateToUSD = 1/0.91 ≈ 1.099`)
   - `hydrateExchangeRates`: skips currencies where `isOverridden === true`
   - `hydrateExchangeRates`: inserts new currencies not yet in store with `isOverridden: false`
   - `hydrateExchangeRates`: does not insert a USD entry (already implicit at 1.0)
   - `setExchangeRate` (updated): sets `isOverridden: true` on the stored entry
   - `clearExchangeRateOverride`: sets `isOverridden: false`; subsequent `hydrateExchangeRates` call overwrites the rate
   - `resetTrip`: resets `targetCurrency` back to `'USD'`

10. Update `src/components/CostSummary/CostSummary.test.tsx`
    - Add mock for `useTripRates`
    - Test: disclaimer renders when query has data
    - Test: target currency dropdown triggers `setTargetCurrency`
    - Test: `hydrateExchangeRates` called when query data arrives
    - Test: loading indicator renders while `useTripRates` is pending
    - Test: inline error + Retry button renders when `useTripRates` errors

11. Update `src/components/CoupleCard/CoupleCard.test.tsx`
    - Test auto-state: rate row shows read-only formatted text (`"1 EUR = 1.0899 USD"`) and pencil icon
    - Test override state: number input + lock icon render when `isOverridden === true`
    - Test override state: "Reset to live" link calls `clearExchangeRateOverride`
    - Test no-rate state: rate row shows `"1 EUR = — USD"` and edit affordance when no rate exists yet
    - Test click on auto-state activates inline number input; blur/change calls `setExchangeRate(..., true)`
    - Test implied USD→target rate row renders when target currency is non-USD and cost currency is USD
    - Test grand total sub-label shows target currency symbol when target ≠ USD

12. Create `src/features/currency/useTripRates.test.ts`
    - Mirrors pattern from `useCurrencySnapshot.test.ts`
    - Verify query key matches `['currency', 'snapshot', 'USD', region]`
    - Verify correct quotes list (region currencies minus USD; USD itself excluded from the fetch)
    - Verify `staleTime` and `refetchInterval` are set to 5 minutes
    - Test loading state is exposed while fetch is in-flight
    - Test error state is exposed on fetch failure

13. Update `docs/DATA-SOURCES-AND-APIS.md`
    - Add row to Runtime Data Inventory table: "Trip Cost exchange rates"
    - Add `useTripRates` to the Frankfurter Exchange Rates section (or a new subsection)
    - Update Trip state row to note `targetCurrency` is now persisted
    - Note the shared query key cache behavior

---

## Relevant Files

- `src/features/currency/currencyData.ts` — `fetchCurrencySnapshot` is the shared primitive; no changes needed
- `src/features/currency/useCurrencySnapshot.ts` — reference pattern for `useTripRates`
- `src/features/currency/useTripRates.ts` — **new file**
- `src/store/types.ts` — `ExchangeRate`, `CurrencyBreakdown`, `CoupleSummary`
- `src/store/types.test.ts` — update field name assertions for renamed fields
- `src/lib/calculations.ts` — `buildSummary`, field renames
- `src/store/tripStore.ts` — `targetCurrency`, `hydrateExchangeRates`, `clearExchangeRateOverride`, updated `setExchangeRate`
- `src/store/tripStore.test.ts` — **new file** covering new store actions
- `src/components/CostSummary/CostSummary.tsx` — hook, hydration effect, dropdown, disclaimer footer
- `src/components/CoupleCard/CoupleCard.tsx` — rate display/override UI, grand total label
- `docs/DATA-SOURCES-AND-APIS.md` — inventory table + Frankfurter section update

---

## Verification

1. Open Trip page → rates auto-populate after brief load (no manual entry required)
2. Change region on trip → new region currencies appear; rates refresh
3. Switch to currency converter page and back → trip rates use cached data (no extra API call if within 5-min window)
4. Manually override EUR rate → value persists; auto-refresh after 5 min does NOT overwrite it; reset link restores live rate
5. Change "Convert to" to EUR → all grand totals update to EUR amounts; USD costs show implied EUR equivalent
6. Disclaimer footer: matches Frankfurter link, shows rate date, collapses/expands like currency converter
7. Run `npm test` — all updated tests pass

---

## Decisions
- `rateToUSD` field name retained in `ExchangeRate`; conversion to any target T uses `amount * rateToUSD[C] / rateToUSD[T]`
- Rates fetched **base=USD** always for Trip Cost; inverting Frankfurter response values to get rateToUSD
- Query key matches `useCurrencySnapshot('USD', region)` for TanStack Query cache sharing
- `isOverridden?: boolean` optional to maintain backward compat with existing persisted trip localStorage entries
- Target currency available options = `getAvailableCurrencies(region)` (USD always present)
- `resetTrip` resets `targetCurrency` to `'USD'`

## Scope exclusions
- Currency converter UI unchanged
- Forecast tool unchanged
- No changes to `currencyData.ts` — `fetchCurrencySnapshot` is already the shared primitive
