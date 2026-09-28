---
title: "Trip Cost Summary Total and Group Shares - Implementation Plan"
status: COMPLETED
current_phase: 2 / 2
created: 2026-09-28
last_updated: 2026-09-28
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 2 / 2
* **Summary of Outcome:** The Cost Summary displays the all-or-nothing trip total in the selected currency and each group's share, with unavailable and zero-total states covered.

# Specification & Overview

### 1. Scope & Objective
- **Goal:** Show the combined trip cost in the Cost Summary and show each group's grand total as a percentage of that trip cost, so users can compare group costs at a glance.
- **In-Scope:** Derive a trip total from the existing group summaries; show it in the Cost Summary using the currently selected target currency; show each group's share beside its grand total; cover unavailable-conversion and zero-total states.
- **Out-of-Scope:** Changes to cost allocation, markup, exchange-rate fetching or conversion rules; changes to saved trip data or store schemas; changes to currency selection or the underlying group subtotal/grand-total calculations.
- **User Decision:** If any group total is unavailable because an exchange rate is missing, withhold the trip total and all group percentages until every group total is convertible.

### 2. Technical Constraints & Architecture
- `src/components/CostSummary/CostSummary.tsx` calls `buildSummary` with the selected `targetCurrency` and renders one `CoupleCard` per group summary.
- `src/lib/calculations.ts` returns `CoupleSummary.grandTotal` in the target currency, or `null` if an active currency has no required conversion rate. Aggregate these existing values rather than reconverting source costs.
- `src/components/CoupleCard/CoupleCard.tsx` owns the group's Grand Total presentation. Its card layout and styles are in `src/index.css` under `.s-grand` and `.s-grand-*`.
- Keep aggregate presentation derived and ephemeral; do not add persisted state or duplicate currency-conversion logic.
- Assumptions: The trip total is shown outside the individual group cards, adjacent to the group-card collection; the group share is shown beside that group's Grand Total; use the selected target currency and existing `formatCurrency` helper for the trip total; use a concise percentage format (up to one fractional digit). If groups exist but have no costs, show a zero trip total; if the trip total is zero, show no percentages rather than divide by zero. A group with a zero grand total in a nonzero trip has a 0% share.
- Risk: A partial sum would make shares misleading, so any unavailable group total makes the overall total and all shares unavailable. Preserve the existing dash behavior for unavailable group grand totals.

---

# Execution Plan & Handoffs

## Phase 1: Add the Trip Total
- **Status:** COMPLETED
- **Objective:** Derive and display the trip total from the existing converted group grand totals, including the agreed unavailable and zero-total states.

### Tasks
- [x] In `src/components/CostSummary/CostSummary.tsx`, derive the aggregate from existing `summaries`; display it outside individual group cards and format it in `targetCurrency` with `formatCurrency`.
- [x] Withhold the aggregate when any `summary.grandTotal` is `null`; avoid presenting a total for an empty summary set. When summaries exist but groups have no costs, display the zero aggregate.
- [x] Extend `src/components/CostSummary/CostSummary.test.tsx` to cover a multi-group total, selected-currency formatting, a target-currency change followed by rerender, empty summaries, groups with no costs, and an unavailable group total. Keep the mocked `CoupleCard` focused on its rendered inputs where needed.

### Verification & Acceptance Criteria
*All criteria must pass before advancing to the handoff report.*
- [x] **Automated Checks:** `npm run test -- --run src/components/CostSummary/CostSummary.test.tsx` and `npm run typecheck`.
- [x] **Functional Assertions:** The displayed trip total equals the sum of all convertible group grand totals in the selected target currency; changing the mocked target currency and rerendering updates the displayed total through the existing summaries; if any group total is unavailable, no partial trip total is shown; the no-groups empty state remains intact and groups with no costs show a zero total.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
- [x] **Required Files:** Modify `src/components/CostSummary/CostSummary.tsx` and `src/components/CostSummary/CostSummary.test.tsx`; no new module is required for this derived display value.
- [x] **Boundaries:** Do not change `src/lib/calculations.ts`, currency-rate fetching, store/persistence types, or unrelated summary content; do not put the trip total inside a single group's card.
- [x] **Legacy Code Removed:** No legacy calculation or UI path is expected to be removed; ensure there is only one trip-total display and it uses existing summaries.
- [x] **Acceptance Checks:** Confirm the phase's automated checks and functional assertions were actually run.

