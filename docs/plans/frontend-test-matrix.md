# Frontend Test Coverage Matrix

## Purpose
Provide a compact, scan-friendly view of frontend test coverage so future work can quickly identify gaps.

## Coverage Matrix

| Area | Component / Module | Test File | Test IDs | What Is Covered | Status | Next Gaps |
|---|---|---|---|---|---|---|
| UI | EditRow | `src/components/EditRow.test.tsx` | FE-EDT-001..008 | Save validation, split assignment rules, markup mode behavior, cancel flow, region currency options, validation-warning toast emission | Implemented | Keyboard-only interaction paths, field-level aria labels |
| UI | Topbar | `src/components/Topbar.test.tsx` | FE-TOP-001..007 | Trip name update/clear, markup editing/validation, theme toggle, reset modal flow | Implemented | Enter/Escape behavior on all controls, focus order assertions |
| UI | BulkActionBar | `src/components/BulkActionBar.test.tsx` | FE-BULK-001..005 | Conditional render, currency change callback, apply/clear callbacks | Implemented | Disabled state behavior if added later |
| UI | MobileNav | `src/components/MobileNav.test.tsx` | FE-NAV-001..003 | Tab render, active state class, onChange emissions | Implemented | Keyboard navigation and aria-current semantics |
| UI | Modal | `src/components/Modal.test.tsx` | FE-MOD-001..006 | Render content, confirm/cancel callbacks, backdrop close, compact mode, `aria-modal` | Implemented | Focus trap, Escape handling parity across all modal usages |
| UI | RegionSelector | `src/components/RegionSelector.test.tsx` | FE-REG-001..003 | Current value render, all options render, setRegion callback | Implemented | Persist/rehydrate behavior via integration test |
| UI | CostSummary | `src/components/CostSummary.test.tsx` | FE-SUM-001..003 | Empty state, header counts, renders one CoupleCard per summary | Implemented | More assertions on currency count wording and edge formatting |
| UI | CostLedger | `src/components/CostLedger.test.tsx` | FE-LED-001..007 | Sorted render, add/edit/delete orchestration, bulk apply + clear selection, add/edit save-failure toast handling | Implemented | Real DnD reorder path, cancel paths in add/edit/delete |
| UI | ToastViewport | `src/components/ToastViewport.test.tsx` | FE-TST-001..003 | Manual dismiss, auto-dismiss timing, aria-live behavior by toast type | Implemented | Visual layering assertions with modal/mobile nav in responsive integration test |
| UI | CostRow | `src/components/CostRow.test.tsx` | Existing tests | Split-type rendering and split modal open behavior | Existing | Inline name/amount editing, markup +/- controls |
| UI | CoupleCard | `src/components/CoupleCard.test.tsx` | Existing tests | Icon/color modal interactions and persistence behavior | Existing | Exchange-rate input and USD display paths |
| UI | GroupSetup | `src/components/GroupSetup.test.tsx` | Existing tests | Icon/color selection and related modal behavior | Existing | Full CRUD for groups/children and reorder assertions |
| Integration | App workflows | `src/integration.test.tsx` | Existing tests | Theme toggling, persistence checks, icon/color propagation | Existing | Full trip journey, subset split path, reset roundtrip |
| Logic | Calculations | `src/lib/calculations.test.ts` | CALC-* | Rounding, validation, split, summary, formatting invariants | Implemented | None for current ruleset; update when business rules change |

## Current Totals
- Total frontend FE test IDs added in latest pass: 40
- Total component/frontend test files now present: 9 frontend files + 1 logic file + integration/store suites
- Last full run: `npm run test -- --run` -> 16 files, 193 tests passed

## Priority Backlog
1. Add responsive assertions (mobile/tablet/desktop behavior)
2. Add accessibility-focused tests (focus trap, keyboard flows, richer aria assertions)
3. Expand integration journeys in `src/integration.test.tsx`
4. Add real DnD reorder tests when test harness is ready
