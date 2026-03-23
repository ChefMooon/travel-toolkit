# Currency Converter — Frankfurter API Migration Plan

## Context & Constraints

- The currency feature is **already implemented** with static hardcoded data. The goal of this task is a **targeted swap of the data source only**.
- **Do not alter** `useCurrencySnapshot.ts`, `CurrencyTool.tsx`, or `currency.tsx` unless a change is explicitly listed below.
- The return shape of `fetchCurrencySnapshot` **must stay identical** — only its internals change.
- The existing TanStack Query configuration (`staleTime`, `queryKey` strategy, error/loading states) is correct and should not be touched.
- No new dependencies are required. Use the native `fetch` API.

---

## Existing Return Shape (must be preserved)

```ts
{
  base: SupportedCurrency,      // e.g. "USD"
  updatedAt: string,            // human-readable label
  rates: Record<SupportedCurrency, number>  // includes base → base (always 1)
}
```

---

## Supported Currencies

The six supported currencies stay the same:

```ts
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];
```

These must not change — they are referenced by `CurrencyTool.tsx`.

---

## Target File: `src/features/currency/currencyData.ts`

This is the **only file that needs to be modified.**

### What to remove

- The `RATE_SNAPSHOTS` static data object (the hardcoded rate tables).
- The artificial `180ms` delay (`await new Promise(resolve => setTimeout(resolve, 180))`).
- Any logic that reads from `RATE_SNAPSHOTS`.

### What to keep

- The `SUPPORTED_CURRENCIES` constant and `SupportedCurrency` type.
- The `fetchCurrencySnapshot` function signature exactly as-is.
- The validation throw for unsupported base currencies (see below).

---

## New Implementation

Replace the body of `fetchCurrencySnapshot` with the following logic:

### Step 1 — Validate the base currency

Before making any network request, check that the provided `base` is in `SUPPORTED_CURRENCIES`. If not, throw with the same error behavior as the existing implementation:

```ts
if (!SUPPORTED_CURRENCIES.includes(base)) {
  throw new Error(`Unsupported currency: ${base}`);
}
```

### Step 2 — Build the Frankfurter request URL

The `symbols` param should list all supported currencies **except** the base (Frankfurter excludes the base from its own response):

```ts
const symbols = SUPPORTED_CURRENCIES.filter(c => c !== base).join(',');
const url = `https://api.frankfurter.app/latest?base=${base}&symbols=${symbols}`;
```

### Step 3 — Fetch and handle errors

Use native `fetch`. Throw a descriptive error on non-OK responses so TanStack Query's `isError` state and the Retry button work correctly:

```ts
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Frankfurter API error: ${res.status} ${res.statusText}`);
}
const data = await res.json();
```

### Step 4 — Normalize the response

Frankfurter returns rates for all *other* currencies but not the base itself. Inject `base → 1` manually, then cast to the expected type:

```ts
const rates = {
  ...data.rates,
  [base]: 1,
} as Record<SupportedCurrency, number>;
```

### Step 5 — Return the normalized snapshot

Map `data.date` (format: `"YYYY-MM-DD"`) to the `updatedAt` field. Format it for readability:

```ts
return {
  base,
  updatedAt: `Rates from ${data.date}`,
  rates,
};
```

---

## Complete Replacement for `fetchCurrencySnapshot`

```ts
export async function fetchCurrencySnapshot(base: SupportedCurrency) {
  if (!SUPPORTED_CURRENCIES.includes(base)) {
    throw new Error(`Unsupported currency: ${base}`);
  }

  const symbols = SUPPORTED_CURRENCIES.filter(c => c !== base).join(',');
  const url = `https://api.frankfurter.app/latest?base=${base}&symbols=${symbols}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Frankfurter API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const rates = {
    ...data.rates,
    [base]: 1,
  } as Record<SupportedCurrency, number>;

  return {
    base,
    updatedAt: `Rates from ${data.date}`,
    rates,
  };
}
```

---

## Frankfurter API Reference

| Property | Value |
|---|---|
| Base URL | `https://api.frankfurter.app` |
| Endpoint | `/latest` |
| Auth | None — no API key required |
| `base` param | Any supported ISO 4217 currency code |
| `symbols` param | Comma-separated list of target currencies |
| Rate update cadence | Once daily on ECB business days (Mon–Fri) |
| Weekend behavior | Returns Friday's rates — this is expected and acceptable |

### Example raw response for `?base=USD&symbols=EUR,GBP,CAD,JPY,AUD`

```json
{
  "amount": 1,
  "base": "USD",
  "date": "2026-03-21",
  "rates": {
    "AUD": 1.5891,
    "CAD": 1.4432,
    "EUR": 0.9245,
    "GBP": 0.7891,
    "JPY": 149.82
  }
}
```

Note: `USD` is absent from `rates` — this is correct Frankfurter behavior. The `[base]: 1` injection in Step 4 handles it.

---

## Behavior After Migration

| Scenario | Behavior |
|---|---|
| First load for a base | Live `fetch` to Frankfurter, returns real rates |
| Same base selected within 5 min | TanStack Query cache hit — no network request |
| Different base selected | New cache entry fetched (existing behavior unchanged) |
| Frankfurter returns non-OK | `isError` state, Retry button calls `query.refetch()` |
| Weekend / ECB holiday | Returns most recent available rates with accurate `date` field |
| Unsupported base passed | Throws immediately, no network request made |

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/features/currency/currencyData.ts` | Remove static data + delay. Replace `fetchCurrencySnapshot` body with Frankfurter fetch. |
| `src/features/currency/useCurrencySnapshot.ts` | **No changes** |
| `src/features/currency/CurrencyTool.tsx` | **No changes** |
| `src/routes/currency.tsx` | **No changes** |
