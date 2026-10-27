# Trip Dates Implementation Plan

## Scope
Add optional ISO date-only trip start and end dates to trip metadata, snapshots, history, save slots, and both workbook schemas. Dates remain empty by default; same-day and past dates are valid.

## Decisions
- Store dates as `YYYY-MM-DD` strings, avoiding timezone conversion.
- Treat legacy snapshots without either field as empty dates.
- Keep date ranges together in one atomic store action.
- Require a start date when an end date is set; end must be on or after start.
- Invalid edits remain visible as drafts and must not enter persisted trip data or be silently saved/exported.

## Phases
1. Add trip-date state, persistence migration, snapshot/history/undo/redo coverage, and save-slot equality normalization.
2. Add the accessible Trip Information card with Region and responsive date inputs; implement draft validation and replacement guards.
3. Add single-sheet and three-sheet workbook metadata export/import, legacy compatibility, warnings for invalid date pairs, and round-trip coverage.
4. Run focused tests, typecheck, and build; record results and known limitations.

## Completion
The feature is complete when valid dates survive save/load/undo/redo and both spreadsheet schemas; legacy files load with empty dates; invalid drafts cannot be committed or silently saved/exported.

## Verification
- Full Vitest suite: 649 tests passed across 66 files.
- TypeScript and focused tests passed; production build passed with the existing large-chunk warning.
- Responsive styling is implemented; live browser layout and native date-picker behavior have not been manually verified.
