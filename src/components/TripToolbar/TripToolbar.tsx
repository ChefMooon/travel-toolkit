import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Undo2, Redo2 } from 'lucide-react';
import NumericInput from '@/components/NumericInput/NumericInput';
import { useTripStore } from '@/store/tripStore';
import { useToastStore } from '@/store/toastStore';
import Modal from '@/components/Modal';
import { getDefaultSlotLabel, MAX_TRIP_NAME_LENGTH } from '@/store/types';
import {
  getTripSaveStatus,
  useSaveSlotStore,
  type TripSaveStatus,
} from '@/store/saveSlotStore';
import SaveDataPanel from '@/components/SaveDataPanel';
import Tooltip from '@/components/Tooltip';
import { useDraftStore } from '@/store/draftStore';

function getTripSaveStatusMessage(
  status: TripSaveStatus,
  slots: ReturnType<typeof useSaveSlotStore.getState>['slots'],
  labels: ReturnType<typeof useSaveSlotStore.getState>['labels']
): string {
  if (status.type === 'not-saved') {
    return status.hasUnsavedChanges
      ? 'This trip has unsaved changes and has not been saved to a slot.'
      : 'This trip has not been saved to a slot.';
  }

  const slotLabel =
    slots[status.slotIndex]?.label ??
    labels[status.slotIndex] ??
    getDefaultSlotLabel(status.slotIndex);

  if (status.type === 'saved') {
    return `This trip is saved in ${slotLabel}. There are no unsaved changes.`;
  }

  return `This trip has unsaved changes. The last saved version is in ${slotLabel}.`;
}

