# Copilot Guidance Improvements - Implementation Report

**Date:** 2026-09-28
**Final status:** COMPLETED

## Goal and Scope

Reconcile stale currency data documentation, add Copilot guidance for analytics consent, forecast caveats, documentation source-of-truth handling, and runnable validation, and cover the root analytics consent bridge states. Runtime analytics, forecast, and currency behavior were not changed.

## Plan and Execution

The three phases ran sequentially:

1. Reconcile currency data documentation.
2. Add Copilot guidance and consent regression coverage.
3. Review the result and run full validation.

No implementation phases ran in parallel. Phase 3 validation commands were run concurrently because they are independent.

The orchestrator implemented and validated Phase 1, and coordinated Phase 3. `general-implement-subagent` implemented Phase 2 and also performed read-only acceptance audits of Phases 1 and 3. Subagent calls used default model routing with no explicit model override.

## Changes by Phase

### Phase 1: Currency Documentation

- Replaced static/shipped currency snapshot descriptions with the live Frankfurter v2 flow in `docs/tool-pages-data-and-query.md` and `docs/ARCHITECTURE.md`.
- Updated `docs/DATA-SOURCES-AND-APIS.md` where its freshness language overstated cache retention.
- Corrected currency count and regional availability, persisted converter state, rate query keys, polling/focus behavior, placeholder data behavior, dropdown metadata use, Trip Cost rate hydration/overrides, and target-currency totals.
- Preserved the tool guide's routing, query, cache, and UI-state material.

### Phase 2: Guidance and Tests

- Updated `.github/copilot/copilot-instructions.md` with the analytics consent contract, analytics expansion decision gate, forecast caveats, attribution, and documentation source-of-truth rules.
- Updated `.github/copilot/tech-stack.md` with full-suite test, typecheck, and build commands.
- Added bridge-level unset, accepted, rejected, and non-production cases in `src/integration.test.tsx`.
- Added a real initializer production-gate test in `src/lib/analytics.test.ts`, because the bridge test mocks the analytics helper.
- The two `.github/copilot/` files are ignored by the existing `.gitignore`; they were edited on disk without changing ignore policy or force-staging them.

### Phase 3: Review and Validation

- Reviewed changed guidance and documentation against the root bridge, analytics helper, forecast attribution/disclaimer, currency implementation, stores, hooks, tests, and canonical API reference.
- Corrected a duplicate Vitest import found by typecheck/build; the final runs passed.
- Recorded final plan status and acceptance evidence in `docs/plans/copilot-guidance-improvements/copilot-guidance-improvements-plan.md`.

## Validation

- `npm run test -- --run src/integration.test.tsx src/lib/analytics.test.ts` - passed, 2 files and 34 tests.
- `npm run test -- --run` - passed, 47 files and 421 tests.
- `npm run typecheck` - passed.
- `npm run build` - passed; production bundle generated.
- Focused documentation checks found no remaining in-scope currency cache, persistence, or formatting contradictions. Read-only Phase 1 and Phase 3 acceptance audits passed.

## Residuals and Decisions

- A pre-existing forecast prototype section and summary in `docs/tool-pages-data-and-query.md` still describe hardcoded forecast data. This was left unchanged as unrelated to the plan's currency-document scope; the current forecast implementation uses Open-Meteo, and the new guidance preserves its historical-climate and estimated-event caveats.
- `.github/copilot/` remains ignored by Git. The requested local guidance files are updated, but are not represented in normal Git status or diffs unless repository ignore/tracking policy is changed.
- No product or architecture decision remains open. No runtime behavior was changed.

## Final Result

All three planned phases are complete. The scoped documentation, guidance, consent bridge coverage, full test suite, typecheck, and production build passed. The two residuals above are explicitly documented and outside the agreed implementation scope.
