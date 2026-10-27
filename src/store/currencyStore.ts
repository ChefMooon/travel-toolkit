import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAvailableCurrencies, REGION_LIST, type Region } from './types';
import { useSettingsStore } from './settingsStore';

function getInitialConverterSettings() {
  const baseCurrency = useSettingsStore.getState().preferredCurrency;
  const region = REGION_LIST.find((candidate) => getAvailableCurrencies(candidate).includes(baseCurrency)) ?? 'Europe';
  const targetCurrency = getAvailableCurrencies(region).find((currency) => currency !== baseCurrency) ?? 'USD';
  return { region, baseCurrency, targetCurrency };
}

interface CurrencyStore {
  region: Region;
  amount: string;
  baseCurrency: string;
  targetCurrency: string;
  setRegion: (region: Region) => void;
  setAmount: (amount: string) => void;
  setBaseCurrency: (currency: string) => void;
  setTargetCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      ...getInitialConverterSettings(),
      amount: '100',
      setRegion: (region) => set({ region }),
      setAmount: (amount) => set({ amount }),
      setBaseCurrency: (baseCurrency) => set({ baseCurrency }),
      setTargetCurrency: (targetCurrency) => set({ targetCurrency }),
    }),
    {
      name: 'travel-toolkit-currency-data',
    },
  ),
);
