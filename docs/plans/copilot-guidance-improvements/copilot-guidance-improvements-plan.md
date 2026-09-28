---
title: "Copilot Guidance Improvements - Implementation Plan"
status: COMPLETED
current_phase: 3 / 3
created: 2026-09-28
last_updated: 2026-09-28
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 3 / 3
* **Summary of Outcome:** Currency documentation was reconciled, Copilot guidance and consent regression coverage were added, and all required verification gates passed.

# Specification & Overview

### 1. Scope & Objective
- **Goal:** Update repository guidance and documentation to preserve verified analytics-consent and forecast-data contracts, make conflicting documentation safer to maintain, and give contributors runnable validation expectations.
- **In-Scope:** Reconcile stale currency data claims while retaining useful route/query guidance; improve `.github/copilot/` instructions; add a root analytics-bridge regression test for unset, accepted, rejected, and non-production states; validate the resulting guidance and docs.
- **Out-of-Scope:** Expanding analytics beyond the existing opt-in Google Analytics `page_view` integration; changing runtime analytics, forecast, or currency behavior unless the planned regression test exposes a concrete defect; rewriting unrelated documentation or guidance.
- **Source:** `docs/plans/copilot-guidance-improvement-report.md` (impact assessment supplied for this plan).

### 2. Technical Constraints & Architecture
- Keep the existing six-file `.github/copilot/` guidance structure and its verified stack, route boundaries, and trip-splitting guidance.
- Analytics behavior is controlled by production/config checks and the consent bridge in `src/routes/__root.tsx`; tests must establish that initialization and page views require accepted analytics consent, rejection stays disabled, and non-production does not initialize analytics.
- Forecast guidance must distinguish multi-decade historical climate-model averages from forecasts and curated event dates from guaranteed dates, retain attribution/disclaimers, and direct data-source changes to `docs/DATA-SOURCES-AND-APIS.md`.
- Treat current source and tests as evidence when documentation conflicts. The existing instruction already says to verify stale claims; strengthen it to require identifying the canonical reference and explicitly flagging unresolved conflicts.
- Preserve unique routing/query material in `docs/tool-pages-data-and-query.md` while correcting static-currency claims in that guide and `docs/ARCHITECTURE.md` against the current Frankfurter implementation and data-source reference.
- Use Vitest and existing repository conventions. Available checks include `npm run test -- --run`, `npm run typecheck`, and `npm run build`.

---

# Execution Plan & Handoffs

## Phase 1: Reconcile Documentation Sources
- **Status:** COMPLETED
- **Objective:** Bring the conflicting currency data documentation into line with verified implementation behavior without discarding useful unique guidance.

### Tasks
- [x] Verify the current currency data flow in source and tests, using `src/features/currency/currencyData.ts` and `docs/DATA-SOURCES-AND-APIS.md` as the implementation and reference anchors.
- [x] Correct or clearly label the stale static/mock currency claims in `docs/tool-pages-data-and-query.md` and `docs/ARCHITECTURE.md`.
- [x] Retain useful routing, query-key, cache, and UI-state details in `docs/tool-pages-data-and-query.md`; avoid replacing those sections with a bare link.
- [x] Confirm that the resulting currency descriptions agree across the implementation and the canonical API/data-source reference; record any conflict that cannot be resolved from source or tests.

### Verification & Acceptance Criteria
*All criteria must pass before advancing to the handoff report.*
- [x] **Automated Checks:** No dedicated automated test was required for this documentation-only phase; the full suite is scheduled for Phase 3.
- [x] **Functional Assertions:** The currency docs no longer present the live Frankfurter flow as static mock data or shipped snapshots; useful route/query guidance remains; unresolved claims are explicitly identified rather than guessed. Result: PASS; no unresolved source conflict was found.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
- [x] **Required Files:** `docs/tool-pages-data-and-query.md`; `docs/ARCHITECTURE.md`.
- [x] **Boundaries:** No runtime source changed; unique query/routing guidance was retained; unrelated documentation was not rewritten. `docs/DATA-SOURCES-AND-APIS.md` remains the verified reference.
- [x] **Legacy Code Removed:** Not applicable; stale currency claims were corrected without changing runtime code.
- [x] **Acceptance Checks:** Verified against currency source, query hook and test, canonical data-source documentation, and the final documentation diff.

