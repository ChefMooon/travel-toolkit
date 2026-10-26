import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Couple, NonPayingTraveller, CostEntry, ExchangeRate, Region, TripSnapshot } from './types';
import {
  MAX_GROUPS,
  MAX_KIDS_PER_GROUP,
  MAX_COST_ENTRIES,
  MAX_TRIP_NAME_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MAX_COST_NAME_LENGTH,
} from './types';
import { useToastStore } from './toastStore';
import { useSaveSlotStore } from './saveSlotStore';
import { migrateLegacyThemePreferenceBeforeTripCleanup } from './settingsStore';

function generateId(): string {
  return crypto.randomUUID();
}

function generateTripId(): string {
  return String(Math.floor(Math.random() * 900000) + 100000);
}

function hasDuplicateSavedTripId(tripId: string): boolean {
  return useSaveSlotStore.getState().slots.some((slot) => slot?.tripId === tripId);
}

// Capture the old trip-owned theme before persistence hydration strips it.
migrateLegacyThemePreferenceBeforeTripCleanup();

interface TripStore {
  tripId: string;
  tripName: string;
  globalMarkup: number;
  couples: Couple[];
  nonPayingTravellers: NonPayingTraveller[];
  costs: CostEntry[];
  exchangeRates: ExchangeRate[];
  region: Region;
  targetCurrency: string;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Actions
  setTripId: (tripId: string) => void;
  setTripName: (name: string) => void;
  setGlobalMarkup: (markup: number) => void;
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
  duplicateCost: (id: string) => void;
  editCost: (id: string, updates: Partial<Omit<CostEntry, 'id'>>) => void;
  deleteCost: (id: string) => void;
  deleteCosts: (costIds: string[]) => void;
  reorderCosts: (orderedIds: string[]) => void;
  bulkSetCurrency: (costIds: string[], currency: string) => void;

  // Exchange rate actions
  setExchangeRate: (currency: string, rate: number) => void;
  hydrateExchangeRates: (freshRates: Record<string, number>) => void;
  clearExchangeRateOverride: (currency: string) => void;

  // Snapshot and dirty state
  getSnapshot: () => TripSnapshot;
  loadSnapshot: (snapshot: TripSnapshot) => void;
  markClean: () => void;

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
  tripId: generateTripId(),
  tripName: 'My Trip',
  globalMarkup: 66,
  couples: [] as Couple[],
  nonPayingTravellers: [] as NonPayingTraveller[],
  costs: [] as CostEntry[],
  exchangeRates: [] as ExchangeRate[],
  region: 'Europe' as const,
  targetCurrency: 'USD',
  isDirty: false,
  canUndo: false,
  canRedo: false,
};

