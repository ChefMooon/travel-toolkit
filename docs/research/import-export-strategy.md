# Import/Export Strategy

## Goal

Define a file export/import approach for trip cost data that is readable in Excel, supports round-trip editing, and can store multiple trip versions.

## Current App Context

The trip feature already keeps the editable source data in the Zustand trip store:
- trip name
- global markup
- couples
- non-paying travellers
- costs
- exchange rates
- region
- target currency
- theme

Calculated totals are derived from that source data, so exports should focus on source inputs rather than computed values.

## Decision Summary

Preferred direction:
- Use `.xlsx` rather than `.csv` for spreadsheet export/import.
- Support multiple workbook schemas.
- Keep the imported data normalized so the app can recalculate everything after import.
- Allow users to choose between a compact single-sheet workbook and a more explicit multi-sheet workbook.

## Why `.xlsx`

`.xlsx` is the best fit because it can:
- open cleanly in Excel
- preserve formatting and layout
- support multiple sheets
- keep data readable for non-technical users
- round-trip better than flat CSV when there are multiple related tables

CSV is still useful for simple tabular exports, but it does not support the worksheet layouts discussed here.

## Supported Export Schemas

### 1. Single-sheet workbook

A compact workbook with one sheet and fixed regions.

Suggested layout:
- `A1`: `Summary`
- `A2`: `schema`, `B2`: schema version value
- `A3`: `Trip Name`
- `A4`: `Global Markup`
- `A5`: `Region`
- `A6`: `Trip Currency`
- `D1`: `Cost Ledger`
- `D2`: `Name`
- `E2`: `Currency`
- `F2`: `Amount`
- `G2`: `Markup`
- `H2`: `Split`
- `I2`: `Who`
- `A10`: `Travelling Party`
- `A11`: `Name`
- `B11`: `Children`

Good for:
- a single printable sheet
- compact exports
- users who want everything in one place

Tradeoffs:
- harder to validate if users move cells around
- more fragile on import than a multi-sheet format
- layout assumptions must stay strict

Import notes:
- Read metadata from `A2:B6`.
- Read the cost ledger from `D2:I` downward until the first blank cost row.
- Read the travelling party from `A11:B` downward until the first blank party row.
- Treat the row and column positions as fixed so the importer can map the workbook deterministically.

### 2. Three-sheet workbook

A structured workbook with one sheet per logical section.

Suggested sheets:
- `Summary` for trip metadata
- `Costs` for the cost ledger
- `Party` for couples and non-paying travellers

Good for:
- clearer editing
- simpler import parsing
- easier validation
- less risk from accidental sheet edits

Tradeoffs:
- less compact than a one-sheet export
- slightly more workbook overhead

## Recommended Import Rules

The importer should accept both schemas.

Suggested rules:
- Include a schema/version marker in every export.
- Prefer the marker when importing.
- If the marker is missing, detect the schema from sheet names and layout.
- Validate required fields before loading data into the store.
- Rebuild the trip store from imported source data only.
- Recalculate totals, summaries, and exchange-based outputs after import.

## Data That Should Be Exported

Source inputs to export:
- trip name
- global markup
- region
- target currency
- couples
- non-paying travellers
- costs
- exchange rates if the file should be fully portable

Derived data should not be exported as authoritative values:
- couple totals
- currency breakdowns
- grand totals
- other computed summaries

## Multi-Version Support

Multiple trip versions are easy to support if each export is a separate file.

Suggested naming pattern:
- `trip-name-option-a.xlsx`
- `trip-name-option-b.xlsx`
- `trip-name-final.xlsx`

This works naturally with either workbook schema.

## Current App Implications

To support this cleanly, the app would need:
- export controls in the trip toolbar or a dedicated menu
- file download handling for workbook export
- file input handling for workbook import
- parser/serializer logic for each supported schema
- validation and error handling for malformed files
- a versioned schema contract

## Future Upgrade Path

If broader save-for-later behavior is desired later, the next layer would be:
- multiple saved trips in browser storage
- an active trip selector
- duplicate/rename/delete trip actions
- optional cloud or account-backed sync later on

## Final Recommendation

Implement `.xlsx` export/import with two supported schemas:
- single-sheet for compact, human-readable exports
- three-sheet for clearer structured editing

Use a versioned schema marker so the importer can handle both reliably.
