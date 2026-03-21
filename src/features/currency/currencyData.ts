export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

type CurrencyRateTable = Record<SupportedCurrency, number>;

type CurrencySnapshot = {
  updatedAt: string;
  rates: CurrencyRateTable;
};

const RATE_SNAPSHOTS: Record<SupportedCurrency, CurrencySnapshot> = {
  USD: {
    updatedAt: 'Updated moments ago',
    rates: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.78,
      CAD: 1.36,
      JPY: 149.2,
      AUD: 1.53,
    },
  },
  EUR: {
    updatedAt: 'Updated moments ago',
    rates: {
      USD: 1.09,
      EUR: 1,
      GBP: 0.85,
      CAD: 1.48,
      JPY: 162.3,
      AUD: 1.66,
    },
  },
  GBP: {
    updatedAt: 'Updated moments ago',
    rates: {
      USD: 1.28,
      EUR: 1.18,
      GBP: 1,
      CAD: 1.74,
      JPY: 191.3,
      AUD: 1.96,
    },
  },
  CAD: {
    updatedAt: 'Updated moments ago',
    rates: {
      USD: 0.74,
      EUR: 0.67,
      GBP: 0.58,
      CAD: 1,
      JPY: 109.7,
      AUD: 1.12,
    },
  },
  JPY: {
    updatedAt: 'Updated moments ago',
    rates: {
      USD: 0.0067,
      EUR: 0.0062,
      GBP: 0.0052,
      CAD: 0.0091,
      JPY: 1,
      AUD: 0.0103,
    },
  },
  AUD: {
    updatedAt: 'Updated moments ago',
    rates: {
      USD: 0.65,
      EUR: 0.6,
      GBP: 0.51,
      CAD: 0.89,
      JPY: 97.8,
      AUD: 1,
    },
  },
};

export type CurrencySnapshotResponse = {
  base: SupportedCurrency;
  updatedAt: string;
  rates: CurrencyRateTable;
};

export async function fetchCurrencySnapshot(base: SupportedCurrency): Promise<CurrencySnapshotResponse> {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 180));

  const snapshot = RATE_SNAPSHOTS[base];
  if (!snapshot) {
    throw new Error(`Unsupported base currency: ${base}`);
  }

  return {
    base,
    updatedAt: snapshot.updatedAt,
    rates: snapshot.rates,
  };
}
