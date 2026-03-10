export type SplitType = 'shared' | 'subset' | 'individual';

export interface Couple {
  id: string;
  name: string;
  colorIndex: number; // 1-5 for couple color palette
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
  currencies: CurrencyBreakdown[];
  grandTotalUSD: number | null;
}

export const CURRENCIES = [
  'EUR', 'USD', 'GBP', 'MXN', 'JPY', 'CAD', 'AUD', 'CHF',
  'SGD', 'HKD', 'DKK', 'SEK', 'NOK', 'NZD', 'BRL', 'INR', 'THB', 'ZAR'
] as const;

export const CURRENCY_FLAGS: Record<string, string> = {
  EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧', MXN: '🇲🇽', JPY: '🇯🇵',
  CAD: '🇨🇦', AUD: '🇦🇺', CHF: '🇨🇭', SGD: '🇸🇬', HKD: '🇭🇰',
  DKK: '🇩🇰', SEK: '🇸🇪', NOK: '🇳🇴', NZD: '🇳🇿', BRL: '🇧🇷',
  INR: '🇮🇳', THB: '🇹🇭', ZAR: '🇿🇦',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', MXN: 'MX$', JPY: '¥',
  CAD: 'C$', AUD: 'A$', CHF: 'CHF', SGD: 'S$', HKD: 'HK$',
  DKK: 'kr', SEK: 'kr', NOK: 'kr', NZD: 'NZ$', BRL: 'R$',
  INR: '₹', THB: '฿', ZAR: 'R',
};

export const COUPLE_ICONS = ['🧳', '🌿', '🗺️', '🌸', '✨'];