export default function TripToolbar() {
  const tripId = useTripStore((s) => s.tripId);
  const setTripId = useTripStore((s) => s.setTripId);
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const setGlobalMarkup = useTripStore((s) => s.setGlobalMarkup);
  const isDirty = useTripStore((s) => s.isDirty);
  const canUndo = useTripStore((s) => s.canUndo);
  const canRedo = useTripStore((s) => s.canRedo);
  const undo = useTripStore((s) => s.undo);
  const redo = useTripStore((s) => s.redo);
  const getSnapshot = useTripStore((s) => s.getSnapshot);
  const resetTrip = useTripStore((s) => s.resetTrip);
  const slots = useSaveSlotStore((s) => s.slots);
  const labels = useSaveSlotStore((s) => s.labels);
  const pushToast = useToastStore((s) => s.pushToast);
  const setDraft = useDraftStore((s) => s.setDraft);

  const [showReset, setShowReset] = useState(false);
  const [tripSaveStatus, setTripSaveStatus] = useState<TripSaveStatus | null>(null);
  const [showSavePanel, setShowSavePanel] = useState(false);
  const [saveContinuationArmed, setSaveContinuationArmed] = useState(false);
  const [tripNameFocused, setTripNameFocused] = useState(false);
  const [tripIdInput, setTripIdInput] = useState(tripId);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupInput, setMarkupInput] = useState(String(globalMarkup));
  const saveContinuationArmedRef = useRef(false);
  const savePanelOpenedFromNewTripRef = useRef(false);

  useEffect(() => {
    setTripIdInput(tripId);
  }, [tripId]);

  useEffect(() => {
    setDraft('trip-id', tripIdInput !== tripId);
    return () => setDraft('trip-id', false);
  }, [setDraft, tripId, tripIdInput]);

  useEffect(() => {
    setDraft('trip-markup', editingMarkup && markupInput !== String(globalMarkup));
    return () => setDraft('trip-markup', false);
  }, [editingMarkup, globalMarkup, markupInput, setDraft]);

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

  const handleOpenNewTripDecision = useCallback(() => {
    setTripSaveStatus(getTripSaveStatus(slots, getSnapshot(), isDirty));
    setShowReset(true);
  }, [getSnapshot, isDirty, slots]);

  const clearSaveContinuation = useCallback(() => {
    saveContinuationArmedRef.current = false;
    setSaveContinuationArmed(false);
  }, []);

  const handleSaveAndStartNewTrip = useCallback(() => {
    saveContinuationArmedRef.current = true;
    setSaveContinuationArmed(true);
    savePanelOpenedFromNewTripRef.current = true;
    setShowReset(false);
    setShowSavePanel(true);
  }, []);

  const handleSaveComplete = useCallback(() => {
    if (!saveContinuationArmedRef.current) {
      return;
    }

    saveContinuationArmedRef.current = false;
    setSaveContinuationArmed(false);
    savePanelOpenedFromNewTripRef.current = false;
    setShowSavePanel(false);
    setShowReset(false);
    resetTrip();
    pushToast({
      type: 'success',
      title: 'Saved and started new trip',
      message: 'Your current trip was saved before starting a new one.',
    });
  }, [pushToast, resetTrip]);

  const handleCancelSaveContinuation = useCallback(() => {
    clearSaveContinuation();
  }, [clearSaveContinuation]);

  const handleSavePanelClose = useCallback(() => {
    const returnToNewTripDecision = savePanelOpenedFromNewTripRef.current;
    savePanelOpenedFromNewTripRef.current = false;
    clearSaveContinuation();
    setShowSavePanel(false);
    setShowReset(returnToNewTripDecision);
  }, [clearSaveContinuation]);

  const handleOpenSavePanel = useCallback(() => {
    savePanelOpenedFromNewTripRef.current = false;
    clearSaveContinuation();
    setShowSavePanel(true);
  }, [clearSaveContinuation]);

  const handleStartFreshWithoutSaving = useCallback(() => {
    savePanelOpenedFromNewTripRef.current = false;
    clearSaveContinuation();
    resetTrip();
    setShowReset(false);
  }, [clearSaveContinuation, resetTrip]);

  const handleCancelNewTripDecision = useCallback(() => {
    savePanelOpenedFromNewTripRef.current = false;
    clearSaveContinuation();
    setShowReset(false);
  }, [clearSaveContinuation]);

  const tripSaveStatusMessage = tripSaveStatus
    ? getTripSaveStatusMessage(tripSaveStatus, slots, labels)
    : '';
  const currentTripIsSaved = tripSaveStatus?.type === 'saved';
  const newTripDialogBody =
    currentTripIsSaved
      ? `${tripSaveStatusMessage} You can start a new trip without saving again.`
      : `${tripSaveStatusMessage} Save the current trip before starting a new one, or start fresh without saving. Starting fresh permanently deletes the current trip data.`;

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
          <div className="trip-history-controls" role="group" aria-label="Trip history">
            <Tooltip content="Undo (Ctrl+Z or Command+Z)">
              <button type="button" aria-label="Undo" disabled={!canUndo} onClick={undo}><Undo2 size={16} /></button>
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Y, Ctrl+Shift+Z, or Command+Shift+Z)">
              <button type="button" aria-label="Redo" disabled={!canRedo} onClick={redo}><Redo2 size={16} /></button>
            </Tooltip>
          </div>
          {editingMarkup ? (
            <div className="markup-pill markup-pill--editing" role="group" aria-label="Markup editor">
              <span>Markup</span>
              <NumericInput
                className="markup-num"
                step="0.1"
                shiftSteps={10}
                acceleratedSteps={100}
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

          <Tooltip content="New Trip">
            <button
              type="button"
              className="btn-new-trip"
              onClick={handleOpenNewTripDecision}
              aria-label="Start new trip"
            >
              <RotateCcw size={12} /> <span>New Trip</span>
            </button>
          </Tooltip>

          <Tooltip content="Save slots">
            <button
              type="button"
              className="btn-save-panel"
              data-dirty={isDirty ? 'true' : 'false'}
              onClick={handleOpenSavePanel}
              aria-label="Open save slots"
            >
              <img src="/save.svg" alt="" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </header>

      {showReset ? (
        <Modal
          icon="🗑️"
          title="Start a new trip?"
          body={newTripDialogBody}
          secondaryActionLabel={currentTripIsSaved ? undefined : 'Save & Start New Trip'}
          onSecondaryAction={currentTripIsSaved ? undefined : handleSaveAndStartNewTrip}
          confirmLabel={currentTripIsSaved ? 'Start New Trip' : 'Start Fresh Without Saving'}
          onConfirm={handleStartFreshWithoutSaving}
          onCancel={handleCancelNewTripDecision}
        />
      ) : null}

      <SaveDataPanel
        open={showSavePanel}
        onClose={handleSavePanelClose}
        onSaveComplete={saveContinuationArmed ? handleSaveComplete : undefined}
        onCancelSaveContinuation={
          saveContinuationArmed ? handleCancelSaveContinuation : undefined
        }
      />
    </>
  );
}
