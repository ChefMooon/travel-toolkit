import { beforeEach, describe, expect, it } from 'vitest';
import { useSaveSlotStore } from './saveSlotStore';
import { recordSlotUndo, undoSlotChange } from './slotUndo';
import { useToastStore } from './toastStore';
import type { TripSnapshot } from './types';

const tripA: TripSnapshot = {
  tripId: '111111',
  tripName: 'Trip A',
  globalMarkup: 66,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'USD',
};
const tripB: TripSnapshot = { ...tripA, tripId: '222222', tripName: 'Trip B' };

describe('slotUndo', () => {
  beforeEach(() => {
    useSaveSlotStore.setState({ slots: [null, null, null], labels: ['Home', 'Work', 'Spare'] });
    useToastStore.getState().clearToasts();
  });

  it('restores a slot after an overwrite', () => {
    const store = useSaveSlotStore.getState();
    store.saveToSlot(0, tripA);
    const before = useSaveSlotStore.getState().slots[0];

    const handle = recordSlotUndo(() => store.saveToSlot(0, { ...tripA, tripName: 'Edited' }));
    expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Edited');

    expect(handle).not.toBeNull();
    expect(undoSlotChange(handle!)).toBe(true);
    expect(useSaveSlotStore.getState().slots[0]).toBe(before);
  });

  it('restores slots and labels after a swap', () => {
    const store = useSaveSlotStore.getState();
    store.saveToSlot(0, tripA);
    store.saveToSlot(1, tripB);
    const { slots: beforeSlots, labels: beforeLabels } = useSaveSlotStore.getState();

    const handle = recordSlotUndo(() => {
      store.swapSlots(0, 1);
      return true;
    });
    expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe('222222');
    expect(useSaveSlotStore.getState().slots[0]?.label).toBe('Home');

    expect(undoSlotChange(handle!)).toBe(true);
    const after = useSaveSlotStore.getState();
    expect(after.slots).toBe(beforeSlots);
    expect(after.labels).toBe(beforeLabels);
    expect(after.slots[0]?.tripId).toBe('111111');
    expect(after.slots[0]?.label).toBe('Home');
    expect(after.slots[0]?.slotIndex).toBe(0);
    expect(after.slots[1]?.label).toBe('Work');
  });

  it('restores a move into an empty slot', () => {
    const store = useSaveSlotStore.getState();
    store.saveToSlot(0, tripA);

    const handle = recordSlotUndo(() => {
      store.swapSlots(0, 2);
      return true;
    });
    expect(useSaveSlotStore.getState().slots[0]).toBeNull();
    expect(useSaveSlotStore.getState().slots[2]?.label).toBe('Spare');

    expect(undoSlotChange(handle!)).toBe(true);
    const { slots, labels } = useSaveSlotStore.getState();
    expect(slots[0]?.tripId).toBe('111111');
    expect(slots[0]?.label).toBe('Home');
    expect(slots[2]).toBeNull();
    expect(labels).toEqual(['Home', 'Work', 'Spare']);
  });

  it('returns null when the write fails', () => {
    const store = useSaveSlotStore.getState();
    store.saveToSlot(0, tripA);

    expect(recordSlotUndo(() => store.saveToSlot(1, tripA))).toBeNull();
  });

  it('refuses to undo after a later unrelated write', () => {
    const store = useSaveSlotStore.getState();
    const handle = recordSlotUndo(() => store.saveToSlot(0, tripA));
    store.saveToSlot(2, tripB);
    const current = useSaveSlotStore.getState();

    expect(undoSlotChange(handle!)).toBe(false);
    expect(useSaveSlotStore.getState().slots).toBe(current.slots);
    expect(useSaveSlotStore.getState().labels).toBe(current.labels);
    expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe('111111');
  });

  it('refuses to undo after a label-only change', () => {
    const store = useSaveSlotStore.getState();
    const handle = recordSlotUndo(() => store.saveToSlot(0, tripA));
    store.renameSlot(1, 'Renamed');

    expect(undoSlotChange(handle!)).toBe(false);
    expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe('111111');
  });
});