### Phase 1 Handoff & Verification Report
*Filled out by the executing agent upon phase completion.*
- **Compliance Check:** PASS
- **Verification Result:** PASS — final scoped audit found no remaining currency-specific factual contradiction.
- **Execution Proof / Logs:** Compared currency fetch/query/store/types against current docs and tests; verified source-reference cache freshness and refetch semantics. Focused stale-claim checks passed; no dedicated test was required for the documentation changes.
- **Artifacts Created/Modified:** `docs/tool-pages-data-and-query.md`; `docs/ARCHITECTURE.md`; `docs/DATA-SOURCES-AND-APIS.md`.
- **Decisions & Deviations:** Preserved route/query/cache/UI details. Corrected 14-currency/region availability, persisted converter preferences, query freshness/refetch behavior, Trip Cost live-rate/target-currency descriptions, and the architecture boundary. Updated the canonical API reference where its cache wording overstated retention.
- **Next Phase Context:** Phase 2 could update Copilot guidance and add the planned root consent-bridge regression test.

---

## Phase 2: Add Guidance Contracts and Consent Regression Coverage
- **Status:** COMPLETED
- **Objective:** Make the four verified guidance gaps actionable for future Copilot-assisted changes and cover the consent bridge states that are not currently tested together.

### Tasks
- [x] Update `.github/copilot/copilot-instructions.md` with the analytics contract: production-only; no initialization or `page_view` before accepted consent; rejection keeps analytics disabled. Require a bridge-level regression test when analytics or consent behavior changes.
- [x] Add the conditional analytics-expansion decision gate: before adding vendors, event types, or tracking categories, reassess consent scope, privacy documentation, and regression coverage. Keep the current work limited to the existing integration.
- [x] Add concise forecast-specific guidance preserving historical climate-model-average and estimated-event distinctions, source attribution, user-facing caveats, and the pointer to `docs/DATA-SOURCES-AND-APIS.md`.
- [x] Strengthen the existing documentation rule to require checking source/tests, identifying the canonical document, and flagging unresolved conflicts instead of copying stale claims.
- [x] Update `.github/copilot/tech-stack.md` commands to document the full-suite command `npm run test -- --run` and the available `npm run typecheck` and `npm run build` checks; retain other existing command guidance.
- [x] Inspect existing root/route test conventions, then add a bridge-level regression test in the appropriate existing test location for unset, accepted, rejected, and non-production consent states. Assert analytics initialization and `page_view` behavior, not only store/helper behavior.

### Verification & Acceptance Criteria
*All criteria must pass before advancing to the handoff report.*
- [x] **Automated Checks:** `npm run test -- --run src/integration.test.tsx src/lib/analytics.test.ts` passed (2 files, 34 tests).
- [x] **Functional Assertions:** Unset and rejected consent do not call initialization or send page views; accepted consent in production initializes and permits page views; outside production the real initializer returns `false` without adding the GA script, and the bridge sends no page views. Guidance covers the report recommendations without duplicating existing rules.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
- [x] **Required Files:** Updated `.github/copilot/copilot-instructions.md` and `.github/copilot/tech-stack.md`; added bridge coverage to `src/integration.test.tsx` and production-guard coverage to the existing `src/lib/analytics.test.ts`.
- [x] **Boundaries:** Existing stack and application guidance remain; analytics integration and tracking categories were not expanded; runtime code was not changed.
- [x] **Legacy Code Removed:** No runtime code needed removal or modification.
- [x] **Acceptance Checks:** All four consent states were validated; the conditional analytics expansion gate and other report recommendations are represented in guidance.

### Phase 2 Handoff & Verification Report

