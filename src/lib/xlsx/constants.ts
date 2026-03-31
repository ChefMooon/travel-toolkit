// ── Sheet names (three-sheet schema) ──
export const SHEET_SUMMARY = 'Summary';
export const SHEET_COSTS = 'Costs';
export const SHEET_PARTY = 'Party';

// ── Single-sheet fixed cell positions ──
export const SS_SUMMARY_LABEL = 'A1';
export const SS_SCHEMA_ROW = 2; // A2: "schema", B2: version
export const SS_TRIP_ID_ROW = 3;
export const SS_TRIP_NAME_ROW = 4;
export const SS_GLOBAL_MARKUP_ROW = 5;
export const SS_REGION_ROW = 6;
export const SS_TARGET_CURRENCY_ROW = 7;

export const SS_SECTION_LABEL_ROW = 0; // row 1 (0-indexed)
export const SS_SECTION_HEADER_ROW = 1; // row 2 (0-indexed)
export const SS_SECTION_DATA_START_ROW = 2; // row 3 (0-indexed)

export const SS_PARTY_COL = 3; // column D (0-indexed)
export const SS_NPT_COL = 8; // column I (0-indexed)
export const SS_COST_HEADER_COL = 5; // column F (0-indexed)
export const SS_COST_COL = 11; // column L (0-indexed)
export const SS_EXCHANGE_COL = 19; // column T (0-indexed)
export const SS_COST_HEADER_ROW = 0; // row 1 (0-indexed)

export const SS_PARTY_START_ROW = 9; // row 10 (0-indexed), header at row 10, data from row 11

export const SS_EXCHANGE_RATE_LABEL_ROW = 8; // row 9 (0-indexed) — after party if short list, or on right side

// ── Cost ledger column headers (shared by both schemas) ──
export const COST_HEADERS = [
  'Name',
  'Currency',
  'Amount',
  'Markup',
  'Split',
  'Assigned To',
  'Type',
] as const;

// ── Party column headers ──
export const PARTY_COUPLE_HEADERS = [
  'Name',
  'Color Index',
  'Icon Index',
  'Sort Order',
] as const;

export const PARTY_NPT_HEADERS = [
  'Label',
  'Parent Group',
] as const;

// ── Summary metadata keys (three-sheet schema) ──
export const SUMMARY_KEYS = [
  'schema',
  'tripId',
  'tripName',
  'globalMarkup',
  'region',
  'targetCurrency',
] as const;

// ── Exchange rate headers ──
export const EXCHANGE_RATE_HEADERS = [
  'Currency',
  'Rate to USD',
  'Overridden',
] as const;