type HistorySnapshot = Pick<TripStore, 'tripId' | 'tripName' | 'globalMarkup' | 'couples' | 'nonPayingTravellers' | 'costs' | 'exchangeRates' | 'region' | 'targetCurrency'>;
const HISTORY_LIMIT = 100;
let past: HistorySnapshot[] = [];
let future: HistorySnapshot[] = [];
let baseline: HistorySnapshot | null = null;
let historyReady = false;
let applyingHistory = false;
let suppressHistory = false;
function snapshotOf(state: HistorySnapshot): HistorySnapshot {
  // Zustand actions replace arrays/objects instead of mutating them, so retaining
  // these references gives us cheap snapshots with structural sharing.
  return { tripId: state.tripId, tripName: state.tripName, globalMarkup: state.globalMarkup, couples: state.couples, nonPayingTravellers: state.nonPayingTravellers, costs: state.costs, exchangeRates: state.exchangeRates, region: state.region, targetCurrency: state.targetCurrency };
}
function sameOverrides(a: ExchangeRate[], b: ExchangeRate[]): boolean {
  const left = a.filter((rate) => rate.isOverridden);
  const right = b.filter((rate) => rate.isOverridden);
  return left.length === right.length && left.every((rate, index) => {
    const other = right[index];
    return !!other && rate.currency === other.currency && rate.rateToUSD === other.rateToUSD;
  });
}
function same(a: HistorySnapshot, b: HistorySnapshot): boolean {
  return a.tripId === b.tripId && a.tripName === b.tripName && a.globalMarkup === b.globalMarkup &&
    sameArray(a.couples, b.couples) && sameArray(a.nonPayingTravellers, b.nonPayingTravellers) && sameArray(a.costs, b.costs) &&
    (a.exchangeRates === b.exchangeRates || sameOverrides(a.exchangeRates, b.exchangeRates)) &&
    a.region === b.region && a.targetCurrency === b.targetCurrency;
}
function sameArray<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return item === other || JSON.stringify(item) === JSON.stringify(other);
  });
}
function restoreRates(current: ExchangeRate[], snapshot: ExchangeRate[]): ExchangeRate[] {
  const byCurrency = new Map<string, ExchangeRate>();
  for (const rate of snapshot) if (!rate.isOverridden) byCurrency.set(rate.currency, rate);
  for (const rate of current) if (!rate.isOverridden) byCurrency.set(rate.currency, rate);
  for (const rate of snapshot) if (rate.isOverridden) byCurrency.set(rate.currency, rate);
  return [...byCurrency.values()];
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      undo: () => {
        if (!past.length) return;
        const current = snapshotOf(get());
        const previous = past.pop()!;
        future.push(current);
        applyingHistory = true; set({ ...previous, exchangeRates: restoreRates(get().exchangeRates, previous.exchangeRates), canUndo: past.length > 0, canRedo: true, isDirty: !baseline || !same(previous, baseline) }); applyingHistory = false;
      },
      redo: () => {
        if (!future.length) return;
        const current = snapshotOf(get());
        const next = future.pop()!;
        past.push(current);
        applyingHistory = true; set({ ...next, exchangeRates: restoreRates(get().exchangeRates, next.exchangeRates), canUndo: true, canRedo: future.length > 0, isDirty: !baseline || !same(next, baseline) }); applyingHistory = false;
      },

      setTripId: (tripId) => {
        const normalized = tripId.trim();
        if (normalized === get().tripId) {
          return;
        }
        if (!/^\d{6}$/.test(normalized)) {
          useToastStore.getState().pushToast({
            type: 'warning',
            title: 'Trip ID must be 6 digits',
            message: 'Enter a numeric trip ID like 123456.',
          });
          return;
        }

        if (hasDuplicateSavedTripId(normalized)) {
          useToastStore.getState().pushToast({
            type: 'warning',
            title: 'Duplicate trip ID',
            message: `Trip ID ${normalized} already exists in a save slot.`,
          });
          return;
        }

        set({ tripId: normalized, isDirty: true });
      },

      setTripName: (name) => set({ tripName: name.slice(0, MAX_TRIP_NAME_LENGTH), isDirty: true }),
      setGlobalMarkup: (markup) => set({ globalMarkup: markup, isDirty: true }),
      setRegion: (region) => set({ region, isDirty: true }),
      setTargetCurrency: (currency) => set({ targetCurrency: currency, isDirty: true }),

      addCouple: (name) => {
        const id = generateId();
        if (get().couples.length >= MAX_GROUPS) {
          useToastStore.getState().pushToast({
            type: 'warning',
            title: 'Group limit reached',
            message: 'Trips are limited to 100 groups. Remove a group before adding another.',
          });
          return id;
        }
        set((state) => {
          const num = state.couples.length + 1;
          const newCouple: Couple = {
            id,
            name: name?.trim() ? name.trim().slice(0, MAX_GROUP_NAME_LENGTH) : `Group ${num}`,
            colorIndex: nextColorIndex(state.couples),
            iconIndex: 1,
            sortOrder: state.couples.length,
          };
          return { couples: [...state.couples, newCouple], isDirty: true };
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
          isDirty: true,
        })),

      renameCouple: (id, name) =>
        set((state) => ({
          couples: state.couples.map((c) => (c.id === id ? { ...c, name: name.slice(0, MAX_GROUP_NAME_LENGTH) } : c)),
          isDirty: true,
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
          return { couples: reordered, isDirty: true };
        }),

      updateCoupleIcon: (id, iconIndex) =>
        set((state) => ({
          couples: state.couples.map((c) => (c.id === id ? { ...c, iconIndex } : c)),
          isDirty: true,
        })),

      updateCoupleColor: (id, colorIndex) =>
        set((state) => ({
          couples: state.couples.map((c) => (c.id === id ? { ...c, colorIndex } : c)),
          isDirty: true,
        })),

      addNonPayingTraveller: (coupleId) => {
        const kidsForGroup = get().nonPayingTravellers.filter((t) => t.coupleId === coupleId).length;
        if (kidsForGroup >= MAX_KIDS_PER_GROUP) {
          useToastStore.getState().pushToast({
            type: 'warning',
            title: 'Child limit reached',
            message: 'Each group can have up to 50 children. Remove a child before adding another.',
          });
          return;
        }
        set((state) => {
          const num = state.nonPayingTravellers.length + 1;
          const traveller: NonPayingTraveller = {
            id: generateId(),
            label: `Child ${num}`,
            coupleId,
          };
          return { nonPayingTravellers: [...state.nonPayingTravellers, traveller], isDirty: true };
        });
      },

      removeNonPayingTraveller: (id) =>
        set((state) => ({
          nonPayingTravellers: state.nonPayingTravellers.filter((t) => t.id !== id),
          isDirty: true,
        })),

      addCost: (cost) => {
        if (get().costs.length >= MAX_COST_ENTRIES) {
          useToastStore.getState().pushToast({
            type: 'warning',
            title: 'Cost entry limit reached',
            message: 'Trips are limited to 1,000 cost entries. Remove an entry before adding another.',
          });
          return;
        }
        set((state) => {
          const newCost: CostEntry = {
            ...cost,
            name: cost.name.slice(0, MAX_COST_NAME_LENGTH),
            id: generateId(),
            sortOrder: state.costs.length,
          };
          return { costs: [...state.costs, newCost], isDirty: true };
        });
      },

      duplicateCost: (id) => {
        if (get().costs.length >= MAX_COST_ENTRIES) {
          useToastStore.getState().pushToast({
            type: 'warning',
            title: 'Cost entry limit reached',
            message: 'Trips are limited to 1,000 cost entries. Remove an entry before adding another.',
          });
          return;
        }
        set((state) => {
          const orderedCosts = [...state.costs].sort((a, b) => a.sortOrder - b.sortOrder);
          const sourceIndex = orderedCosts.findIndex((cost) => cost.id === id);
          if (sourceIndex === -1) {
            return state;
          }

          const source = orderedCosts[sourceIndex]!;
          const duplicate: CostEntry = {
            ...source,
            id: generateId(),
            assignedCoupleIds: [...source.assignedCoupleIds],
          };
          orderedCosts.splice(sourceIndex + 1, 0, duplicate);

          return {
            costs: orderedCosts.map((cost, sortOrder) => ({ ...cost, sortOrder })),
            isDirty: true,
          };
        });
      },

      editCost: (id, updates) =>
        set((state) => ({
          costs: state.costs.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...updates,
                  ...(updates.name !== undefined ? { name: updates.name.slice(0, MAX_COST_NAME_LENGTH) } : {}),
                }
              : c
          ),
          isDirty: true,
        })),

      deleteCost: (id) =>
        set((state) => ({
          costs: state.costs.filter((c) => c.id !== id),
          isDirty: true,
        })),

      deleteCosts: (costIds) => {
        if (costIds.length === 0) {
          return;
        }

        const costIdSet = new Set(costIds);
        set((state) => ({
          costs: state.costs.filter((c) => !costIdSet.has(c.id)),
          isDirty: true,
        }));
      },

      reorderCosts: (orderedIds) =>
        set((state) => {
          const costMap = new Map(state.costs.map((c) => [c.id, c]));
          const reordered = orderedIds
            .map((id, i) => {
              const cost = costMap.get(id);
              return cost ? { ...cost, sortOrder: i } : null;
            })
            .filter((c): c is CostEntry => c !== null);
          return { costs: reordered, isDirty: true };
        }),

      bulkSetCurrency: (costIds, currency) =>
        set((state) => ({
          costs: state.costs.map((c) =>
            costIds.includes(c.id) ? { ...c, currency } : c
          ),
          isDirty: true,
        })),

      setExchangeRate: (currency, rateToUSD) =>
        set((state) => {
          const existing = state.exchangeRates.find((r) => r.currency === currency);
          if (existing) {
            return {
              exchangeRates: state.exchangeRates.map((r) =>
                r.currency === currency ? { ...r, rateToUSD, isOverridden: true } : r
              ),
              isDirty: true,
            };
          }
          return {
            exchangeRates: [...state.exchangeRates, { currency, rateToUSD, isOverridden: true }],
            isDirty: true,
          };
        }),

      hydrateExchangeRates: (freshRates) => {
        suppressHistory = true;
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
        });
        suppressHistory = false;
      },

      clearExchangeRateOverride: (currency) =>
        set((state) => ({
          exchangeRates: state.exchangeRates.map((r) =>
            r.currency === currency ? { ...r, isOverridden: false } : r
          ),
          isDirty: true,
        })),

      getSnapshot: () => {
        const state = get();
        return {
          tripId: state.tripId,
          tripName: state.tripName,
          globalMarkup: state.globalMarkup,
          couples: state.couples,
          nonPayingTravellers: state.nonPayingTravellers,
          costs: state.costs,
          exchangeRates: state.exchangeRates,
          region: state.region,
          targetCurrency: state.targetCurrency,
        };
      },

      loadSnapshot: (snapshot) => {
        const sanitizedSnapshot = { ...snapshot } as TripSnapshot & { theme?: unknown };
        delete sanitizedSnapshot.theme;
        past = []; future = [];
        suppressHistory = true;
        set({
          ...sanitizedSnapshot,
          isDirty: false,
        });
        suppressHistory = false;
        past = []; future = []; baseline = snapshotOf(sanitizedSnapshot); historyReady = true;
        set({ canUndo: false, canRedo: false });
      },

      markClean: () => { baseline = snapshotOf(get()); historyReady = true; set({ isDirty: false }); },

      resetTrip: () => {
        past = []; future = []; baseline = null; historyReady = true; suppressHistory = true;
        set({
          ...initialState,
          tripId: generateTripId(),
          isDirty: false,
          canUndo: false, canRedo: false,
        });
        baseline = snapshotOf(get());
        suppressHistory = false;
      },
    }),
    {
      name: 'travel-toolkit-trip-data',
      merge: (persistedState, currentState) => {
        const persisted = persistedState && typeof persistedState === 'object'
          ? { ...persistedState as Record<string, unknown> }
          : {};
        const hadLegacyTheme = Object.prototype.hasOwnProperty.call(persisted, 'theme');
        delete persisted.theme;
        return {
          ...currentState,
          ...persisted,
          ...(hadLegacyTheme ? { isDirty: false } : {}),
        } as TripStore;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Unable to hydrate trip data.', error);
          return;
        }
        state?.markClean();
      },
      partialize: (state) => ({
        tripId: state.tripId,
        tripName: state.tripName,
        globalMarkup: state.globalMarkup,
        couples: state.couples,
        nonPayingTravellers: state.nonPayingTravellers,
        costs: state.costs,
        exchangeRates: state.exchangeRates,
        region: state.region,
        targetCurrency: state.targetCurrency,
      }),
    }
  )
);

useTripStore.subscribe((state, previous) => {
  if (applyingHistory || suppressHistory) return;
  if (!historyReady) { baseline ??= snapshotOf(previous); historyReady = true; }
  const didChange = !same(snapshotOf(state), snapshotOf(previous));
  if (didChange && state !== previous) {
    past.push(snapshotOf(previous));
    if (past.length > HISTORY_LIMIT) past.shift();
    future = [];
    baseline ??= snapshotOf(previous);
  }
  const expectedDirty = !baseline || !same(snapshotOf(state), baseline);
  if ((didChange && (!state.canUndo || state.canRedo)) || state.isDirty !== expectedDirty) {
    useTripStore.setState({ ...(didChange ? { canUndo: past.length > 0, canRedo: false } : {}), isDirty: expectedDirty });
  }
});