* **Compliance Check:** PASS
* **Verification Result:** PASS — focused bridge/helper tests passed (2 files, 34 tests).
* **Execution Proof / Logs:** `npm run test -- --run src/integration.test.tsx src/lib/analytics.test.ts` passed. Independently reviewed the root bridge and helper production guard.
* **Artifacts Created/Modified:** `.github/copilot/copilot-instructions.md`; `.github/copilot/tech-stack.md`; `src/integration.test.tsx`; `src/lib/analytics.test.ts`.
* **Decisions & Deviations:** Added a production-guard test to the existing analytics helper test file because the root bridge test mocks the analytics helper; this verifies the actual non-production no-op. The `.github/copilot/` directory is ignored by the repository's existing `.gitignore`; files were updated in place without changing ignore policy or staging them.
* **Next Phase Context:** Phase 3 should review all modified guidance/docs against source and run the full test suite, typecheck, and production build.

---

## Phase 3: Validate Guidance and Documentation Together

* **Status:** COMPLETED
* **Objective:** Confirm the new rules are accurate, non-contradictory, and backed by the appropriate automated checks.

### Tasks

* [x] Review the changed guidance and docs against source and tests, including the root consent bridge, forecast attribution/disclaimer, currency implementation, and `docs/DATA-SOURCES-AND-APIS.md`.
* [x] Run the full test suite with `npm run test -- --run`.
* [x] Run `npm run typecheck` and `npm run build` to validate the test and repository changes.
* [x] Resolve any failures caused by the change; document pre-existing or unrelated failures without broadening scope.

### Verification & Acceptance Criteria

* [x] **Automated Checks:** Focused bridge/helper test passes; `npm run test -- --run` passed (47 files, 421 tests); `npm run typecheck` passed; `npm run build` passed.
* [x] **Functional Assertions:** Every verified gap in the source report is mapped to corrected documentation, explicit Copilot guidance, or regression coverage; conditional analytics expansion remains a decision gate; no stale claim or unnecessary duplicate rule remains.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
* [x] **Required Files:** Reviewed Phase 1 and Phase 2 files plus the final diff; the production-guard test was added to the existing analytics helper test file because the bridge test mocks that boundary.
* [x] **Boundaries:** Changes remained within the planned guidance, documentation, and regression coverage. No runtime behavior changed.
* [x] **Legacy Code Removed:** Stale currency claims were corrected; guidance adds missing contracts without duplicating existing rules.
* [x] **Acceptance Checks:** Recorded the focused test, full-suite, typecheck, and build results; verified the assertions against current source and tests.

### Phase 3 Handoff & Verification Report

* **Compliance Check:** PASS
* **Verification Result:** PASS — all planned automated gates passed.
* **Execution Proof / Logs:** Focused: `npm run test -- --run src/integration.test.tsx src/lib/analytics.test.ts` passed (2 files, 34 tests). Full suite: `npm run test -- --run` passed (47 files, 421 tests). `npm run typecheck` passed. `npm run build` passed and produced the production bundle. Final independent audits passed for the in-scope currency documentation and Phase 3 acceptance. The first typecheck/build attempt found a duplicate import in the new test; it was corrected and both commands passed on rerun.
* **Artifacts Created/Modified:** Currency docs, Copilot instructions and tech-stack guidance, root integration test, analytics helper test, and this plan. See the implementation report for full paths and status.
* **Decisions & Deviations:** No runtime behavior changed. `.github/copilot/` remains excluded by the existing ignore rule; its requested guidance files were updated locally without altering repository ignore policy. A pre-existing static forecast mock description remains outside this plan's currency-document scope and is recorded as a follow-up.
* **Next Phase Context:** None; all three phases are complete.

---

## Overall Completion

* **Status:** COMPLETED
* **Completion Criteria:** All three phases are COMPLETED; the stale currency documentation is reconciled; the guidance captures analytics consent, forecast caveats, documentation source-of-truth handling, and runnable validation; the consent bridge regression states pass; and the focused/full-suite/typecheck/build results are recorded.
* **Open Decisions:** No blocking decision is identified. If analytics scope expands during implementation, pause that expansion to reassess consent scope, privacy documentation, and regression coverage before proceeding.
* **Risks:** A pre-existing static forecast mock description remains in the tool guide's forecast section and summary table; it was excluded from this currency-focused scope. The `.github/copilot/` guidance files remain ignored by the repository's existing `.gitignore` rule.