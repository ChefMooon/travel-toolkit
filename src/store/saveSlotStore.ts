import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MAX_SAVE_SLOTS,
  MAX_SLOT_LABEL_LENGTH,
  MAX_TRIP_NAME_LENGTH,
  SAVE_SLOT_SCHEMA_VERSION,
  getDefaultSlotLabel,
  type SaveSlot,
  type TripSnapshot,
} from './types';
import { useToastStore } from './toastStore';
import { generateUniqueTripId } from './tripId';
import { isValidDateOnly } from '@/components/DatePicker/dateUtils';
import i18n from '@/i18n';

interface SaveSlotStore {
  slots: Array<SaveSlot | null>;
  labels: string[];
  saveToSlot: (slotIndex: number, tripSnapshot: TripSnapshot) => boolean;
  loadFromSlot: (slotIndex: number) => TripSnapshot | null;
  clearSlot: (slotIndex: number) => void;
  swapSlots: (firstSlotIndex: number, secondSlotIndex: number) => void;
  renameSlot: (slotIndex: number, label: string) => void;
  renameSlotTrip: (slotIndex: number, name: string) => boolean;
  saveCopyToSlot: (slotIndex: number, sourceSnapshot: TripSnapshot, takenIds: string[]) => SaveCopyResult;
}

export type SaveCopyResult = { ok: true; tripId: string } | { ok: false };

// Slots are addressed by position for now. A future schema v2 would add a stable slot id and
// `location: 'local' | 'cloud'`, plus a locked state for paid slots; capacity should then come
// from the account rather than MAX_SAVE_SLOTS.

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

// Lets the UI check for a duplicate trip ID before writing, instead of relying on the toast.
export function findSlotIndexByTripId(
  slots: Array<SaveSlot | null>,
  tripId: string,
  excludeIndex?: number
): number {
  return slots.findIndex((slot, index) => index !== excludeIndex && slot?.tripId === tripId);
}

// Same UTF-16 limit as the inputs' maxLength, but never ends on half of a surrogate pair (e.g. an emoji).
function truncateName(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  return /[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut;
}

function getCopyName(name: string): string {
  const source = name.trim() || i18n.t('untitledTrip');
  const suffixLength = i18n.t('tripCopyName', { name: '' }).length;
  const base = truncateName(source, Math.max(0, MAX_TRIP_NAME_LENGTH - suffixLength)).trimEnd();
  return truncateName(i18n.t('tripCopyName', { name: base }).trim(), MAX_TRIP_NAME_LENGTH);
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
            title: i18n.t('duplicateTripIdTitle'),
            message: i18n.t('duplicateTripIdSlotMessage', { id: snapshot.tripId, slot: labels[duplicateIndex] ?? getDefaultSlotLabel(duplicateIndex) }),
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
            title: i18n.t('unsupportedSaveTitle'),
            message: i18n.t('unsupportedSaveMessage'),
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

      renameSlotTrip: (slotIndex, name) => {
        if (!isValidSlotIndex(slotIndex)) {
          return false;
        }

        const normalized = truncateName(name.trim(), MAX_TRIP_NAME_LENGTH);
        const existing = ensureSlotArrayLength(get().slots)[slotIndex];
        if (!normalized || !existing) {
          return false;
        }

        set((state) => {
          const nextSlots = ensureSlotArrayLength(state.slots);
          nextSlots[slotIndex] = {
            ...existing,
            tripName: normalized,
            data: { ...existing.data, tripName: normalized },
          };
          return { slots: nextSlots };
        });
        return true;
      },

      saveCopyToSlot: (slotIndex, sourceSnapshot, takenIds) => {
        if (!isValidSlotIndex(slotIndex)) {
          return { ok: false };
        }

        // The copy is a separate trip with a new ID. Couple/cost UUIDs are kept on purpose: the
        // snapshot is self-contained, and keeping them leaves assignedCoupleIds references valid.
        let copy: TripSnapshot;
        const slotTripIds = get().slots.flatMap((slot) => (slot ? [slot.tripId] : []));
        try {
          // Inside the try: structuredClone throws a DataCloneError on uncloneable input.
          copy = structuredClone(sourceSnapshot);
          copy.tripId = generateUniqueTripId([...slotTripIds, sourceSnapshot.tripId, ...takenIds]);
        } catch {
          return { ok: false };
        }
        copy.tripName = getCopyName(sourceSnapshot.tripName);

        return get().saveToSlot(slotIndex, copy) ? { ok: true, tripId: copy.tripId } : { ok: false };
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
