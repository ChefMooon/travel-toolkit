import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MAX_SAVE_SLOTS,
  MAX_SLOT_LABEL_LENGTH,
  SAVE_SLOT_SCHEMA_VERSION,
  getDefaultSlotLabel,
  type SaveSlot,
  type TripSnapshot,
} from './types';
import { useToastStore } from './toastStore';
import { isValidDateOnly } from '@/components/DatePicker/dateUtils';

interface SaveSlotStore {
  slots: Array<SaveSlot | null>;
  labels: string[];
  saveToSlot: (slotIndex: number, tripSnapshot: TripSnapshot) => boolean;
  loadFromSlot: (slotIndex: number) => TripSnapshot | null;
  clearSlot: (slotIndex: number) => void;
  swapSlots: (firstSlotIndex: number, secondSlotIndex: number) => void;
  renameSlot: (slotIndex: number, label: string) => void;
}

type PersistedSaveSlotStore = Partial<Pick<SaveSlotStore, 'slots' | 'labels'>>;

const DEFAULT_LABELS = Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => getDefaultSlotLabel(index));

function createDefaultState(): Pick<SaveSlotStore, 'slots' | 'labels'> {
  return {
    slots: Array.from({ length: MAX_SAVE_SLOTS }, () => null),
    labels: [...DEFAULT_LABELS],
  };
}

function isValidSlotIndex(slotIndex: number): boolean {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < MAX_SAVE_SLOTS;
}

function ensureSlotArrayLength(slots: Array<SaveSlot | null>): Array<SaveSlot | null> {
  return Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => slots[index] ?? null);
}

function ensureLabelArrayLength(labels: string[]): string[] {
  return Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => {
    const label = labels[index]?.trim();
    return (label || getDefaultSlotLabel(index)).slice(0, MAX_SLOT_LABEL_LENGTH);
  });
}

function sanitizeSnapshot(snapshot: TripSnapshot): TripSnapshot {
  const sanitized = { ...snapshot } as TripSnapshot & { theme?: unknown };
  delete sanitized.theme;
  const valid = (value: unknown): value is string => {
    return typeof value === 'string' && isValidDateOnly(value);
  };
  const start = valid(sanitized.tripStartDate) ? sanitized.tripStartDate : '';
  const end = valid(sanitized.tripEndDate) ? sanitized.tripEndDate : '';
  sanitized.tripStartDate = end && (!start || end < start) ? '' : start;
  sanitized.tripEndDate = end && (!start || end < start) ? '' : end;
  return sanitized;
}

function snapshotsEqual(a: TripSnapshot, b: TripSnapshot): boolean {
  return JSON.stringify(sanitizeSnapshot(a)) === JSON.stringify(sanitizeSnapshot(b));
}

export function findRelatedOlderSlotIndex(
  slots: Array<SaveSlot | null>,
  tripSnapshot: TripSnapshot
): number {
  return ensureSlotArrayLength(slots).findIndex(
    (slot) => slot?.tripId === tripSnapshot.tripId && !snapshotsEqual(slot.data, tripSnapshot)
  );
}

export type TripSaveStatus =
  | { type: 'saved'; slotIndex: number }
  | { type: 'unsaved-changes'; slotIndex: number }
  | { type: 'not-saved'; hasUnsavedChanges: boolean };

export function getTripSaveStatus(
  slots: Array<SaveSlot | null>,
  tripSnapshot: TripSnapshot,
  isDirty: boolean
): TripSaveStatus {
  const relatedSlotIndex = findRelatedOlderSlotIndex(slots, tripSnapshot);
  if (relatedSlotIndex >= 0) {
    return { type: 'unsaved-changes', slotIndex: relatedSlotIndex };
  }

  const currentSlotIndex = ensureSlotArrayLength(slots).findIndex(
    (slot) => slot?.tripId === tripSnapshot.tripId
  );
  if (currentSlotIndex >= 0) {
    return { type: 'saved', slotIndex: currentSlotIndex };
  }

  return { type: 'not-saved', hasUnsavedChanges: isDirty };
}

