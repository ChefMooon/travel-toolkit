import { useSaveSlotStore } from './saveSlotStore';
import type { SaveSlot } from './types';

// In-memory only: undo handles do not survive a reload. Cloud slots will need server-side
// undo expiry instead of comparing local references.

interface SlotState {
  slots: Array<SaveSlot | null>;
  labels: string[];
}

export interface SlotUndoHandle {
  readonly before: SlotState;
  readonly after: SlotState;
}

function captureSlotState(): SlotState {
  const { slots, labels } = useSaveSlotStore.getState();
  return { slots, labels };
}

// Runs a slot write and returns a handle that can revert it, or null when the write failed.
export function recordSlotUndo(mutate: () => boolean): SlotUndoHandle | null {
  const before = captureSlotState();
  if (!mutate()) {
    return null;
  }
  return { before, after: captureSlotState() };
}

// Store actions always replace the slots/labels arrays, so a reference mismatch means
// something else wrote since; refuse rather than clobber that change.
export function undoSlotChange(handle: SlotUndoHandle): boolean {
  const current = captureSlotState();
  if (current.slots !== handle.after.slots || current.labels !== handle.after.labels) {
    return false;
  }
  useSaveSlotStore.setState({ slots: handle.before.slots, labels: handle.before.labels });
  return true;
}
