import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Region } from './types';

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
      region: 'Europe',
      amount: '100',
      baseCurrency: 'EUR',
      targetCurrency: 'USD',
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