function normalizePersistedSlot(
  rawSlot: unknown,
  slotIndex: number,
  labels: string[]
): SaveSlot | null {
  if (!rawSlot || typeof rawSlot !== 'object') {
    return null;
  }

  const slot = rawSlot as Partial<SaveSlot>;
  const data = slot.data;

  if (!data) {
    return null;
  }

  const snapshot = sanitizeSnapshot(data as TripSnapshot);
  const hasRequiredSnapshot =
    typeof snapshot.tripId === 'string' &&
    typeof snapshot.tripName === 'string' &&
    typeof snapshot.targetCurrency === 'string' &&
    typeof snapshot.region === 'string' &&
    Array.isArray(snapshot.couples) &&
    Array.isArray(snapshot.nonPayingTravellers) &&
    Array.isArray(snapshot.costs) &&
    Array.isArray(snapshot.exchangeRates) &&
    typeof snapshot.globalMarkup === 'number';

  if (!hasRequiredSnapshot) {
    return null;
  }

  return {
    slotIndex,
    schemaVersion:
      typeof slot.schemaVersion === 'number' ? slot.schemaVersion : SAVE_SLOT_SCHEMA_VERSION,
    label: (typeof slot.label === 'string' ? slot.label : labels[slotIndex] ?? getDefaultSlotLabel(slotIndex)).slice(
      0,
      MAX_SLOT_LABEL_LENGTH
    ),
    tripId: typeof slot.tripId === 'string' ? slot.tripId : snapshot.tripId,
    tripName: typeof slot.tripName === 'string' ? slot.tripName : snapshot.tripName,
    savedAt: typeof slot.savedAt === 'string' ? slot.savedAt : new Date().toISOString(),
    coupleCount:
      typeof slot.coupleCount === 'number' ? slot.coupleCount : snapshot.couples.length,
    costCount: typeof slot.costCount === 'number' ? slot.costCount : snapshot.costs.length,
    targetCurrency:
      typeof slot.targetCurrency === 'string' ? slot.targetCurrency : snapshot.targetCurrency,
    data: snapshot,
  };
}

export function normalizePersistedSaveSlotState(
  persisted: PersistedSaveSlotStore | undefined
): Pick<SaveSlotStore, 'slots' | 'labels'> {
  const base = createDefaultState();
  if (!persisted) {
    return base;
  }

  const labels = ensureLabelArrayLength(Array.isArray(persisted.labels) ? persisted.labels : base.labels);
  const rawSlots = Array.isArray(persisted.slots) ? persisted.slots : base.slots;
  const slots = Array.from({ length: MAX_SAVE_SLOTS }, (_, index) =>
    normalizePersistedSlot(rawSlots[index], index, labels)
  );

  return {
    slots,
    labels,
  };
}

function migrateSlot(slot: SaveSlot): SaveSlot | null {
  if (slot.schemaVersion === SAVE_SLOT_SCHEMA_VERSION) {
    return { ...slot, data: sanitizeSnapshot(slot.data) };
  }

  return null;
}

function findDuplicateTripId(
  slots: Array<SaveSlot | null>,
  tripId: string,
  targetSlotIndex: number
): number {
  return slots.findIndex((slot, index) => index !== targetSlotIndex && slot?.tripId === tripId);
}

let persistNormalizedSlots: (() => void) | undefined;

