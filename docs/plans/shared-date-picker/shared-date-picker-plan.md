# Shared Date Picker Plan

## Goal

Provide an accessible, themed date picker for the Trip Information card that supports both direct date entry and calendar selection. Keep trip dates as date-only `YYYY-MM-DD` strings throughout the UI and store.

## Product behavior

- The text field preserves partial and malformed drafts while the user edits.
- A date is committed only after strict Gregorian validation. End dates require a start date and cannot precede it. Empty start and end values remain allowed.
- Invalid drafts stay visible, are announced accessibly, and continue to use the existing navigation, save, export, undo, reset, and replacement safeguards.
- The calendar opens from a Lucide icon button, supports month and direct year navigation, closes on outside interaction or Escape, and restores focus to its trigger after keyboard dismissal or date selection.
- Arrow keys move by day or week; Home and End move to the start and end of the displayed week; Page Up and Page Down change months, with Shift changing years.
- Calendar dates use a row/gridcell structure and a roving tab stop. The current month is announced, and the popup is portalled to the document body so transformed page containers cannot offset fixed positioning. It is positioned within the visual viewport and above the fixed mobile trip navigation, with vertical scrolling when space is limited.
- Region, start date, and end date share one row when the card has room, then wrap to two columns and a single column as its container narrows.

## Implementation

- `src/components/DatePicker/DatePicker.tsx` owns the controlled text field and calendar popup.
- `src/components/DatePicker/dateUtils.ts` validates date-only Gregorian values and supplies the shared trip-pair error check.
- `src/components/RegionSelector/RegionSelector.tsx` keeps invalid text drafts local and only commits a valid pair through the existing trip store action.
- Shared styles use theme tokens and cover keyboard focus, touch target sizes, reduced motion, and forced colors.

## Verification

- Focused DatePicker and RegionSelector tests cover grid semantics, roving focus, month/year navigation, focus restoration, the format hint, viewport placement, invalid end-only input, partial/impossible dates, leap-day validation, valid commits, and calendar selection.
- Focused DatePicker and RegionSelector tests passed (12 tests); typecheck and build passed. The full suite passed 652 tests before the final popup placement adjustment, whose focused tests passed afterward.
- At a 375×812 browser viewport, the calendar was verified to fit above mobile navigation after the placement fix. No physical mobile device was tested.
- Final full suite after shared dropdown, numeric input, tooltip, and alignment refinements: 659 tests passed across 67 files.

## Scope

The picker is currently integrated only into Trip Information. Forecast controls are unchanged.
