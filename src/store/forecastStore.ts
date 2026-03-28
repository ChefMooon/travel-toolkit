import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DailyBreakdownView = 'table' | 'single-day';

interface ForecastStore {
  dailyBreakdownView: DailyBreakdownView;
  setDailyBreakdownView: (view: DailyBreakdownView) => void;
}

export const useForecastStore = create<ForecastStore>()(
  persist(
    (set) => ({
      dailyBreakdownView: 'table',
      setDailyBreakdownView: (dailyBreakdownView) => set({ dailyBreakdownView }),
    }),
    { name: 'mkt-forecast-data' },
  ),
);