export const useSaveSlotStore = create<SaveSlotStore>()(
  persist(
    (set, get) => {
      persistNormalizedSlots = () => {
        set((state) => normalizePersistedSaveSlotState(state));
      };

      return {
        ...createDefaultState(),

      saveToSlot: (slotIndex, tripSnapshot) => {
        if (!isValidSlotIndex(slotIndex)) {
          return false;
        }

        const snapshot = sanitizeSnapshot(tripSnapshot);
        const slots = ensureSlotArrayLength(get().slots);
        const labels = ensureLabelArrayLength(get().labels);
        const duplicateIndex = findDuplicateTripId(slots, snapshot.tripId, slotIndex);
        if (duplicateIndex >= 0) {
          useToastStore.getState().pushToast({
            type: 'warning',
            title: 'Duplicate trip ID',
            message: `Trip ID ${snapshot.tripId} is already saved in ${labels[duplicateIndex] ?? getDefaultSlotLabel(duplicateIndex)}.`,
          });
          return false;
        }

        const nextLabel = labels[slotIndex] ?? getDefaultSlotLabel(slotIndex);

        const slot: SaveSlot = {
          slotIndex,
          schemaVersion: SAVE_SLOT_SCHEMA_VERSION,
          label: nextLabel,
          tripId: snapshot.tripId,
          tripName: snapshot.tripName,
          savedAt: new Date().toISOString(),
          coupleCount: snapshot.couples.length,
          costCount: snapshot.costs.length,
          targetCurrency: snapshot.targetCurrency,
          data: snapshot,
        };

        set((state) => {
          const nextSlots = ensureSlotArrayLength(state.slots);
          const nextLabels = ensureLabelArrayLength(state.labels);
          nextSlots[slotIndex] = slot;
          return { slots: nextSlots, labels: nextLabels };
        });

        return true;
      },

      loadFromSlot: (slotIndex) => {
        if (!isValidSlotIndex(slotIndex)) {
          return null;
        }

        const slots = ensureSlotArrayLength(get().slots);
        const slot = slots[slotIndex];
        if (!slot) {
          return null;
        }

        const migrated = migrateSlot(slot);
        if (!migrated) {
          useToastStore.getState().pushToast({
            type: 'error',
            title: 'Unsupported save format',
            message: 'This slot uses an older format and cannot be loaded yet.',
          });
          return null;
        }

        return migrated.data;
      },

      clearSlot: (slotIndex) => {
        if (!isValidSlotIndex(slotIndex)) {
          return;
        }

        set((state) => {
          const nextSlots = ensureSlotArrayLength(state.slots);
          const nextLabels = ensureLabelArrayLength(state.labels);
          nextSlots[slotIndex] = null;
          return { slots: nextSlots, labels: nextLabels };
        });
      },

      swapSlots: (firstSlotIndex, secondSlotIndex) => {
        if (!isValidSlotIndex(firstSlotIndex) || !isValidSlotIndex(secondSlotIndex)) {
          return;
        }

        if (firstSlotIndex === secondSlotIndex) {
          return;
        }

        set((state) => {
          const nextSlots = ensureSlotArrayLength(state.slots);
          const labels = ensureLabelArrayLength(state.labels);
          const first = nextSlots[firstSlotIndex] ? { ...nextSlots[firstSlotIndex]!, slotIndex: secondSlotIndex } : null;
          const second = nextSlots[secondSlotIndex] ? { ...nextSlots[secondSlotIndex]!, slotIndex: firstSlotIndex } : null;

          if (first) {
            first.label = labels[secondSlotIndex] ?? getDefaultSlotLabel(secondSlotIndex);
          }
          if (second) {
            second.label = labels[firstSlotIndex] ?? getDefaultSlotLabel(firstSlotIndex);
          }

          nextSlots[firstSlotIndex] = second;
          nextSlots[secondSlotIndex] = first;
          return { slots: nextSlots, labels };
        });
      },

      renameSlot: (slotIndex, label) => {
        if (!isValidSlotIndex(slotIndex)) {
          return;
        }

        const trimmed = label.trim();
        const normalized = (trimmed || getDefaultSlotLabel(slotIndex)).slice(0, MAX_SLOT_LABEL_LENGTH);

        set((state) => {
          const nextSlots = ensureSlotArrayLength(state.slots);
          const labels = ensureLabelArrayLength(state.labels);
          labels[slotIndex] = normalized;
          const existing = nextSlots[slotIndex];
          if (existing) {
            nextSlots[slotIndex] = { ...existing, label: normalized };
          }
          return { slots: nextSlots, labels };
        });
      },
      };
    },
    {
      name: 'travel-toolkit-save-slots',
      version: 1,
      migrate: (persistedState) => normalizePersistedSaveSlotState(persistedState as PersistedSaveSlotStore),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...normalizePersistedSaveSlotState(persistedState as PersistedSaveSlotStore),
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Unable to hydrate save slots.', error);
          return;
        }
        persistNormalizedSlots?.();
      },
    }
  )
);
