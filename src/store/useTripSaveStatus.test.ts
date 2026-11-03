import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getTripSaveStatus, useSaveSlotStore } from './saveSlotStore';
import { useTripStore } from './tripStore';
import { useToastStore } from './toastStore';
import type { SaveSlot, TripSnapshot } from './types';
import { hasUnsavedWork, useTripSaveStatus } from './useTripSaveStatus';

const emptyTrip: TripSnapshot = {
  tripId: '111111',
  tripName: 'Trip',
  globalMarkup: 66,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'USD',
};
const tripWithContent: TripSnapshot = {
  ...emptyTrip,
  couples: [{ id: 'couple-a', name: 'Group A', colorIndex: 1, iconIndex: 1, sortOrder: 0 }],
};

describe('hasUnsavedWork', () => {
  it('is true when the trip differs from its slot even if not dirty (after a reload)', () => {
    const slot: SaveSlot = {
      slotIndex: 0, schemaVersion: 1, label: 'Slot 1', tripId: '111111', tripName: 'Trip',
      savedAt: '', coupleCount: 0, costCount: 0, targetCurrency: 'USD', data: emptyTrip,
    };
    const status = getTripSaveStatus([slot, null, null], tripWithContent, false);

    expect(status.type).toBe('unsaved-changes');
    expect(hasUnsavedWork(status, tripWithContent, false)).toBe(true);
  });

  it('is false when the trip matches its slot', () => {
    expect(hasUnsavedWork({ type: 'saved', slotIndex: 0 }, tripWithContent, true)).toBe(false);
  });

  it('is false for a pristine new trip', () => {
    expect(hasUnsavedWork({ type: 'not-saved', hasUnsavedChanges: false }, emptyTrip, false)).toBe(false);
  });

  it('is true for an unsaved trip with content or edits', () => {
    const status = { type: 'not-saved', hasUnsavedChanges: false } as const;
    expect(hasUnsavedWork(status, tripWithContent, false)).toBe(true);
    expect(hasUnsavedWork(status, { ...emptyTrip, costs: [{ id: 'c', name: 'C', currency: 'USD', value: 1, markupOverride: null, splitType: 'shared', assignedCoupleIds: [], sortOrder: 0 }] }, false)).toBe(true);
    expect(hasUnsavedWork(status, { ...emptyTrip, nonPayingTravellers: [{ id: 'k', label: 'Child 1', coupleId: 'couple-a' }] }, false)).toBe(true);
    expect(hasUnsavedWork(status, emptyTrip, true)).toBe(true);
  });
});

describe('useTripSaveStatus', () => {
  beforeEach(() => {
    useSaveSlotStore.setState({ slots: [null, null, null], labels: ['Slot 1', 'Slot 2', 'Slot 3'] });
    useTripStore.getState().resetTrip();
    useTripStore.getState().markClean();
    useToastStore.getState().clearToasts();
  });

  it('tracks the home slot and unsaved work as the trip and slots change', () => {
    const { result } = renderHook(() => useTripSaveStatus());
    expect(result.current).toEqual({
      status: { type: 'not-saved', hasUnsavedChanges: false },
      homeSlotIndex: -1,
      hasUnsavedWork: false,
    });

    act(() => {
      useSaveSlotStore.getState().saveToSlot(1, useTripStore.getState().getSnapshot());
      useTripStore.getState().markClean();
    });
    expect(result.current.status.type).toBe('saved');
    expect(result.current.homeSlotIndex).toBe(1);
    expect(result.current.hasUnsavedWork).toBe(false);

    act(() => {
      useTripStore.getState().addCouple('Group A');
    });
    expect(result.current.status.type).toBe('unsaved-changes');
    expect(result.current.homeSlotIndex).toBe(1);
    expect(result.current.hasUnsavedWork).toBe(true);
  });

  it('keeps the same result object when unrelated trip state changes', () => {
    const { result } = renderHook(() => useTripSaveStatus());
    const first = result.current;

    act(() => {
      useTripStore.getState().setDateDraftError('draft');
    });
    expect(result.current).toBe(first);
  });
});
