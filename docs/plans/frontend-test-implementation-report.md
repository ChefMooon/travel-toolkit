# Frontend Test Implementation Report

## Objective
Document the frontend tests added during the current implementation pass, including scope, test IDs, and what each suite validates.

## Summary
- New test files added: 8
- New tests added: 40
- Full suite status after implementation: 16 files passing, 193 tests passing
- Last verification command: `npm run test -- --run`

## New Test Files

### `src/components/EditRow.test.tsx` (8 tests)
Focus: data entry validation and split assignment behavior.

- FE-EDT-001: Saves valid shared cost with global markup
- FE-EDT-002: Blocks save when required fields are invalid
- FE-EDT-003: Requires assignment for subset split
- FE-EDT-004: Individual split keeps only first assigned group
- FE-EDT-005: Saves custom markup when global markup is disabled
- FE-EDT-006: Reset button restores global markup mode
- FE-EDT-007: Region-filtered currency options include always-available currencies
- FE-EDT-008: Cancel button triggers `onCancel`

### `src/components/Topbar.test.tsx` (7 tests)
Focus: trip metadata controls, theme toggle, and reset flow.

- FE-TOP-001: Trip name updates through store action
- FE-TOP-002: Clear trip name button appears on focus and clears value
- FE-TOP-003: Valid global markup saves on blur
- FE-TOP-004: Invalid global markup is rejected
- FE-TOP-005: Theme toggles from light to dark
- FE-TOP-006: Reset modal confirm triggers `resetTrip`
- FE-TOP-007: Reset modal cancel does not trigger `resetTrip`

### `src/components/BulkActionBar.test.tsx` (5 tests)
Focus: bulk action controls and callback wiring.

- FE-BULK-001: Hidden when selected count is zero
- FE-BULK-002: Displays selected count when active
- FE-BULK-003: Currency dropdown change callback fires
- FE-BULK-004: Apply triggers callback with current currency
- FE-BULK-005: Clear triggers callback

### `src/components/MobileNav.test.tsx` (3 tests)
Focus: tab rendering and navigation state changes.

- FE-NAV-001: Renders Party, Costs, Summary tabs
- FE-NAV-002: Applies active class to current tab
- FE-NAV-003: Clicking tabs emits correct `onChange` values

### `src/components/Modal.test.tsx` (6 tests)
Focus: reusable confirmation dialog behavior and baseline accessibility.

- FE-MOD-001: Renders icon, title, body, and action buttons
- FE-MOD-002: Confirm button triggers `onConfirm`
- FE-MOD-003: Cancel button triggers `onCancel`
- FE-MOD-004: Backdrop click triggers cancel behavior
- FE-MOD-005: Compact variant applies expected classes
- FE-MOD-006: Dialog includes `aria-modal="true"`

### `src/components/RegionSelector.test.tsx` (3 tests)
Focus: region selection and store interaction.

- FE-REG-001: Renders current region value
- FE-REG-002: Renders all region options
- FE-REG-003: Changing region calls `setRegion`

### `src/components/CostSummary.test.tsx` (3 tests)
Focus: summary container rendering and metadata.

- FE-SUM-001: Empty state shown when no summary data exists
- FE-SUM-002: Header shows group and currency counts
- FE-SUM-003: Renders one `CoupleCard` per computed summary

### `src/components/CostLedger.test.tsx` (5 tests)
Focus: ledger orchestration for add/edit/delete/selection/bulk apply.

- FE-LED-001: Rows render sorted by `sortOrder`
- FE-LED-002: Add flow calls `addCost` with saved payload
- FE-LED-003: Edit flow calls `editCost` for selected row
- FE-LED-004: Delete flow confirms and calls `deleteCost`
- FE-LED-005: Bulk apply updates selected IDs then clears selection

## Coverage Improvements Achieved
- Added direct coverage for previously untested components:
  - `EditRow`
  - `Topbar`
  - `BulkActionBar`
  - `MobileNav`
  - `Modal`
  - `RegionSelector`
  - `CostSummary`
  - `CostLedger`
- Added baseline accessibility assertion on shared modal dialog semantics.
- Added component-level orchestration tests for key cost management flows.

## Deferred Areas (Not Implemented in This Pass)
- Drag-and-drop behavior validation (intentionally deferred)

---

## v1.0.2 Coverage Additions

### Summary
- New test files added: 10
- New tests added: 40+ (SAM×9, TBR×7, CUR×6, FOR×7, TZ×11)
- Full suite status after implementation: 33 files passing, 280 tests passing
- Last verification command: `npm run test -- --run`

### `src/components/SplitAssignmentModal/SplitAssignmentModal.test.tsx` (9 tests)
Focus: subset vs. individual mode, couple selection callbacks, empty state, backdrop, group creation.

