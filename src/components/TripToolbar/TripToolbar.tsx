import { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTripStore } from '@/store/tripStore';
import { findRelatedOlderSlotIndex, useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import Modal from '@/components/Modal';
import { MAX_TRIP_NAME_LENGTH, getDefaultSlotLabel } from '@/store/types';
import SaveDataPanel from '@/components/SaveDataPanel';

export default function TripToolbar() {
  const tripId = useTripStore((s) => s.tripId);
  const setTripId = useTripStore((s) => s.setTripId);
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const setGlobalMarkup = useTripStore((s) => s.setGlobalMarkup);
  const isDirty = useTripStore((s) => s.isDirty);
  const getSnapshot = useTripStore((s) => s.getSnapshot);
  const resetTrip = useTripStore((s) => s.resetTrip);
  const slots = useSaveSlotStore((s) => s.slots);
  const labels = useSaveSlotStore((s) => s.labels);
  const saveToSlot = useSaveSlotStore((s) => s.saveToSlot);
  const pushToast = useToastStore((s) => s.pushToast);

  const [showReset, setShowReset] = useState(false);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [tripNameFocused, setTripNameFocused] = useState(false);
  const [tripIdInput, setTripIdInput] = useState(tripId);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupInput, setMarkupInput] = useState(String(globalMarkup));

  useEffect(() => {
    setTripIdInput(tripId);
  }, [tripId]);

  useEffect(() => {
    if (editingMarkup) return;
    setMarkupInput(String(globalMarkup));
  }, [globalMarkup, editingMarkup]);

  const handleMarkupBlur = useCallback(() => {
    const val = parseFloat(markupInput);
    if (!Number.isNaN(val) && val >= 0) {
      setGlobalMarkup(val);
    } else {
      setMarkupInput(String(globalMarkup));
    }
    setEditingMarkup(false);
  }, [markupInput, setGlobalMarkup, globalMarkup]);

  const handleTripIdBlur = useCallback(() => {
    if (tripIdInput !== tripId) {
      setTripId(tripIdInput);
    }
  }, [tripId, tripIdInput, setTripId]);

  const currentSnapshot = getSnapshot();
  const relatedSlotIndex = findRelatedOlderSlotIndex(slots, currentSnapshot);

  const handleSaveThenReset = useCallback(() => {
    if (relatedSlotIndex < 0) {
      return;
    }

    const ok = saveToSlot(relatedSlotIndex, currentSnapshot);
    if (!ok) {
      return;
    }

    const slotLabel = labels[relatedSlotIndex] ?? getDefaultSlotLabel(relatedSlotIndex);
    pushToast({
      type: 'success',
      title: 'Saved and started new trip',
      message: `Updated ${slotLabel} and cleared the current trip.`,
    });
    resetTrip();
    setShowReset(false);
  }, [currentSnapshot, labels, pushToast, relatedSlotIndex, resetTrip, saveToSlot]);

  return (
    <>
      <header className="trip-toolbar">
        <div className="trip-toolbar-center">
          <div className="trip-pill">
            <input
              className="trip-pill-text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              onFocus={() => setTripNameFocused(true)}
              onBlur={() => setTripNameFocused(false)}
              maxLength={MAX_TRIP_NAME_LENGTH}
              aria-label="Trip name"
            />
            {tripNameFocused && tripName ? (
              <button
                type="button"
                className="trip-pill-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTripName('');
                }}
                aria-label="Clear trip name"
              >
                ×
              </button>
            ) : (
              <span className="trip-pill-edit">✎</span>
            )}
          </div>
        </div>

        <div className="trip-toolbar-id-row">
          <div className="trip-id-pill">
            <span className="trip-id-pill-label">Trip ID</span>
            <input
              className="trip-id-pill-input"
              value={tripIdInput}
              onChange={(e) => setTripIdInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onBlur={handleTripIdBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTripIdBlur();
                }
              }}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]{6}"
              aria-label="Trip ID"
            />
          </div>
        </div>

        <div className="trip-toolbar-right">
          {editingMarkup ? (
            <div className="markup-pill" role="group" aria-label="Markup editor">
              <span>Markup</span>
              <input
                className="markup-num"
                type="number"
                step="0.1"
                min="0"
                value={markupInput}
                onChange={(e) => setMarkupInput(e.target.value)}
                onBlur={handleMarkupBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleMarkupBlur()}
                autoFocus
                aria-label="Global markup percentage"
              />
            </div>
          ) : (
            <button type="button" className="markup-pill" onClick={() => setEditingMarkup(true)}>
              <span>Markup</span>
              <span className="markup-num">{globalMarkup}%</span>
            </button>
          )}

          <button type="button" className="btn-new-trip" onClick={() => setShowReset(true)}>
            <RotateCcw size={12} /> <span>New Trip</span>
          </button>

          <button
            type="button"
            className="btn-save-panel"
            data-dirty={isDirty ? 'true' : 'false'}
            onClick={() => setShowSavePanel(true)}
            aria-label="Open save slots"
            title="Save slots"
          >
            <img src="/save.svg" alt="" aria-hidden="true" />
          </button>
        </div>
      </header>

      {showReset ? (
        <Modal
          icon="🗑️"
          title="Start a new trip?"
          body="This will permanently delete all current trip data including couples, costs, and exchange rates. This action cannot be undone."
          secondaryActionLabel={relatedSlotIndex >= 0 ? 'Update Save & Start Fresh' : undefined}
          onSecondaryAction={relatedSlotIndex >= 0 ? handleSaveThenReset : undefined}
          confirmLabel="Delete & Start Fresh"
          onConfirm={() => {
            resetTrip();
            setShowReset(false);
          }}
          onCancel={() => setShowReset(false)}
        />
      ) : null}

      <SaveDataPanel open={showSavePanel} onClose={() => setShowSavePanel(false)} />
    </>
  );
}
