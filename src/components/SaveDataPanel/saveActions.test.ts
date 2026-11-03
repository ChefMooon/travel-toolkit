/// <reference types="vitest" />

import { beforeEach, describe, expect, it } from 'vitest';
import { clearImportedTripGuard, getImportedTripGuard, markImportedTripMatchesSlot, shouldConfirmFirstSave } from '@/store/importedTripGuard';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import type { TripSnapshot } from '@/store/types';
import { quickSaveActiveTrip, saveActiveTripToSlot, saveCopy } from './saveActions';

const live: TripSnapshot = {
  tripId: '111111',
  tripName: 'Live trip',
  globalMarkup: 0,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'EUR',
};
const other: TripSnapshot = { ...live, tripId: '222222', tripName: 'Other trip' };

const toasts = () => useToastStore.getState().toasts;
const slots = () => useSaveSlotStore.getState().slots;

describe('saveActions', () => {
  beforeEach(() => {
    clearImportedTripGuard();
    useSaveSlotStore.setState({ slots: [null, null, null], labels: ['Slot 1', 'Slot 2', 'Slot 3'] });
    useTripStore.getState().loadSnapshot(live);
    useTripStore.getState().markClean();
    useTripStore.setState({ dateDraftError: '' });
    useToastStore.getState().clearToasts();
  });

  describe('quickSaveActiveTrip', () => {
    it('reports no-home without writing when the trip has no slot', () => {
      expect(quickSaveActiveTrip()).toEqual({ type: 'no-home' });
      expect(slots()).toEqual([null, null, null]);
    });

    it('blocks on an invalid date draft with the existing warning', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      useTripStore.setState({ dateDraftError: 'End date must be on or after the start date.' });

      expect(quickSaveActiveTrip()).toEqual({ type: 'blocked' });
      expect(slots()[0]?.tripName).toBe('Older');
      expect(toasts().map((toast) => toast.title)).toEqual(['Trip dates need attention']);
    });

    it('does not write when the home slot already matches', () => {
      useSaveSlotStore.getState().saveToSlot(1, live);
      const before = slots();

      expect(quickSaveActiveTrip()).toEqual({ type: 'already-saved', slotIndex: 1 });
      expect(slots()).toBe(before);
      expect(toasts()[0]).toMatchObject({ title: 'No changes to save', message: 'Already saved to Slot 2.' });
    });

    it('saves to the home slot, marks the trip clean and offers Undo', () => {
      useSaveSlotStore.getState().saveToSlot(1, { ...live, tripName: 'Older' });
      useTripStore.getState().setTripName('Live trip, edited');

      expect(quickSaveActiveTrip()).toEqual({ type: 'saved', slotIndex: 1 });
      expect(slots()[1]?.tripName).toBe('Live trip, edited');
      expect(useTripStore.getState().isDirty).toBe(false);
      const [toast] = toasts();
      expect(toast).toMatchObject({ title: 'Trip saved', message: 'Saved to Slot 2.', action: { label: 'Undo' } });

      toast!.action!.onAction();
      expect(slots()[1]?.tripName).toBe('Older');
      // The edits exist only in the live trip again, so the unsaved-changes guard must see them.
      expect(useTripStore.getState().isDirty).toBe(true);
    });

    it('leaves a trip that was clean before the save clean after Undo', () => {
      useSaveSlotStore.getState().saveToSlot(1, { ...live, tripName: 'Older' });
      expect(useTripStore.getState().isDirty).toBe(false);

      expect(quickSaveActiveTrip()).toEqual({ type: 'saved', slotIndex: 1 });
      toasts()[0]!.action!.onAction();

      expect(slots()[1]?.tripName).toBe('Older');
      expect(useTripStore.getState().isDirty).toBe(false);
    });

    it('keeps the trip clean when the Undo is refused because the slots changed since', () => {
      useSaveSlotStore.getState().saveToSlot(1, { ...live, tripName: 'Older' });
      useTripStore.getState().setTripName('Live trip, edited');
      quickSaveActiveTrip();
      const [toast] = toasts();
      useSaveSlotStore.getState().renameSlot(2, 'Later');

      toast!.action!.onAction();

      expect(slots()[1]?.tripName).toBe('Live trip, edited');
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(toasts().map((item) => item.title)).toContain('Could not undo');
    });

    it('stays quiet when asked not to notify', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      expect(quickSaveActiveTrip({ notify: false })).toEqual({ type: 'saved', slotIndex: 0 });
      expect(toasts()).toHaveLength(0);
    });

    it('asks for confirmation once after an import matched the home slot, then clears the guard', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      markImportedTripMatchesSlot(live.tripId);

      expect(quickSaveActiveTrip()).toEqual({ type: 'needs-confirm', slotIndex: 0 });
      expect(slots()[0]?.tripName).toBe('Older');

      expect(quickSaveActiveTrip({ confirmed: true })).toEqual({ type: 'saved', slotIndex: 0 });
      expect(slots()[0]?.tripName).toBe('Live trip');
      expect(shouldConfirmFirstSave(live.tripId)).toBe(false);
    });

    it('asks again after Undo of a confirmed save over the slot an import matched', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      markImportedTripMatchesSlot(live.tripId);
      quickSaveActiveTrip({ confirmed: true });

      toasts()[0]!.action!.onAction();

      expect(slots()[0]?.tripName).toBe('Older');
      expect(shouldConfirmFirstSave(live.tripId)).toBe(true);
      expect(quickSaveActiveTrip()).toEqual({ type: 'needs-confirm', slotIndex: 0 });
      expect(slots()[0]?.tripName).toBe('Older');
    });

    it('does not bring the import guard back when the trip identity changed before Undo', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      markImportedTripMatchesSlot(live.tripId);
      quickSaveActiveTrip({ confirmed: true });
      const [toast] = toasts();
      // Same ID, new identity (e.g. reloaded): the restored guard must not outlive the change.
      useTripStore.getState().loadSnapshot({ ...live, tripName: 'Reloaded' });

      toast!.action!.onAction();

      expect(slots()[0]?.tripName).toBe('Older');
      expect(shouldConfirmFirstSave(live.tripId)).toBe(false);
    });

    it('does not create an import guard on Undo when none was set', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      quickSaveActiveTrip();

      toasts()[0]!.action!.onAction();

      expect(shouldConfirmFirstSave(live.tripId)).toBe(false);
    });

    it('keeps watching trip identity after the guard comes back with Undo', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      markImportedTripMatchesSlot(live.tripId);
      quickSaveActiveTrip({ confirmed: true });
      toasts()[0]!.action!.onAction();
      expect(shouldConfirmFirstSave(live.tripId)).toBe(true);

      useTripStore.getState().resetTrip();

      expect(getImportedTripGuard()).toBeNull();
    });
  });

  describe('saveActiveTripToSlot', () => {
    it('refuses without writing or toasting when another slot holds the trip', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });

      expect(saveActiveTripToSlot(2)).toEqual({ type: 'duplicate', slotIndex: 0 });
      expect(slots()[2]).toBeNull();
      expect(toasts()).toHaveLength(0);
    });

    it('saves, marks clean and clears the import guard', () => {
      useTripStore.getState().setTripName('Edited');
      markImportedTripMatchesSlot(useTripStore.getState().tripId);

      expect(saveActiveTripToSlot(2)).toEqual({ type: 'saved', slotIndex: 2 });
      expect(slots()[2]?.tripName).toBe('Edited');
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(shouldConfirmFirstSave(live.tripId)).toBe(false);
    });
  });

  describe('saveCopy', () => {
    it('writes a copy with a new ID that avoids the live trip and leaves the live trip and home slot alone', () => {
      useSaveSlotStore.getState().saveToSlot(0, live);
      const home = slots()[0];
      useTripStore.getState().setTripName('Unsaved edit');

      const result = saveCopy(other, 1);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect([live.tripId, other.tripId]).not.toContain(result.tripId);
      expect(slots()[1]).toMatchObject({ tripId: result.tripId, tripName: 'Other trip (copy)' });
      expect(slots()[0]).toBe(home);
      expect(useTripStore.getState().tripName).toBe('Unsaved edit');
      expect(useTripStore.getState().isDirty).toBe(true);
    });
  });
});
