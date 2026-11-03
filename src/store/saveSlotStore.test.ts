import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findRelatedOlderSlotIndex,
  findSlotIndexByTripId,
  getTripSaveStatus,
  normalizePersistedSaveSlotState,
  useSaveSlotStore,
} from './saveSlotStore';
import { useToastStore } from './toastStore';
import { MAX_TRIP_NAME_LENGTH, SAVE_SLOT_SCHEMA_VERSION, type SaveSlot, type TripSnapshot } from './types';

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
    expect(loaded).toEqual({ ...baseSnapshot, tripStartDate: '', tripEndDate: '' });
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

describe('saveSlotStore — copies, trip rename and duplicate lookup', () => {
  const richSnapshot: TripSnapshot = {
    ...baseSnapshot,
    couples: [{ id: 'couple-a', name: 'Group A', colorIndex: 1, iconIndex: 1, sortOrder: 0 }],
    costs: [{ id: 'cost-a', name: 'Hotel', currency: 'USD', value: 100, markupOverride: null, splitType: 'subset', assignedCoupleIds: ['couple-a'], sortOrder: 0 }],
  };

  beforeEach(() => {
    useSaveSlotStore.setState({ slots: [null, null, null], labels: ['Slot 1', 'Slot 2', 'Slot 3'] });
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds a slot by trip ID, optionally excluding one index', () => {
    useSaveSlotStore.getState().saveToSlot(1, baseSnapshot);
    const { slots } = useSaveSlotStore.getState();

    expect(findSlotIndexByTripId(slots, '111111')).toBe(1);
    expect(findSlotIndexByTripId(slots, '111111', 1)).toBe(-1);
    expect(findSlotIndexByTripId(slots, '999999')).toBe(-1);
  });

  it('saves a copy with a new unique 6-digit ID and a copy name', () => {
    useSaveSlotStore.getState().saveToSlot(0, richSnapshot);
    const sourceBefore = useSaveSlotStore.getState().slots[0];
    const liveId = '222222';

    const result = useSaveSlotStore.getState().saveCopyToSlot(1, richSnapshot, [liveId]);
    const { slots } = useSaveSlotStore.getState();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tripId).toMatch(/^\d{6}$/);
    expect(result.tripId).not.toBe(richSnapshot.tripId);
    expect(result.tripId).not.toBe(liveId);
    expect(slots[1]?.tripId).toBe(result.tripId);
    expect(slots[1]?.data.tripId).toBe(result.tripId);
    expect(slots[1]?.tripName).toBe('Trip One (copy)');
    expect(slots[1]?.data.tripName).toBe('Trip One (copy)');
    expect(slots[1]?.data.costs[0]?.assignedCoupleIds).toEqual(['couple-a']);
    expect(slots[1]?.data.couples).not.toBe(richSnapshot.couples);
    expect(slots[0]).toBe(sourceBefore);
    expect(richSnapshot.tripId).toBe('111111');
    expect(richSnapshot.tripName).toBe('Trip One');
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('truncates a long base name so the copy name fits the max length', () => {
    const longName = 'x'.repeat(MAX_TRIP_NAME_LENGTH);
    const result = useSaveSlotStore.getState().saveCopyToSlot(0, { ...baseSnapshot, tripName: longName }, []);
    const name = useSaveSlotStore.getState().slots[0]?.tripName ?? '';

    expect(result.ok).toBe(true);
    expect(name).toHaveLength(MAX_TRIP_NAME_LENGTH);
    expect(name.endsWith(' (copy)')).toBe(true);
  });

  it('names a copy of an unnamed trip without a leading space', () => {
    useSaveSlotStore.getState().saveCopyToSlot(0, { ...baseSnapshot, tripName: '  ' }, []);

    expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Untitled Trip (copy)');
  });

  it('does not split a surrogate pair when cutting a long name for the copy', () => {
    // 92 ASCII characters then emoji: the 93-unit cut (100 minus " (copy)") lands inside the first emoji.
    const longName = `${'x'.repeat(92)}${'😀'.repeat(5)}`;
    useSaveSlotStore.getState().saveCopyToSlot(0, { ...baseSnapshot, tripName: longName }, []);
    const name = useSaveSlotStore.getState().slots[0]?.tripName ?? '';

    expect(name).toBe(`${'x'.repeat(92)} (copy)`);
    expect(name).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });

  it('fails without writing when the source cannot be cloned', () => {
    const uncloneable = { ...baseSnapshot, couples: [() => {}] } as unknown as TripSnapshot;

    expect(useSaveSlotStore.getState().saveCopyToSlot(0, uncloneable, [])).toEqual({ ok: false });
    expect(useSaveSlotStore.getState().slots[0]).toBeNull();
  });

  it('retries the generated ID when it collides with a taken one', () => {
    useSaveSlotStore.getState().saveToSlot(0, { ...baseSnapshot, tripId: '100000' });
    // 0 -> 100000 (slot), 0.5 -> 550000 (live), then 0.25 -> 325000.
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.5).mockReturnValueOnce(0.25);

    const result = useSaveSlotStore.getState().saveCopyToSlot(1, baseSnapshot, ['550000']);

    expect(result).toEqual({ ok: true, tripId: '325000' });
    expect(random).toHaveBeenCalledTimes(3);
  });

  it('fails without writing when no unique ID can be generated', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(useSaveSlotStore.getState().saveCopyToSlot(0, baseSnapshot, ['100000'])).toEqual({ ok: false });
    expect(useSaveSlotStore.getState().slots[0]).toBeNull();
  });

  it('renames the saved trip while keeping savedAt and label', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    const before = useSaveSlotStore.getState().slots[0]!;

    expect(useSaveSlotStore.getState().renameSlotTrip(0, '  Renamed  ')).toBe(true);
    const after = useSaveSlotStore.getState().slots[0]!;

    expect(after.tripName).toBe('Renamed');
    expect(after.data.tripName).toBe('Renamed');
    expect(after.savedAt).toBe(before.savedAt);
    expect(after.label).toBe(before.label);
    expect(after.tripId).toBe(before.tripId);
  });

  it('truncates renamed trip names and rejects blank names and empty slots', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);

    expect(useSaveSlotStore.getState().renameSlotTrip(0, '')).toBe(false);
    expect(useSaveSlotStore.getState().renameSlotTrip(0, '   ')).toBe(false);
    expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Trip One');
    expect(useSaveSlotStore.getState().renameSlotTrip(1, 'Name')).toBe(false);
    expect(useSaveSlotStore.getState().slots[1]).toBeNull();

    useSaveSlotStore.getState().renameSlotTrip(0, 'y'.repeat(MAX_TRIP_NAME_LENGTH + 10));
    expect(useSaveSlotStore.getState().slots[0]?.tripName).toHaveLength(MAX_TRIP_NAME_LENGTH);
  });

  it('does not split a surrogate pair when truncating a renamed trip name', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    // The limit falls between the two halves of the first emoji.
    const longName = `${'x'.repeat(MAX_TRIP_NAME_LENGTH - 1)}${'😀'.repeat(3)}`;

    expect(useSaveSlotStore.getState().renameSlotTrip(0, longName)).toBe(true);
    const { tripName, data } = useSaveSlotStore.getState().slots[0]!;

    expect(tripName).toBe('x'.repeat(MAX_TRIP_NAME_LENGTH - 1));
    expect(data.tripName).toBe(tripName);
    expect(tripName).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });
});
