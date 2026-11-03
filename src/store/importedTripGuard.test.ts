/// <reference types="vitest" />

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearImportedTripGuard,
  getImportedTripGuard,
  markImportedTripMatchesSlot,
  shouldConfirmFirstSave,
  subscribeImportedTripGuard,
} from './importedTripGuard';
import { useTripStore } from './tripStore';

describe('importedTripGuard', () => {
  afterEach(() => clearImportedTripGuard());

  it('starts empty and never asks for confirmation', () => {
    expect(getImportedTripGuard()).toBeNull();
    expect(shouldConfirmFirstSave('111111')).toBe(false);
  });

  it('asks for confirmation only while the live trip ID equals the marked one', () => {
    markImportedTripMatchesSlot('111111');
    expect(getImportedTripGuard()).toBe('111111');
    expect(shouldConfirmFirstSave('111111')).toBe(true);
    expect(shouldConfirmFirstSave('222222')).toBe(false);
  });

  it('is replaced by a later mark and emptied by clear', () => {
    markImportedTripMatchesSlot('111111');
    markImportedTripMatchesSlot('222222');
    expect(shouldConfirmFirstSave('111111')).toBe(false);
    expect(shouldConfirmFirstSave('222222')).toBe(true);
    clearImportedTripGuard();
    expect(shouldConfirmFirstSave('222222')).toBe(false);
  });

  it('notifies subscribers only on real changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeImportedTripGuard(listener);
    markImportedTripMatchesSlot('111111');
    markImportedTripMatchesSlot('111111');
    clearImportedTripGuard();
    clearImportedTripGuard();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    markImportedTripMatchesSlot('333333');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it.each(['load', 'reset', 'trip ID edit'] as const)('clears itself when the trip identity changes (%s)', (change) => {
    const store = useTripStore.getState();
    markImportedTripMatchesSlot(store.tripId);
    // Ordinary edits keep the guard.
    store.setTripName('Edited');
    expect(shouldConfirmFirstSave(useTripStore.getState().tripId)).toBe(true);

    if (change === 'load') store.loadSnapshot({ ...store.getSnapshot(), tripId: '987654' });
    if (change === 'reset') store.resetTrip();
    if (change === 'trip ID edit') store.setTripId(store.tripId === '987655' ? '987656' : '987655');

    expect(getImportedTripGuard()).toBeNull();
  });
});
