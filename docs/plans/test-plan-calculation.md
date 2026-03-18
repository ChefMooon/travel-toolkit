# Calculation Test Plan

## Objective
Guarantee that calculation outcomes are correct, deterministic, and stable for all supported split and summary rules in the trip cost engine.

## Scope
In scope:
- Pure calculation logic in `src/lib/calculations.ts`
- Deterministic behavior of rounding, split allocation, markup application, and summary rollups
- USD-equivalent summary behavior based on exchange-rate availability

Out of scope:
- UI rendering and interactions
- Drag-and-drop behavior
- Theme and persistence behavior
- Non-calculation component tests

## Source Under Test
- `roundHalfUp(value, decimals?)`
- `validateCost(cost)`
- `getEffectiveMarkup(cost, globalMarkup)`
- `getCostWithMarkup(cost, globalMarkup)`
- `splitCost(cost, allCouples, globalMarkup)`
- `buildSummary(couples, costs, globalMarkup, exchangeRates)`
- `formatCurrency(amount, currencyCode)`

## Test Strategy
1. Unit tests for each exported function
2. Scenario tests for mixed split and currency combinations
3. Boundary tests for zero values and empty inputs
4. Deterministic invariant checks using explicit fixtures

## Domain Rules and Invariants
1. Conservation of value
- For a cost with eligible targets, the sum of split amounts equals `roundHalfUp(totalWithMarkup)`.

2. Rounding remainder policy
- Any remainder introduced by equal-share rounding is assigned to the first eligible target couple.

3. Eligibility filtering
- `subset` and `individual` assignments only pay to IDs that exist in `allCouples`.
- Invalid assigned IDs do not receive values.

4. Zero-value assignment for non-target couples
- For costs with at least one eligible target, all other existing couples appear with `0` in split output.

5. Summary subtotal consistency
- For each couple and currency, `subtotal = roundHalfUp(shared + subset + individual)`.

6. USD grand total rule
- `grandTotalUSD` is non-null only if every active currency for that couple has a known exchange rate.

7. Currency visibility rule
- Currencies with zero subtotal are filtered out when a couple has at least one active currency.
- If a couple has zero subtotal in all used currencies, the current implementation keeps the full zeroed currency list.

## Planned Test Cases
### A. Rounding and Markup
- `CALC-RND-001`: Round half-up boundary values at 2 decimals
- `CALC-RND-002`: Round half-up with custom decimal precision
- `CALC-MKP-001`: Effective markup uses per-cost override when present
- `CALC-MKP-002`: Cost-with-markup rounds as expected

### B. Validation
- `CALC-VAL-001`: Shared costs are valid
- `CALC-VAL-002`: Individual cost without assignee is invalid
- `CALC-VAL-003`: Individual cost with assignee is valid
- `CALC-VAL-004`: Subset cost without assignee is invalid
- `CALC-VAL-005`: Subset cost with assignees is valid

### C. Split Engine
- `CALC-SPL-001`: Shared split equal allocation
- `CALC-SPL-002`: Shared split remainder assigned to first couple
- `CALC-SPL-003`: Subset split only assigned couples pay
- `CALC-SPL-004`: Individual split only first valid assignee pays
- `CALC-SPL-005`: Markup applied before split
- `CALC-SPL-006`: Invalid assigned IDs are ignored
- `CALC-SPL-007`: No valid targets returns empty map

### D. Summary Engine
- `CALC-SUM-001`: Single-currency summary values are correct
- `CALC-SUM-002`: Mixed-currency USD equivalents computed when rates exist
- `CALC-SUM-003`: Missing rate yields null USD equivalent and null grand total
- `CALC-SUM-004`: All-zero couples retain full zeroed currency list (current behavior)
- `CALC-SUM-006`: Zero-subtotal currencies are filtered when another currency is active
- `CALC-SUM-005`: Summary totals are stable regardless of cost order

### E. Formatting
- `CALC-FMT-001`: Known currency symbols render correctly
- `CALC-FMT-002`: Unknown currency code falls back to prefix format

## Traceability Matrix
| Rule / Invariant | Test IDs |
|---|---|
| Conservation of value | CALC-SPL-001, CALC-SPL-002, CALC-SPL-003, CALC-SPL-004 |
| Rounding remainder to first eligible target | CALC-SPL-002 |
| Eligibility filtering for subset/individual | CALC-SPL-003, CALC-SPL-004, CALC-SPL-006, CALC-SPL-007 |
| Non-target couples receive zero | CALC-SPL-001, CALC-SPL-003, CALC-SPL-004 |
| Summary subtotal consistency | CALC-SUM-001, CALC-SUM-002 |
| USD grand total nullability | CALC-SUM-002, CALC-SUM-003 |
| Currency filtering behavior | CALC-SUM-004, CALC-SUM-006 |
| Stable aggregation under reordered costs | CALC-SUM-005 |

## Fixture Design
- Keep a small deterministic fixture set:
- Three couples (`c1`, `c2`, `c3`) with fixed display fields
- Cost entries with explicit split type and assigned IDs
- Exchange rates for selected currencies only

## Execution Plan
1. Create `src/lib/calculations.test.ts` with function-grouped `describe` blocks.
2. Run calculation suite directly:
- `npm run test -- --run src/lib/calculations.test.ts`
3. Run full suite for regression confidence:
- `npm run test -- --run`
4. Update this document if behavior changes or new split rules are introduced.

## Exit Criteria
- All planned calculation tests implemented and passing
- Every listed invariant mapped to at least one passing test
- No regressions introduced in existing tests
