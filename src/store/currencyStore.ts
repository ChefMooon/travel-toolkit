import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Region } from './types';

interface CurrencyStore {
  region: Region;
  setRegion: (region: Region) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      region: 'Europe',
      setRegion: (region) => set({ region }),
    }),
    {
      name: 'mkt-currency-data',
    },
  ),
);