### Phase 1 Handoff & Verification Report
*Filled out by the executing agent upon phase completion.*
- **Compliance Check:** PASS
- **Verification Result:** PASS
- **Execution Proof / Logs:** `npm run test -- --run src/components/CostSummary/CostSummary.test.tsx` passed (12 tests); `npm run typecheck` passed. Both were independently rerun before Phase 2.
- **Artifacts Created/Modified:** `src/components/CostSummary/CostSummary.tsx`; `src/components/CostSummary/CostSummary.test.tsx`.
- **Decisions & Deviations:** None. The total is derived from existing converted summaries and is not persisted.
- **Next Phase Context:** Phase 2 derived shares from this same complete trip total; no partial shares are shown when totals are unavailable or zero.

---

## Phase 2: Show Group Shares Beside Grand Totals
- **Status:** COMPLETED
- **Objective:** Display each group's percentage of the trip total beside its Grand Total and verify the complete summary behavior.

### Tasks
- [x] Extend the `CoupleCard` props in `src/components/CoupleCard/CoupleCard.tsx` to receive the derived share from `CostSummary`; keep the value out of persisted `CoupleSummary` data unless implementation evidence establishes a need.
- [x] Update `src/components/CostSummary/CostSummary.tsx` to derive each share as the group's converted grand total divided by the complete trip total, and pass it to the corresponding card. Pass no percentage if any group total is unavailable or the trip total is zero; show a 0% share for a zero-total group when the trip total is nonzero.
- [x] Render the percentage adjacent to the group's Grand Total in `src/components/CoupleCard/CoupleCard.tsx`; update `src/index.css` only as needed to keep the label and amount legible and responsive.
- [x] Extend `src/components/CoupleCard/CoupleCard.test.tsx` for a displayed percentage and an unavailable percentage. Extend `src/components/CostSummary/CostSummary.test.tsx` to assert per-group shares, a zero share for a zero-total group in a nonzero trip, withheld shares for missing rates, and no shares when the trip total is zero.

### Verification & Acceptance Criteria
*All criteria must pass before advancing to the handoff report.*
- [x] **Automated Checks:** `npm run test -- --run src/components/CostSummary/CostSummary.test.tsx src/components/CoupleCard/CoupleCard.test.tsx` and `npm run typecheck`.
- [x] **Functional Assertions:** Each displayed share uses the group's grand total divided by the complete trip total and is formatted as a percentage; shares are absent when the aggregate is unavailable or zero; trip total and group amounts remain in the selected target currency; the trip total and card Grand Total/share row do not overlap or overflow at 320px and 390px narrow/mobile widths or at 1280px desktop width. Verify layout in a browser because the existing responsive tests mock CostSummary and do not measure rendered card layout.
- [x] **Integration Check:** `npm run build` completes successfully after the focused tests and typecheck.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
- [x] **Required Files:** Modify `src/components/CostSummary/CostSummary.tsx`, `src/components/CostSummary/CostSummary.test.tsx`, `src/components/CoupleCard/CoupleCard.tsx`, and `src/components/CoupleCard/CoupleCard.test.tsx`; modify `src/index.css` only if styling requires it.
- [x] **Boundaries:** Keep percentages derived at the summary presentation boundary; do not modify currency conversion, persisted data, group allocation, or unrelated card behavior; do not add a second aggregate calculation path.
- [x] **Legacy Code Removed:** No legacy code is expected to be removed; ensure the Grand Total remains present and each share appears only once per group.
- [x] **Acceptance Checks:** Confirm the automated checks, integration check, and desktop/narrow layout assertions above were actually completed.

### Phase 2 Handoff & Verification Report
*Filled out by the executing agent upon phase completion.*
- **Compliance Check:** PASS
- **Verification Result:** PASS
- **Execution Proof / Logs:** The focused CostSummary and CoupleCard suite passed (45 tests); `npm run typecheck` and `npm run build` passed. Browser measurements at 320px, 390px, and 1280px showed no horizontal document overflow or overlap. At 320px the label wraps while the amount and share stay together; at 390px and 1280px all remain on one line.
- **Artifacts Created/Modified:** `src/components/CostSummary/CostSummary.tsx`; `src/components/CostSummary/CostSummary.test.tsx`; `src/components/CoupleCard/CoupleCard.tsx`; `src/components/CoupleCard/CoupleCard.test.tsx`; `src/index.css`.
- **Decisions & Deviations:** Added a non-wrapping amount/share wrapper, vertically centered the percentage, and let the label use the remaining width on narrow screens. No changes to conversions, persisted data, or allocation.
- **Next Phase Context:** None; implementation and acceptance checks are complete.

---
