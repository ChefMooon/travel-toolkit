import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Couple, NonPayingTraveller, CostEntry, ExchangeRate, Region } from './types';

function generateId(): string {
  return crypto.randomUUID();
}

interface TripStore {
  tripName: string;
  globalMarkup: number;
  couples: Couple[];
  nonPayingTravellers: NonPayingTraveller[];
  costs: CostEntry[];
  exchangeRates: ExchangeRate[];
  theme: 'light' | 'dark';
  region: Region;
  targetCurrency: string;

  // Actions
  setTripName: (name: string) => void;
  setGlobalMarkup: (markup: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setRegion: (region: Region) => void;
  setTargetCurrency: (currency: string) => void;

  // Couple actions
  addCouple: (name?: string) => string;
  removeCouple: (id: string) => void;
  renameCouple: (id: string, name: string) => void;
  reorderCouples: (orderedIds: string[]) => void;
  updateCoupleIcon: (id: string, iconIndex: number) => void;
  updateCoupleColor: (id: string, colorIndex: number) => void;

  // Non-paying traveller actions
  addNonPayingTraveller: (coupleId: string) => void;
  removeNonPayingTraveller: (id: string) => void;

  // Cost actions
  addCost: (cost: Omit<CostEntry, 'id' | 'sortOrder'>) => void;
  editCost: (id: string, updates: Partial<Omit<CostEntry, 'id'>>) => void;
  deleteCost: (id: string) => void;
  reorderCosts: (orderedIds: string[]) => void;
  bulkSetCurrency: (costIds: string[], currency: string) => void;

  // Exchange rate actions
  setExchangeRate: (currency: string, rate: number) => void;
  hydrateExchangeRates: (freshRates: Record<string, number>) => void;
  clearExchangeRateOverride: (currency: string) => void;

  // Reset
  resetTrip: () => void;
}

const nextColorIndex = (couples: Couple[]): number => {
  const used = new Set(couples.map(c => c.colorIndex));
  for (let i = 1; i <= 5; i++) {
    if (!used.has(i)) return i;
  }
  return ((couples.length) % 5) + 1;
};

const initialState = {
  tripName: 'My Trip',
  globalMarkup: 66,
  couples: [] as Couple[],
  nonPayingTravellers: [] as NonPayingTraveller[],
  costs: [] as CostEntry[],
  exchangeRates: [] as ExchangeRate[],
  theme: 'light' as const,
  region: 'Europe' as const,
  targetCurrency: 'USD',
};

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      ...initialState,

      setTripName: (name) => set({ tripName: name }),
      setGlobalMarkup: (markup) => set({ globalMarkup: markup }),
      setTheme: (theme) => {
        document.documentElement.dataset['theme'] = theme;
        set({ theme });
      },
      setRegion: (region) => set({ region }),
      setTargetCurrency: (currency) => set({ targetCurrency: currency }),

      addCouple: (name) => {
        const id = generateId();
        set((state) => {
          const num = state.couples.length + 1;
          const newCouple: Couple = {
            id,
            name: name?.trim() ? name.trim() : `Group ${num}`,
            colorIndex: nextColorIndex(state.couples),
            iconIndex: 1,
            sortOrder: state.couples.length,
          };
          return { couples: [...state.couples, newCouple] };
        });
        return id;
      },

      removeCouple: (id) =>
        set((state) => ({
          couples: state.couples.filter((c) => c.id !== id),
          nonPayingTravellers: state.nonPayingTravellers.filter((t) => t.coupleId !== id),
          costs: state.costs.map((cost) => {
            if (cost.splitType === 'individual' && cost.assignedCoupleIds.includes(id)) {
              return { ...cost, assignedCoupleIds: [] };
            }
            if (cost.splitType === 'subset') {
              return {
                ...cost,
                assignedCoupleIds: cost.assignedCoupleIds.filter((cid) => cid !== id),
              };
            }
            return cost;
          }),
        })),