- FE-SAM-001: Subset mode renders "Select Groups" header and checkboxes
- FE-SAM-002: Individual mode renders "Select Group" header and radio buttons
- FE-SAM-003: Each couple row is labelled with the couple name
- FE-SAM-004: Clicking a row calls onToggleCouple with the correct coupleId
- FE-SAM-005: Confirm button is disabled when no couples are selected (subset mode)
- FE-SAM-006: Confirm button calls onConfirmSubset when ≥1 couple is selected
- FE-SAM-007: Empty state message renders when couples array is empty
- FE-SAM-008: Backdrop overlay click calls onClose
- FE-SAM-009: Create Group button calls onCreateGroup

### `src/components/TripToolbar/TripToolbar.test.tsx` (7 tests)
Focus: trip name controls, markup editing, reset modal flow (store-backed, mirrors Topbar coverage).

- FE-TBR-001: Renders trip name input pre-filled with tripName
- FE-TBR-002: Focusing trip name reveals clear button; clicking it calls setTripName('')
- FE-TBR-003: Typing in the trip name input calls setTripName with the entered value
- FE-TBR-004: Clicking markup toggle shows editing input pre-filled with globalMarkup
- FE-TBR-005: Blurring markup input with negative value does not call setGlobalMarkup
- FE-TBR-006: Clicking New Trip button opens reset confirmation modal
- FE-TBR-007: Confirming reset modal calls resetTrip

### `src/features/currency/CurrencyTool.test.tsx` (6 tests)
Focus: default inputs, query states (loading/error/success), rate display, currency change, invalid amount.

- FE-CUR-001: Renders amount input and base/target dropdowns with default values
- FE-CUR-002: Shows loading status while query is pending
- FE-CUR-003: Shows error message and retry button when query fails
- FE-CUR-004: Displays rate line and formatted conversion after successful load
- FE-CUR-005: Changing the target currency updates the displayed conversion
- FE-CUR-006: Negative amount input is treated as zero without crashing

### `src/features/forecast/ForecastTool.test.tsx` (7 tests)
Focus: search UI, suggestion list from geocode, keyboard selection, loading/error states, climate metrics, event overlap detection.

- FE-FOR-001: Renders location search input and date range inputs with defaults
- FE-FOR-002: Typing in search shows suggestion list from geocode results
- FE-FOR-003: Pressing ArrowDown then Enter selects the focused suggestion
- FE-FOR-004: Shows loading state while climate data is fetching
- FE-FOR-005: Shows error state when geocoding fails
- FE-FOR-006: Climate metric cards render after a location and data are loaded
- FE-FOR-007: Events section appears when events overlap the selected date range

### Timezone feature tests (11 tests across 6 files)

**`src/features/timezone/ClockGrid.test.tsx`** (2 tests)
- FE-TZ-001: Renders a ClockCard for each tracked zone
- (bonus) Renders empty state when no zones are tracked

**`src/features/timezone/AnalogClock.test.tsx`** (1 test)
- FE-TZ-002: Renders SVG with aria-hidden; hour, minute, and second hand elements are present

**`src/features/timezone/DigitalClock.test.tsx`** (2 tests)
- FE-TZ-003: compact detailLevel shows HH:mm only
- FE-TZ-004: detailed detailLevel with showSeconds shows full time12 including AM/PM

**`src/features/timezone/TimezoneNavbar.test.tsx`** (2 tests)
- FE-TZ-005: Settings button opens ConfigModal
- FE-TZ-006: Detect button calls setLocalTz with the browser timezone

**`src/features/timezone/TimezoneSelect.test.tsx`** (3 tests)
- FE-TZ-007a: Renders a large list of IANA timezone options
- FE-TZ-007b: Typing in the search input narrows the timezone list
- FE-TZ-007c: Selecting an option calls onChange with the timezone value

**`src/features/timezone/ClockCard.test.tsx`** (2 tests)
- FE-TZ-008a: displayMode=digital renders the card title and formatted time text
- FE-TZ-008b: displayMode=analog renders an SVG clock face

### Notes
- `scrollIntoView` is mocked on `HTMLElement.prototype` in ForecastTool tests — jsdom does not implement it.
- AnalogClock SVG hand identification uses both `stroke` colour and `stroke-width` to distinguish hands from tick marks.
- All timezone component tests receive a fixed `DateTime` fixture to ensure deterministic time display.
- Responsive layout assertions by viewport
- Expanded keyboard/focus accessibility testing beyond modal attributes
- Full multi-step frontend journeys in `integration.test.tsx`

## How to Run
```sh
npm run test -- --run
```

## Related Documents
- Coverage matrix: `docs/plans/frontend-test-matrix.md`
- Maintenance guide: `docs/plans/test-maintenance-guide.md`
