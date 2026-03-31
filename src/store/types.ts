export type SplitType = 'shared' | 'subset' | 'individual';

export interface Couple {
  id: string;
  name: string;
  colorIndex: number; // 1-10 for couple color palette
  iconIndex: number; // 1-10 for couple icon
  sortOrder: number;
}

export interface NonPayingTraveller {
  id: string;
  label: string;
  coupleId: string; // parent couple
}

export interface CostEntry {
  id: string;
  name: string;
  currency: string;
  value: number;
  markupOverride: number | null; // null = use global
  splitType: SplitType;
  assignedCoupleIds: string[];
  sortOrder: number;
  type?: string | null;
}

export interface CostEntryType {
  id: string;
  type_name: string;
  symbol: string;
  color: string;
}

// Edit COST_ENTRY_TYPES to add, remove, or change available cost types.
export const COST_ENTRY_TYPES: readonly CostEntryType[] = [
  { id: 'accommodation', type_name: 'Accommodation', symbol: '🏨', color: '#5B8DD9' },
  { id: 'tours',         type_name: 'Tours',         symbol: '🚙', color: '#4AACB0' },
  { id: 'trains',        type_name: 'Trains',        symbol: '🚂', color: '#E5C565' },
  { id: 'transfer',      type_name: 'Transfer',      symbol: '✈️', color: '#D46B8E' },
  { id: 'food',          type_name: 'Food',          symbol: '🍽️', color: '#E0875A' },
  { id: 'activity',      type_name: 'Activity',      symbol: '🎭', color: '#9B72CF' },
];

export interface ExchangeRate {
  currency: string;
  rateToUSD: number;
  isOverridden?: boolean;
}

export interface CurrencyBreakdown {
  currency: string;
  shared: number;
  subset: number;
  individual: number;
  subtotal: number;
  targetEquivalent: number | null;
}

export interface CoupleSummary {
  coupleId: string;
  coupleName: string;
  colorIndex: number;
  iconIndex: number;
  currencies: CurrencyBreakdown[];
  grandTotal: number | null;
  targetCurrency: string;
}

export interface TripSnapshot {
  tripId: string;
  tripName: string;
  globalMarkup: number;
  couples: Couple[];
  nonPayingTravellers: NonPayingTraveller[];
  costs: CostEntry[];
  exchangeRates: ExchangeRate[];
  theme: 'light' | 'dark';
  region: Region;
  targetCurrency: string;
}

export interface SaveSlot {
  slotIndex: number;
  schemaVersion: number;
  label: string;
  tripId: string;
  tripName: string;
  savedAt: string;
  coupleCount: number;
  costCount: number;
  targetCurrency: string;
  data: TripSnapshot;
}

export const CURRENCIES = [
  'EUR', 'USD', 'GBP', 'MXN', 'JPY', 'CAD', 'AUD',
  'SGD', 'HKD', 'NZD', 'BRL', 'INR', 'THB', 'ZAR'
] as const;

export const CURRENCY_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', MXN: '🇲🇽', JPY: '🇯🇵',
  CAD: '🇨🇦', AUD: '🇦🇺', SGD: '🇸🇬', HKD: '🇭🇰',
  NZD: '🇳🇿', BRL: '🇧🇷', INR: '🇮🇳', THB: '🇹🇭', ZAR: '🇿🇦',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', MXN: 'MX$', JPY: '¥',
  CAD: 'C$', AUD: 'A$', SGD: 'S$', HKD: 'HK$',
  NZD: 'NZ$', BRL: 'R$', INR: '₹', THB: '฿', ZAR: 'R',
};

export type Region = 'North America' | 'Europe' | 'Asia' | 'Oceania' | 'Americas' | 'Africa';

export const REGIONS: Record<Region, string[]> = {
  'North America': ['CAD', 'USD'],
  'Europe': ['EUR', 'GBP'],
  'Asia': ['JPY', 'SGD', 'HKD', 'INR', 'THB'],
  'Oceania': ['AUD', 'NZD'],
  'Americas': ['MXN', 'BRL'],
  'Africa': ['ZAR'],
};

export const ALWAYS_AVAILABLE_CURRENCIES = ['CAD', 'USD'];

// Hard limits for trip data — also used by the future .xlsx import parser
export const MAX_GROUPS = 100;
export const MAX_KIDS_PER_GROUP = 50;
export const MAX_COST_ENTRIES = 1000;
export const MAX_TRIP_NAME_LENGTH = 100;
export const MAX_GROUP_NAME_LENGTH = 50;
export const MAX_COST_NAME_LENGTH = 200;
export const MAX_SAVE_SLOTS = 3;
export const MAX_SLOT_LABEL_LENGTH = 30;
export const SAVE_SLOT_SCHEMA_VERSION = 1;

export const TRIP_LIMITS = {
  MAX_GROUPS,
  MAX_KIDS_PER_GROUP,
  MAX_COST_ENTRIES,
  MAX_TRIP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MAX_COST_NAME_LENGTH,
} as const;

export function getDefaultSlotLabel(slotIndex: number): string {
  return `Slot ${slotIndex + 1}`;
}

export const REGION_LIST = Object.keys(REGIONS) as Region[];

export function getAvailableCurrencies(region: Region): string[] {
  const regionCurrencies = REGIONS[region] || [];
  const available = new Set([...regionCurrencies, ...ALWAYS_AVAILABLE_CURRENCIES]);
  return Array.from(available).sort();
}

export const COUPLE_ICONS = [
  '🧳', '🌿', '🗺️', '🌸', '✨',
  '🎒', '🌊', '🏔️', '🎉', '🌙',
];

export const COUPLE_COLORS: Record<
  number,
  { light: string; dark: string }
> = {
  1: { light: '#C4737A', dark: '#E89096' },    // rose
  2: { light: '#6A8F7A', dark: '#86B096' },    // sage
  3: { light: '#7B87BE', dark: '#98A8D9' },    // periwinkle
  4: { light: '#C49A6A', dark: '#DFB885' },    // tan
  5: { light: '#9B7BB4', dark: '#B89DCE' },    // mauve
  6: { light: '#4A8A99', dark: '#6DB5C6' },    // teal
  7: { light: '#D8724C', dark: '#F4956D' },    // coral
  8: { light: '#C9A941', dark: '#E5C565' },    // gold
  9: { light: '#2B4563', dark: '#5A7DB8' },    // navy
  10: { light: '#B85A7E', dark: '#D887A8' },   // berry
};

export function getColorThemeValue(
  colorIndex: number,
  mode: 'light' | 'dark'
): string {
  const color = COUPLE_COLORS[colorIndex];
  return color?.[mode] ?? '#000000';
}
