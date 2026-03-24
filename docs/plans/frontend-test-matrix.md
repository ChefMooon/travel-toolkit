# Frontend Test Coverage Matrix

## Purpose
Provide a compact, scan-friendly view of frontend test coverage so future work can quickly identify gaps.

## Coverage Matrix

| Area | Component / Module | Test File | Test IDs | What Is Covered | Status | Next Gaps |
|---|---|---|---|---|---|---|
| UI | EditRow | `src/components/EditRow/EditRow.test.tsx` | FE-EDT-001..015 | Save validation, split assignment rules, markup mode behavior, cancel flow, region currency options, validation-warning toast emission, auto-reset split type when no groups selected, color dots visualization | Implemented | Keyboard-only interaction paths, field-level aria labels |
| UI | Topbar | `src/components/Topbar/Topbar.test.tsx` | FE-TOP-001..007 | Trip name update/clear, markup editing/validation, theme toggle, reset modal flow | Implemented | Enter/Escape behavior on all controls, focus order assertions |
| UI | TripToolbar | `src/components/TripToolbar/TripToolbar.test.tsx` | FE-TBR-001..007 | Trip name render/change/clear, markup edit toggle, negative markup rejection, reset modal open, reset confirm | Implemented | - |
| UI | BulkActionBar | `src/components/BulkActionBar/BulkActionBar.test.tsx` | FE-BULK-001..005 | Conditional render, currency change callback, apply/clear callbacks | Implemented | Disabled state behavior if added later |
| UI | MobileNav | `src/components/MobileNav/MobileNav.test.tsx` | FE-NAV-001..003 | Tab render, active state class, onChange emissions | Implemented | Keyboard navigation and aria-current semantics |
| UI | Modal | `src/components/Modal/Modal.test.tsx` | FE-MOD-001..006 | Render content, confirm/cancel callbacks, backdrop close, compact mode, `aria-modal` | Implemented | Focus trap, Escape handling parity across all modal usages |
| UI | SplitAssignmentModal | `src/components/SplitAssignmentModal/SplitAssignmentModal.test.tsx` | FE-SAM-001..009 | Subset/individual mode headers and input types, couple name labels, toggle callback, confirm disabled with no selection, confirm action, empty state, backdrop click, create group | Implemented | - |
| UI | RegionSelector | `src/components/RegionSelector/RegionSelector.test.tsx` | FE-REG-001..003 | Current value render, all options render, setRegion callback | Implemented | Persist/rehydrate behavior via integration test |
| UI | CostSummary | `src/components/CostSummary/CostSummary.test.tsx` | FE-SUM-001..003 | Empty state, header counts, renders one CoupleCard per summary | Implemented | More assertions on currency count wording and edge formatting |
| UI | CostLedger | `src/components/CostLedger/CostLedger.test.tsx` | FE-LED-001..009 | Sorted render, add/edit/delete orchestration, bulk apply + clear selection, add/edit save-failure toast handling, grouped payload propagation | Implemented | Real DnD reorder path, cancel paths in add/edit/delete |
| UI | ToastViewport | `src/components/ToastViewport/ToastViewport.test.tsx` | FE-TST-001..003 | Manual dismiss, auto-dismiss timing, aria-live behavior by toast type | Implemented | Visual layering assertions with modal/mobile nav in responsive integration test |
| UI | CostRow | `src/components/CostRow/CostRow.test.tsx` | Existing tests | Split-type rendering and split modal open/close behavior | Existing | Inline name/amount editing, markup +/- controls |
| UI | CoupleCard | `src/components/CoupleCard/CoupleCard.test.tsx` | Existing tests | Icon/color modal interactions and persistence behavior | Existing | Exchange-rate input and USD display paths |
| UI | GroupSetup | `src/components/GroupSetup/GroupSetup.test.tsx` | Existing tests | Icon/color selection and related modal behavior | Existing | Full CRUD for groups/children and reorder assertions |
| Tool | CurrencyTool | `src/features/currency/CurrencyTool.test.tsx` | FE-CUR-001..006 | Default inputs, loading state, error + retry, rate line and conversion display, target currency change, zero for invalid/negative amount | Implemented | - |
| Tool | ForecastTool | `src/features/forecast/ForecastTool.test.tsx` | FE-FOR-001..007 | Search input + date range defaults, suggestions from geocode data, keyboard selection, loading climate state, geocode error, climate metrics render, events section on date overlap | Implemented | Real API call paths, debounce timing |
| Tool | ClockGrid | `src/features/timezone/ClockGrid.test.tsx` | FE-TZ-001 | Renders one ClockCard per tracked zone; empty state when no zones | Implemented | - |
| Tool | AnalogClock | `src/features/timezone/AnalogClock.test.tsx` | FE-TZ-002 | SVG renders with aria-hidden; hour, minute, and second hand elements are present | Implemented | - |
| Tool | DigitalClock | `src/features/timezone/DigitalClock.test.tsx` | FE-TZ-003..004 | compact shows HH:mm only; detailed + showSeconds shows full time12 with AM/PM | Implemented | - |
| Tool | TimezoneNavbar | `src/features/timezone/TimezoneNavbar.test.tsx` | FE-TZ-005..006 | Settings button opens ConfigModal; Detect calls setLocalTz with browser timezone | Implemented | - |
| Tool | TimezoneSelect | `src/features/timezone/TimezoneSelect.test.tsx` | FE-TZ-007a..007c | Renders full IANA option list; search input narrows list; selecting option calls onChange | Implemented | - |
| Tool | ClockCard | `src/features/timezone/ClockCard.test.tsx` | FE-TZ-008a..008b | displayMode=digital shows time text; displayMode=analog shows SVG | Implemented | - |
| Integration | App workflows | `src/integration.test.tsx` | Existing tests | Theme toggling, persistence checks, icon/color propagation | Existing | Full trip journey, subset split path, reset roundtrip |
| Logic | Calculations | `src/lib/calculations.test.ts` | CALC-* | Rounding, validation, split, summary, formatting invariants | Implemented | None for current ruleset; update when business rules change |

## Current Totals
- Total frontend FE test IDs added in latest pass: 44 (v1.0.1) + 40 (v1.0.2 = SAM×9 + TBR×7 + CUR×6 + FOR×7 + TZ×11)
- Total test files: 33 (15 component, 5 feature tool, 4 utility/store, 2 integration+responsive, 7 pre-existing component)
- Last full run: `npm run test -- --run` → 33 files, 280 tests passed

## Priority Backlog
1. Expand integration journeys in `src/integration.test.tsx` (full cost entry → summary roundtrip)
2. Add accessibility-focused tests (focus trap, keyboard flows, richer aria assertions)
3. Add real DnD reorder tests when test harness is ready
4. Route-level smoke tests once routing layer stabilises
