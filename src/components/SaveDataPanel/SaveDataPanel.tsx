import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, X } from 'lucide-react';
import Modal from '@/components/Modal';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import {
  MAX_SAVE_SLOTS,
  MAX_SLOT_LABEL_LENGTH,
  getDefaultSlotLabel,
  type TripSnapshot,
} from '@/store/types';

interface SaveDataPanelProps {
  open: boolean;
  onClose: () => void;
}

type ConfirmIntent =
  | { type: 'load'; slotIndex: number }
  | { type: 'overwrite'; slotIndex: number }
  | { type: 'clear'; slotIndex: number }
  | { type: 'swap'; firstSlotIndex: number; secondSlotIndex: number };

function snapshotsEqual(a: TripSnapshot, b: TripSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatRelativeTime(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return 'Unknown save time';
  }

  const seconds = Math.round((Date.now() - timestamp) / 1000);
  const absSeconds = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (absSeconds < 60) {
    return rtf.format(-seconds, 'second');
  }
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return rtf.format(-minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return rtf.format(-hours, 'hour');
  }
  const days = Math.round(hours / 24);
  return rtf.format(-days, 'day');
}

export default function SaveDataPanel({ open, onClose }: SaveDataPanelProps) {
  const slots = useSaveSlotStore((s) => s.slots);
  const labels = useSaveSlotStore((s) => s.labels ?? []);
  const saveToSlot = useSaveSlotStore((s) => s.saveToSlot);
  const loadFromSlot = useSaveSlotStore((s) => s.loadFromSlot);
  const clearSlot = useSaveSlotStore((s) => s.clearSlot);
  const swapSlots = useSaveSlotStore((s) => s.swapSlots);
  const renameSlot = useSaveSlotStore((s) => s.renameSlot);

  const tripName = useTripStore((s) => s.tripName);
  const tripId = useTripStore((s) => s.tripId);
  const isDirty = useTripStore((s) => s.isDirty);
  const getSnapshot = useTripStore((s) => s.getSnapshot);
  const loadSnapshot = useTripStore((s) => s.loadSnapshot);
  const markClean = useTripStore((s) => s.markClean);

  const pushToast = useToastStore((s) => s.pushToast);

  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent | null>(null);
  const [selectedForSwap, setSelectedForSwap] = useState<number[]>([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  const canSwap = selectedForSwap.length === 2;

  const displayLabels = useMemo(
    () => Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => labels[index] ?? getDefaultSlotLabel(index)),
    [labels]
  );

  const currentSnapshot = getSnapshot();
  const matchedSlotIndex = slots.findIndex((slot) => (slot ? snapshotsEqual(slot.data, currentSnapshot) : false));
  const statusText = matchedSlotIndex >= 0
    ? ` - All changes saved (${displayLabels[matchedSlotIndex]})`
    : isDirty
      ? ' - Unsaved changes'
      : ' - Not saved to a slot';

  useEffect(() => {
    if (!open) {
      setConfirmIntent(null);
      setSelectedForSwap([]);
      setEditingSlotIndex(null);
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const firstFocusable = dialog.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) {
        return;
      }

      const active = document.activeElement;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [onClose]
  );

  const runSave = useCallback(
    (slotIndex: number) => {
      const ok = saveToSlot(slotIndex, getSnapshot());
      if (!ok) {
        return;
      }

      markClean();
      pushToast({
        type: 'success',
        title: 'Trip saved',
        message: `Saved to ${displayLabels[slotIndex]}.`,
      });
    },
    [displayLabels, getSnapshot, markClean, pushToast, saveToSlot]
  );

  const runLoad = useCallback(
    (slotIndex: number) => {
      const slot = slots[slotIndex];
      const snapshot = loadFromSlot(slotIndex);
      if (!snapshot) {
        if (!slot) {
          pushToast({
            type: 'warning',
            title: 'Slot is empty',
            message: `There is no save data in ${displayLabels[slotIndex]}.`,
          });
        }
        return;
      }

      loadSnapshot(snapshot);
      markClean();
      pushToast({
        type: 'success',
        title: 'Trip loaded',
        message: `Loaded ${snapshot.tripName || displayLabels[slotIndex]}.`,
      });
    },
    [displayLabels, loadFromSlot, loadSnapshot, markClean, pushToast, slots]
  );

  const runClear = useCallback(
    (slotIndex: number) => {
      clearSlot(slotIndex);
      pushToast({
        type: 'success',
        title: 'Slot cleared',
        message: `${displayLabels[slotIndex]} is now empty.`,
      });
    },
    [clearSlot, displayLabels, pushToast]
  );

  const runSwap = useCallback(
    (firstSlotIndex: number, secondSlotIndex: number) => {
      swapSlots(firstSlotIndex, secondSlotIndex);
      setSelectedForSwap([]);
      pushToast({
        type: 'success',
        title: 'Slots swapped',
        message: `${displayLabels[firstSlotIndex]} and ${displayLabels[secondSlotIndex]} were swapped.`,
      });
    },
    [displayLabels, pushToast, swapSlots]
  );

  const handleLoadClick = useCallback(
    (slotIndex: number) => {
      if (isDirty) {
        setConfirmIntent({ type: 'load', slotIndex });
        return;
      }
      runLoad(slotIndex);
    },
    [isDirty, runLoad]
  );

  const handleSwapToggle = useCallback((slotIndex: number) => {
    setSelectedForSwap((prev) => {
      if (prev.includes(slotIndex)) {
        return prev.filter((entry) => entry !== slotIndex);
      }
      if (prev.length >= 2) {
        return [prev[1]!, slotIndex];
      }
      return [...prev, slotIndex];
    });
  }, []);

  const openRename = useCallback(
    (slotIndex: number) => {
      setEditingSlotIndex(slotIndex);
      setLabelDraft(displayLabels[slotIndex] ?? getDefaultSlotLabel(slotIndex));
    },
    [displayLabels]
  );

  const commitRename = useCallback(() => {
    if (editingSlotIndex === null) {
      return;
    }
    renameSlot(editingSlotIndex, labelDraft);
    setEditingSlotIndex(null);
  }, [editingSlotIndex, labelDraft, renameSlot]);

  const handleConfirmAction = useCallback(() => {
    if (!confirmIntent) {
      return;
    }

    if (confirmIntent.type === 'load') {
      runLoad(confirmIntent.slotIndex);
    }

    if (confirmIntent.type === 'overwrite') {
      runSave(confirmIntent.slotIndex);
    }

    if (confirmIntent.type === 'clear') {
      runClear(confirmIntent.slotIndex);
    }

    if (confirmIntent.type === 'swap') {
      runSwap(confirmIntent.firstSlotIndex, confirmIntent.secondSlotIndex);
    }

    setConfirmIntent(null);
  }, [confirmIntent, runClear, runLoad, runSave, runSwap]);

  if (!open) {
    return null;
  }

  return createPortal(
    <>
      <div className="save-data-panel-overlay" onClick={onClose}>
        <div
          ref={dialogRef}
          className="save-data-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <div className="save-data-panel-header">
            <div>
              <h2 id={titleId}>Save Data Slots</h2>
              <p id={bodyId}>
                Active trip: <strong>{tripName || 'Untitled Trip'}</strong> (ID {tripId})
                {statusText}
              </p>
            </div>
            <div className="save-data-panel-header-actions">
              {canSwap ? (
                <button
                  type="button"
                  className="save-slot-btn"
                  onClick={() => {
                    setConfirmIntent({
                      type: 'swap',
                      firstSlotIndex: selectedForSwap[0]!,
                      secondSlotIndex: selectedForSwap[1]!,
                    });
                  }}
                >
                  Swap Selected Slots
                </button>
              ) : null}
              <button type="button" className="save-data-panel-close" onClick={onClose} aria-label="Close save data panel">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="save-slot-grid">
            {Array.from({ length: MAX_SAVE_SLOTS }, (_, slotIndex) => {
              const slot = slots[slotIndex] ?? null;
              const label = displayLabels[slotIndex];
              const selected = selectedForSwap.includes(slotIndex);

              return (
                <section key={slotIndex} className={`save-slot-card${selected ? ' is-selected' : ''}`}>
                  <div className="save-slot-title-row">
                    {editingSlotIndex === slotIndex ? (
                      <input
                        className="save-slot-label-input"
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value.slice(0, MAX_SLOT_LABEL_LENGTH))}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            commitRename();
                          }
                          if (e.key === 'Escape') {
                            setEditingSlotIndex(null);
                          }
                        }}
                        maxLength={MAX_SLOT_LABEL_LENGTH}
                        autoFocus
                        aria-label={`Rename ${label}`}
                      />
                    ) : (
                      <h3>{label}</h3>
                    )}
                    <button
                      type="button"
                      className="save-slot-icon-btn"
                      onClick={() => openRename(slotIndex)}
                      aria-label={`Rename ${label}`}
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>

                  {slot ? (
                    <>
                      <div className="save-slot-meta">
                        <div><span>Trip</span><strong>{slot.tripName || 'Untitled Trip'}</strong></div>
                        <div><span>ID</span><strong>{slot.tripId}</strong></div>
                        <div><span>Saved</span><strong>{formatRelativeTime(slot.savedAt)}</strong></div>
                        <div><span>Party</span><strong>{slot.coupleCount} groups</strong></div>
                        <div><span>Costs</span><strong>{slot.costCount} entries</strong></div>
                        <div><span>Currency</span><strong>{slot.targetCurrency}</strong></div>
                      </div>
                      <div className="save-slot-chip-row">
                        <span className="save-slot-chip">v{slot.schemaVersion}</span>
                      </div>
                      <div className="save-slot-actions">
                        <button type="button" className="save-slot-btn" onClick={() => handleLoadClick(slotIndex)}>
                          Load
                        </button>
                        <button
                          type="button"
                          className="save-slot-btn"
                          onClick={() => setConfirmIntent({ type: 'overwrite', slotIndex })}
                        >
                          Overwrite
                        </button>
                        <button
                          type="button"
                          className="save-slot-btn danger"
                          onClick={() => setConfirmIntent({ type: 'clear', slotIndex })}
                        >
                          Clear
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="save-slot-empty">No trip saved in this slot yet.</p>
                      <div className="save-slot-actions">
                        <button type="button" className="save-slot-btn" onClick={() => runSave(slotIndex)}>
                          Save Here
                        </button>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    className={`save-slot-swap-btn${selected ? ' is-selected' : ''}`}
                    onClick={() => handleSwapToggle(slotIndex)}
                  >
                    {selected ? 'Selected for swap' : 'Select for swap'}
                  </button>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      {confirmIntent ? (
        <Modal
          icon="⚠️"
          title={
            confirmIntent.type === 'load'
              ? 'Load saved trip?'
              : confirmIntent.type === 'overwrite'
              ? 'Overwrite slot data?'
              : confirmIntent.type === 'clear'
              ? 'Clear this slot?'
              : 'Swap selected slots?'
          }
          body={
            confirmIntent.type === 'load'
              ? 'This will replace your current trip in the workspace. Unsaved changes will be lost.'
              : confirmIntent.type === 'overwrite'
              ? 'This slot already has saved data. Overwrite it with the current trip?'
              : confirmIntent.type === 'clear'
              ? 'This removes all saved data from the selected slot.'
              : 'This swaps the saved data between the two selected slots.'
          }
          confirmLabel="Confirm"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmIntent(null)}
        />
      ) : null}
    </>,
    document.body
  );
}
