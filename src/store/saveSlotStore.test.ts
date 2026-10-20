import { beforeEach, describe, expect, it } from 'vitest';
import {
  findRelatedOlderSlotIndex,
  getTripSaveStatus,
  normalizePersistedSaveSlotState,
  useSaveSlotStore,
} from './saveSlotStore';
import { useToastStore } from './toastStore';
import { SAVE_SLOT_SCHEMA_VERSION, type SaveSlot, type TripSnapshot } from './types';

const baseSnapshot: TripSnapshot = {
  tripId: '111111',
  tripName: 'Trip One',
  globalMarkup: 66,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'USD',
};

describe('saveSlotStore', () => {
  beforeEach(() => {
    useSaveSlotStore.setState({ slots: [null, null, null], labels: ['Slot 1', 'Slot 2', 'Slot 3'] });
    useToastStore.getState().clearToasts();
  });

  it('saves to an empty slot and records metadata', () => {
    const ok = useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    const slot = useSaveSlotStore.getState().slots[0];

    expect(ok).toBe(true);
    expect(slot).not.toBeNull();
    expect(slot?.tripId).toBe('111111');
    expect(slot?.schemaVersion).toBe(SAVE_SLOT_SCHEMA_VERSION);
    expect(slot?.label).toBe('Slot 1');
  });

  it('loads a saved snapshot', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    const loaded = useSaveSlotStore.getState().loadFromSlot(0);
    expect(loaded).toEqual(baseSnapshot);
  });

  it('strips legacy theme from loaded and persisted save slots', () => {
    const legacySnapshot = { ...baseSnapshot, theme: 'dark' } as TripSnapshot;
    const normalized = normalizePersistedSaveSlotState({
      slots: [{
        tripId: legacySnapshot.tripId,
        tripName: legacySnapshot.tripName,
        data: legacySnapshot,
      } as never],
    });

    expect(normalized.slots[0]?.data).not.toHaveProperty('theme');
    expect(useSaveSlotStore.getState().saveToSlot(0, legacySnapshot)).toBe(true);
    expect(useSaveSlotStore.getState().slots[0]?.data).not.toHaveProperty('theme');
    expect(useSaveSlotStore.getState().loadFromSlot(0)).not.toHaveProperty('theme');
  });

  it('rewrites legacy slot themes out of localStorage during hydration', () => {
    const legacySnapshot = { ...baseSnapshot, theme: 'dark' };
    const persistedSlot = {
      slotIndex: 0,
      schemaVersion: SAVE_SLOT_SCHEMA_VERSION,
      label: 'Legacy label',
      tripId: legacySnapshot.tripId,
      tripName: legacySnapshot.tripName,
      savedAt: new Date().toISOString(),
      coupleCount: 0,
      costCount: 0,
      targetCurrency: legacySnapshot.targetCurrency,
      data: legacySnapshot,
    };
    localStorage.setItem('travel-toolkit-save-slots', JSON.stringify({
      state: { slots: [persistedSlot, null, null], labels: ['Legacy label', 'Slot 2', 'Slot 3'] },
      version: 1,
    }));

    useSaveSlotStore.persist.rehydrate();

    const stored = JSON.parse(localStorage.getItem('travel-toolkit-save-slots') ?? '{}');
    expect(stored.state.slots[0].label).toBe('Legacy label');
    expect(stored.state.slots[0].data).not.toHaveProperty('theme');
  });

  it('ignores legacy theme-only differences when comparing saved trips', () => {
    const legacySlot = {
      slotIndex: 0,
      schemaVersion: SAVE_SLOT_SCHEMA_VERSION,
      label: 'Slot 1',
      tripId: baseSnapshot.tripId,
      tripName: baseSnapshot.tripName,
      savedAt: new Date().toISOString(),
      coupleCount: 0,
      costCount: 0,
      targetCurrency: baseSnapshot.targetCurrency,
      data: { ...baseSnapshot, theme: 'dark' },
    } as SaveSlot;

    expect(findRelatedOlderSlotIndex([legacySlot, null, null], baseSnapshot)).toBe(-1);
  });

  it('rejects duplicate trip IDs across different slots', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    const ok = useSaveSlotStore.getState().saveToSlot(1, {
      ...baseSnapshot,
      tripName: 'Trip Duplicate',
    });

    expect(ok).toBe(false);
    expect(useSaveSlotStore.getState().slots[1]).toBeNull();
    const toasts = useToastStore.getState().toasts;
    expect(toasts[toasts.length - 1]?.title).toBe('Duplicate trip ID');
  });

  it('finds related older slot only when trip ID matches and snapshot differs', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    const slots = useSaveSlotStore.getState().slots;

    const identicalIndex = findRelatedOlderSlotIndex(slots, baseSnapshot);
    expect(identicalIndex).toBe(-1);

    const changedSnapshot = {
      ...baseSnapshot,
      tripName: 'Trip One Revised',
    };
    const relatedIndex = findRelatedOlderSlotIndex(slots, changedSnapshot);
    expect(relatedIndex).toBe(0);
  });

  it('reports saved when the active snapshot exactly matches a slot, even when dirty', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);

    expect(getTripSaveStatus(useSaveSlotStore.getState().slots, baseSnapshot, true)).toEqual({
      type: 'saved',
      slotIndex: 0,
    });
  });

  it('reports unsaved changes and the prior slot when the active snapshot differs', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    const changedSnapshot = { ...baseSnapshot, tripName: 'Trip One Revised' };

    expect(getTripSaveStatus(useSaveSlotStore.getState().slots, changedSnapshot, false)).toEqual({
      type: 'unsaved-changes',
      slotIndex: 0,
    });
  });

  it('reports when there is no saved slot and preserves dirty context', () => {
    const slots = useSaveSlotStore.getState().slots;

    expect(getTripSaveStatus(slots, baseSnapshot, false)).toEqual({
      type: 'not-saved',
      hasUnsavedChanges: false,
    });
    expect(getTripSaveStatus(slots, baseSnapshot, true)).toEqual({
      type: 'not-saved',
      hasUnsavedChanges: true,
    });
  });

  it('supports slot rename with trim and fallback', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    useSaveSlotStore.getState().renameSlot(0, '  Option A  ');
    expect(useSaveSlotStore.getState().slots[0]?.label).toBe('Option A');

    useSaveSlotStore.getState().renameSlot(0, '   ');
    expect(useSaveSlotStore.getState().slots[0]?.label).toBe('Slot 1');
  });

  it('renames an empty slot label', () => {
    useSaveSlotStore.getState().renameSlot(2, '  Final Draft  ');
    expect(useSaveSlotStore.getState().labels[2]).toBe('Final Draft');
  });

  it('swaps slot contents', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    useSaveSlotStore.getState().saveToSlot(1, {
      ...baseSnapshot,
      tripId: '222222',
      tripName: 'Trip Two',
    });

    useSaveSlotStore.getState().swapSlots(0, 1);

    expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe('222222');
    expect(useSaveSlotStore.getState().slots[1]?.tripId).toBe('111111');
  });

  it('clears a slot', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    useSaveSlotStore.getState().clearSlot(0);
    expect(useSaveSlotStore.getState().slots[0]).toBeNull();
  });

  it('normalizes persisted state missing labels and schemaVersion', () => {
    const normalized = normalizePersistedSaveSlotState({
      slots: [
        {
          slotIndex: 0,
          tripId: '111111',
          tripName: 'Legacy Trip',
          savedAt: new Date().toISOString(),
          coupleCount: 0,
          costCount: 0,
          targetCurrency: 'USD',
          data: baseSnapshot,
        } as never,
      ],
    });

    expect(normalized.labels).toEqual(['Slot 1', 'Slot 2', 'Slot 3']);
    expect(normalized.slots[0]?.schemaVersion).toBe(SAVE_SLOT_SCHEMA_VERSION);
    expect(normalized.slots[0]?.label).toBe('Slot 1');
  });

  it('drops invalid persisted slots during normalization', () => {
    const normalized = normalizePersistedSaveSlotState({
      labels: ['A', 'B', 'C'],
      slots: [{ tripId: '123456' } as never, null, null],
    });

    expect(normalized.slots[0]).toBeNull();
    expect(normalized.labels).toEqual(['A', 'B', 'C']);
  });
});
