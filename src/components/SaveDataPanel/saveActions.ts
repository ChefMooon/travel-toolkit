import i18n from '@/i18n';
import {
  clearImportedTripGuard,
  getImportedTripGuard,
  markImportedTripMatchesSlot,
  shouldConfirmFirstSave,
} from '@/store/importedTripGuard';
import { findSlotIndexByTripId, getTripSaveStatus, useSaveSlotStore, type SaveCopyResult } from '@/store/saveSlotStore';
import { recordSlotUndo, undoSlotChange, type SlotUndoHandle } from '@/store/slotUndo';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import { getDefaultSlotLabel, type TripSnapshot } from '@/store/types';

// Plain functions (no React) so the panel and the trip page's quick save (later) share one path.
// They write and report; callers own UI follow-ups such as the save-continuation contract.

export type QuickSaveResult =
  | { type: 'saved'; slotIndex: number }
  | { type: 'already-saved'; slotIndex: number }
  | { type: 'needs-confirm'; slotIndex: number }
  | { type: 'no-home' }
  | { type: 'blocked' }
  | { type: 'failed' };

export type SaveToSlotResult =
  | { type: 'saved'; slotIndex: number }
  | { type: 'duplicate'; slotIndex: number }
  | { type: 'blocked' }
  | { type: 'failed' };

interface QuickSaveOptions {
  /** The user already confirmed overwriting the slot an imported trip matched. */
  confirmed?: boolean;
  /** Show the "Saved to …" toast (with Undo). Off when the caller follows up itself. */
  notify?: boolean;
}

export function slotLabel(slotIndex: number): string {
  return useSaveSlotStore.getState().labels?.[slotIndex] ?? getDefaultSlotLabel(slotIndex);
}

function pushDateDraftWarning() {
  useToastStore.getState().pushToast({
    type: 'warning',
    title: i18n.t('tripDatesNeedAttention'),
    message: i18n.t('invalidTripDateDraft'),
  });
}

/** Reverts a slot write, or explains why it cannot (something else wrote to the slots since). */
export function undoSlotWrite(handle: SlotUndoHandle): boolean {
  if (undoSlotChange(handle)) return true;
  useToastStore.getState().pushToast({
    type: 'warning',
    title: i18n.t('undoFailedTitle'),
    message: i18n.t('slotUndoUnavailable'),
  });
  return false;
}

/**
 * Saves the live trip over its home slot (the slot holding its trip ID).
 *
 * Undo vs. dirty state: after a save the trip is marked clean (the baseline moves to the saved
 * snapshot). isDirty is not derived from the slots (only history undo/redo recompute it), so
 * Undo puts the trip's previous clean baseline back as well: isDirty is true again whenever the
 * live trip differs from what was last known clean, which the unsaved-changes guard relies on.
 * The baseline is restored only when the slot Undo succeeds (it refuses once the slots changed)
 * and only while nothing else (another save, a load, a new trip) has moved the baseline since.
 */
export function quickSaveActiveTrip({ confirmed = false, notify = true }: QuickSaveOptions = {}): QuickSaveResult {
  const trip = useTripStore.getState();
  if (trip.dateDraftError) {
    pushDateDraftWarning();
    return { type: 'blocked' };
  }

  const snapshot = trip.getSnapshot();
  const { slots } = useSaveSlotStore.getState();
  const status = getTripSaveStatus(slots, snapshot, trip.isDirty);
  if (status.type === 'not-saved') return { type: 'no-home' };

  const slotIndex = status.slotIndex;
  if (status.type === 'saved') {
    if (notify) {
      useToastStore.getState().pushToast({
        type: 'success',
        title: i18n.t('nothingToSaveTitle'),
        message: i18n.t('alreadySavedToSlot', { slot: slotLabel(slotIndex) }),
      });
    }
    return { type: 'already-saved', slotIndex };
  }

  if (!confirmed && shouldConfirmFirstSave(snapshot.tripId)) return { type: 'needs-confirm', slotIndex };

  const handle = recordSlotUndo(() => useSaveSlotStore.getState().saveToSlot(slotIndex, snapshot));
  if (!handle) return { type: 'failed' };

  const cleanToken = trip.markCleanForUndo();
  // Undo puts the slot's older version back, so the import guard that this save cleared comes back
  // too (the next quick save asks again), unless the trip identity changed in between.
  const guardedTripId = getImportedTripGuard() === snapshot.tripId ? snapshot.tripId : null;
  const identityRevision = trip.tripIdentityRevision;
  clearImportedTripGuard();
  if (notify) {
    useToastStore.getState().pushToast({
      type: 'success',
      title: i18n.t('tripSavedTitle'),
      message: i18n.t('tripSavedMessage', { slot: slotLabel(slotIndex) }),
      action: {
        label: i18n.t('undo'),
        onAction: () => {
          if (!undoSlotWrite(handle)) return;
          const current = useTripStore.getState();
          current.restoreCleanBaseline(cleanToken);
          if (guardedTripId && current.tripId === guardedTripId && current.tripIdentityRevision === identityRevision) {
            markImportedTripMatchesSlot(guardedTripId);
          }
        },
      },
    });
  }
  return { type: 'saved', slotIndex };
}

/** Saves the live trip into a chosen slot; refuses (without writing) when another slot holds it. */
export function saveActiveTripToSlot(slotIndex: number): SaveToSlotResult {
  const trip = useTripStore.getState();
  if (trip.dateDraftError) {
    pushDateDraftWarning();
    return { type: 'blocked' };
  }

  const snapshot = trip.getSnapshot();
  const store = useSaveSlotStore.getState();
  const duplicateIndex = findSlotIndexByTripId(store.slots, snapshot.tripId, slotIndex);
  if (duplicateIndex >= 0) return { type: 'duplicate', slotIndex: duplicateIndex };

  if (!store.saveToSlot(slotIndex, snapshot)) return { type: 'failed' };
  trip.markClean();
  clearImportedTripGuard();
  return { type: 'saved', slotIndex };
}

/** Writes a copy (new trip ID, "(copy)" name). The live trip and its home slot are never touched. */
export function saveCopy(sourceSnapshot: TripSnapshot, targetSlotIndex: number): SaveCopyResult {
  const liveTripId = useTripStore.getState().tripId;
  return useSaveSlotStore.getState().saveCopyToSlot(targetSlotIndex, sourceSnapshot, [liveTripId]);
}
