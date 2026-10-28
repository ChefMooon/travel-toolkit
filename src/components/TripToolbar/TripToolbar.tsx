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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

function getTripSaveStatusMessage(
  status: TripSaveStatus,
  slots: ReturnType<typeof useSaveSlotStore.getState>['slots'],
  labels: ReturnType<typeof useSaveSlotStore.getState>['labels'],
  t: TFunction,
): string {
  if (status.type === 'not-saved') {
    return status.hasUnsavedChanges
      ? t('unsavedTripStatus')
      : t('notSavedTripStatus');
  }

  const slotLabel =
    slots[status.slotIndex]?.label ??
    labels[status.slotIndex] ??
    getDefaultSlotLabel(status.slotIndex);

  if (status.type === 'saved') {
    return t('savedTripStatus', { slot: slotLabel });
  }

  return t('changedSavedTripStatus', { slot: slotLabel });
}

export default function TripToolbar() {
  const { t } = useTranslation();
  const tripId = useTripStore((s) => s.tripId);
  const setTripId = useTripStore((s) => s.setTripId);
  const tripName = useTripStore((s) => s.tripName);
  const setTripName = useTripStore((s) => s.setTripName);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const setGlobalMarkup = useTripStore((s) => s.setGlobalMarkup);
  const isDirty = useTripStore((s) => s.isDirty);
  const dateDraftError = useTripStore((s) => s.dateDraftError);
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
    const dateDraftError = useTripStore.getState().dateDraftError;
    if (dateDraftError) {
      pushToast({ type: 'warning', title: t('tripDatesNeedAttention'), message: t('invalidTripDateDraft') });
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
      title: t('savedAndStartedNewTrip'),
      message: t('savedBeforeNewTrip'),
    });
  }, [pushToast, resetTrip, t]);

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
    const dateDraftError = useTripStore.getState().dateDraftError;
    if (dateDraftError) {
      pushToast({ type: 'warning', title: t('tripDatesNeedAttention'), message: t('discardDateDraftWarning') });
    }
    savePanelOpenedFromNewTripRef.current = false;
    clearSaveContinuation();
    resetTrip();
    setShowReset(false);
  }, [clearSaveContinuation, pushToast, resetTrip, t]);

  const handleCancelNewTripDecision = useCallback(() => {
    savePanelOpenedFromNewTripRef.current = false;
    clearSaveContinuation();
    setShowReset(false);
  }, [clearSaveContinuation]);

  const tripSaveStatusMessage = tripSaveStatus
    ? getTripSaveStatusMessage(tripSaveStatus, slots, labels, t)
    : '';
  const currentTripIsSaved = tripSaveStatus?.type === 'saved';
  const newTripDialogBody =
    currentTripIsSaved
      ? `${tripSaveStatusMessage} ${t('newTripSavedPrompt')}`
      : `${tripSaveStatusMessage} ${t('newTripUnsavedPrompt')}`;
  const guardedNewTripDialogBody = dateDraftError
    ? `${newTripDialogBody} ${t('invalidDateDraftPrompt')}`
    : newTripDialogBody;

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
              aria-label={t('tripName')}
            />
            {tripNameFocused && tripName ? (
              <button
                type="button"
                className="trip-pill-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setTripName('');
                }}
                aria-label={t('clearTripName')}
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
            <span className="trip-id-pill-label">{t('tripId')}</span>
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
              aria-label={t('tripId')}
            />
          </div>
        </div>

        <div className="trip-toolbar-right">
          <div className="trip-history-controls" role="group" aria-label={t('tripHistory')}>
            <Tooltip content={t('undoTip')}>
              <button type="button" aria-label={t('undo')} disabled={!canUndo} onClick={undo}><Undo2 size={16} /></button>
            </Tooltip>
            <Tooltip content={t('redoTip')}>
              <button type="button" aria-label={t('redo')} disabled={!canRedo} onClick={redo}><Redo2 size={16} /></button>
            </Tooltip>
          </div>
          {editingMarkup ? (
            <div className="markup-pill markup-pill--editing" role="group" aria-label={t('markupEditor')}>
              <span>{t('markup')}</span>
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
                aria-label={t('markupPercentage')}
              />
            </div>
          ) : (
            <button type="button" className="markup-pill" onClick={() => setEditingMarkup(true)}>
              <span>{t('markup')}</span>
              <span className="markup-num">{globalMarkup}%</span>
            </button>
          )}

          <Tooltip content={t('newTrip')}>
            <button
              type="button"
              className="btn-new-trip"
              onClick={handleOpenNewTripDecision}
              aria-label={t('startNewTrip')}
            >
              <RotateCcw size={12} /> <span>{t('newTrip')}</span>
            </button>
          </Tooltip>

          <Tooltip content={t('saveSlots')}>
            <button
              type="button"
              className="btn-save-panel"
              data-dirty={isDirty ? 'true' : 'false'}
              onClick={handleOpenSavePanel}
              aria-label={t('openSaveSlots')}
            >
              <img src="/save.svg" alt="" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </header>

      {showReset ? (
        <Modal
          icon="🗑️"
          title={t('startNewTripTitle')}
          body={guardedNewTripDialogBody}
          secondaryActionLabel={currentTripIsSaved ? undefined : t('saveAndStartNewTrip')}
          onSecondaryAction={currentTripIsSaved ? undefined : handleSaveAndStartNewTrip}
          confirmLabel={currentTripIsSaved ? t('startNewTripConfirm') : t('startFreshNoSave')}
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
