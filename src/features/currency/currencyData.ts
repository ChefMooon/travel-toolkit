import { CURRENCIES } from '@/store/types';

export const SUPPORTED_CURRENCIES = [...CURRENCIES] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type CurrencyMeta = {
  name: string;
  symbol: string;
};

export type CurrencyProvider = {
  key: string;
  name: string;
  url: string;
  currencies: string[];
};

type FrankfurterCurrencyItem = {
  iso_code: string;
  name: string;
  symbol: string;
};

type FrankfurterRateItem = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

type FrankfurterProviderItem = {
  key: string;
  name: string;
  data_url: string;
  currencies: string[];
};

export type CurrencySnapshotResponse = {
  base: string;
  updatedAt: string;
  fetchedAt: string;
  rates: Record<string, number>;
};

export async function fetchCurrencyMetadata(): Promise<Record<string, CurrencyMeta>> {
  const res = await fetch('https://api.frankfurter.dev/v2/currencies');
  if (!res.ok) {
    throw new Error(`Frankfurter API error: ${res.status} ${res.statusText}`);
  }
  const data: FrankfurterCurrencyItem[] = await res.json();
  const result: Record<string, CurrencyMeta> = {};
  for (const item of data) {
    result[item.iso_code] = { name: item.name, symbol: item.symbol };
  }
  return result;
}

export async function fetchCurrencyProviders(): Promise<CurrencyProvider[]> {
  const res = await fetch('https://api.frankfurter.dev/v2/providers');
  if (!res.ok) {
    throw new Error(`Frankfurter API error: ${res.status} ${res.statusText}`);
  }
  const data: FrankfurterProviderItem[] = await res.json();
  return data.map((item) => ({
    key: item.key,
    name: item.name,
    url: item.data_url,
    currencies: item.currencies,
  }));
}

export async function fetchCurrencySnapshot(
  base: string,
  quotes: string[],
): Promise<CurrencySnapshotResponse> {
  if (!SUPPORTED_CURRENCIES.includes(base as SupportedCurrency)) {
    throw new Error(`Unsupported base currency: ${base}`);
  }
  const quotesParam = quotes.join(',');
  const res = await fetch(
    `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quotesParam}`,
  );
  if (!res.ok) {
    throw new Error(`Frankfurter API error: ${res.status} ${res.statusText}`);
  }
  const data: FrankfurterRateItem[] = await res.json();
  const rates: Record<string, number> = { [base]: 1 };
  for (const item of data) {
    rates[item.quote] = item.rate;
  }
  return {
    base,
    updatedAt: data[0]?.date ?? '',
    fetchedAt: new Date().toISOString(),
    rates,
  };
}