      renameCouple: (id, name) =>
        set((state) => ({
          couples: state.couples.map((c) => (c.id === id ? { ...c, name } : c)),
        })),

      reorderCouples: (orderedIds) =>
        set((state) => {
          const coupleMap = new Map(state.couples.map((c) => [c.id, c]));
          const reordered = orderedIds
            .map((id, i) => {
              const couple = coupleMap.get(id);
              return couple ? { ...couple, sortOrder: i } : null;
            })
            .filter((c): c is Couple => c !== null);
          return { couples: reordered };
        }),

      updateCoupleIcon: (id, iconIndex) =>
        set((state) => ({
          couples: state.couples.map((c) => (c.id === id ? { ...c, iconIndex } : c)),
        })),

      updateCoupleColor: (id, colorIndex) =>
        set((state) => ({
          couples: state.couples.map((c) => (c.id === id ? { ...c, colorIndex } : c)),
        })),

      addNonPayingTraveller: (coupleId) =>
        set((state) => {
          const num = state.nonPayingTravellers.length + 1;
          const traveller: NonPayingTraveller = {
            id: generateId(),
            label: `Child ${num}`,
            coupleId,
          };
          return { nonPayingTravellers: [...state.nonPayingTravellers, traveller] };
        }),

      removeNonPayingTraveller: (id) =>
        set((state) => ({
          nonPayingTravellers: state.nonPayingTravellers.filter((t) => t.id !== id),
        })),

      addCost: (cost) =>
        set((state) => {
          const newCost: CostEntry = {
            ...cost,
            id: generateId(),
            sortOrder: state.costs.length,
          };
          return { costs: [...state.costs, newCost] };
        }),

      editCost: (id, updates) =>
        set((state) => ({
          costs: state.costs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCost: (id) =>
        set((state) => ({
          costs: state.costs.filter((c) => c.id !== id),
        })),

      reorderCosts: (orderedIds) =>
        set((state) => {
          const costMap = new Map(state.costs.map((c) => [c.id, c]));
          const reordered = orderedIds
            .map((id, i) => {
              const cost = costMap.get(id);
              return cost ? { ...cost, sortOrder: i } : null;
            })
            .filter((c): c is CostEntry => c !== null);
          return { costs: reordered };
        }),

      bulkSetCurrency: (costIds, currency) =>
        set((state) => ({
          costs: state.costs.map((c) =>
            costIds.includes(c.id) ? { ...c, currency } : c
          ),
        })),

      setExchangeRate: (currency, rateToUSD) =>
        set((state) => {
          const existing = state.exchangeRates.find((r) => r.currency === currency);
          if (existing) {
            return {
              exchangeRates: state.exchangeRates.map((r) =>
                r.currency === currency ? { ...r, rateToUSD, isOverridden: true } : r
              ),
            };
          }
          return {
            exchangeRates: [...state.exchangeRates, { currency, rateToUSD, isOverridden: true }],
          };
        }),

      hydrateExchangeRates: (freshRates) =>
        set((state) => {
          const newRates = [...state.exchangeRates];
          for (const [currency, rate] of Object.entries(freshRates)) {
            if (currency === 'USD') continue;
            const existingIdx = newRates.findIndex((r) => r.currency === currency);
            if (existingIdx >= 0) {
              const entry = newRates[existingIdx]!;
              if (!entry.isOverridden) {
                newRates[existingIdx] = { ...entry, rateToUSD: 1 / rate };
              }
            } else {
              newRates.push({ currency, rateToUSD: 1 / rate, isOverridden: false });
            }
          }
          return { exchangeRates: newRates };
        }),

      clearExchangeRateOverride: (currency) =>
        set((state) => ({
          exchangeRates: state.exchangeRates.map((r) =>
            r.currency === currency ? { ...r, isOverridden: false } : r
          ),
        })),

      resetTrip: () =>
        set({
          ...initialState,
          theme: document.documentElement.dataset['theme'] as 'light' | 'dark' ?? 'light',
        }),
    }),
    {
      name: 'mkt-trip-data',
    }
  )
);
