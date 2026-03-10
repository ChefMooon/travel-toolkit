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
}

export interface ExchangeRate {
  currency: string;
  rateToUSD: number;
}

export interface CurrencyBreakdown {
  currency: string;
  shared: number;
  subset: number;
  individual: number;
  subtotal: number;
  usdEquivalent: number | null;
}

export interface CoupleSummary {
  coupleId: string;
  coupleName: string;
  colorIndex: number;
  iconIndex: number;
  currencies: CurrencyBreakdown[];
  grandTotalUSD: number | null;
}

export const CURRENCIES = [
  'EUR', 'USD', 'GBP', 'MXN', 'JPY', 'CAD', 'AUD', 'CHF',
  'SGD', 'HKD', 'DKK', 'SEK', 'NOK', 'NZD', 'BRL', 'INR', 'THB', 'ZAR',
  'CZK', 'HUF', 'PLN', 'RON'
] as const;

export const CURRENCY_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', MXN: '🇲🇽', JPY: '🇯🇵',
  CAD: '🇨🇦', AUD: '🇦🇺', CHF: '🇨🇭', SGD: '🇸🇬', HKD: '🇭🇰',
  DKK: '🇩🇰', SEK: '🇸🇪', NOK: '🇳🇴', NZD: '🇳🇿', BRL: '🇧🇷',
  INR: '🇮🇳', THB: '🇹🇭', ZAR: '🇿🇦',
  CZK: '🇨🇿', HUF: '🇭🇺', PLN: '🇵🇱', RON: '🇷🇴',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', MXN: 'MX$', JPY: '¥',
  CAD: 'C$', AUD: 'A$', CHF: 'CHF', SGD: 'S$', HKD: 'HK$',
  DKK: 'kr', SEK: 'kr', NOK: 'kr', NZD: 'NZ$', BRL: 'R$',
  INR: '₹', THB: '฿', ZAR: 'R',
  CZK: 'Kč', HUF: 'Ft', PLN: 'zł', RON: 'lei',
};

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
  return color[mode];
}
