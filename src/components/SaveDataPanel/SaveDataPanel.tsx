import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, X, AlertTriangle } from 'lucide-react';
import Modal, { ModalShell } from '@/components/Modal';
import { useToastHost } from '@/components/ToastViewport';
import { clearImportedTripGuard } from '@/store/importedTripGuard';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { recordSlotUndo } from '@/store/slotUndo';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import { useTripSaveStatus } from '@/store/useTripSaveStatus';
import { getDefaultSlotLabel } from '@/store/types';
import type { ExportSource } from '@/lib/xlsx/types';
import { useSettingsStore } from '@/store/settingsStore';
import { usePresence } from '@/lib/motion';
import ImportExportSettingsModal from '@/components/ImportExportSettingsModal';
import { useTranslation } from 'react-i18next';
import DuplicateTripDialog from './DuplicateTripDialog';
import ExportPopover from './ExportPopover';
import ImportConfirmDialog from './ImportConfirmDialog';
import type { InlineEditableTextHandle } from './InlineEditableText';
import PanelModeBanner from './PanelModeBanner';
import { quickSaveActiveTrip, saveActiveTripToSlot, saveCopy, undoSlotWrite } from './saveActions';
import SlotCard, { type SlotCardAction, type SlotCardOverlay } from './SlotCard';
import SlotList from './SlotList';
import SlotMenu from './SlotMenu';
import { useImportTrip } from './useImportTrip';
import { isPickSourceSlot, usePanelMode, type PickPurpose, type PickSource } from './usePanelMode';

interface SaveDataPanelProps {
  open: boolean;
  onClose: () => void;
  onSaveComplete?: () => void;
  onCancelSaveContinuation?: () => void;
  /**
   * `browse` (default) shows the wallet; `pick` opens straight into choosing a slot for the live
   * trip. `pick` is the entry point for the trip page's save split button ("Save to a slot…").
   */
  mode?: 'browse' | 'pick';
}

type ConfirmIntent =
  | { type: 'load'; slotIndex: number }
  | { type: 'clear'; slotIndex: number }
  | { type: 'overwrite'; slotIndex: number; source: PickSource; purpose: PickPurpose }
  | { type: 'imported-quick-save'; slotIndex: number };

type PendingFocus =
  | { type: 'menu'; slotIndex: number }
  | { type: 'trip-name'; slotIndex: number }
  | { type: 'first-target' }
  | { type: 'header-save' };

// Shown in the footer note only. Deliberately not derived from MAX_SAVE_SLOTS: displayed capacity
// may later come from the account (paid or cloud slots) rather than the local slot count.
const DISPLAYED_SLOT_CAPACITY = 3;

const focusCloseButton = (dialog: HTMLElement) => dialog.querySelector<HTMLElement>('.save-panel-close');

function ImportIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" height="14" width="14" aria-hidden="true">
      <path d="M15.056 9.568c-0.208 0-0.407 0.083-0.554 0.23s-0.23 0.346-0.23 0.554v3.136c0 0.208-0.083 0.407-0.23 0.554s-0.346 0.23-0.554 0.23H2.512c-0.208 0-0.407-0.083-0.554-0.23-0.147-0.147-0.23-0.346-0.23-0.554v-3.136c0-0.208-0.083-0.407-0.23-0.554-0.147-0.147-0.346-0.23-0.554-0.23s-0.407 0.083-0.554 0.23c-0.147 0.147-0.23 0.346-0.23 0.554v3.136c0 0.624 0.248 1.222 0.689 1.663 0.441 0.441 1.039 0.689 1.663 0.689h10.976c0.624 0 1.222-0.248 1.663-0.689 0.441-0.441 0.689-1.039 0.689-1.663v-3.136c0-0.208-0.083-0.407-0.23-0.554s-0.346-0.23-0.554-0.23Zm-7.613 1.341c0.075 0.071 0.162 0.127 0.259 0.165 0.094 0.041 0.195 0.063 0.298 0.063 0.103 0 0.204-0.021 0.298-0.063 0.096-0.037 0.184-0.093 0.259-0.165l3.136-3.136c0.148-0.148 0.231-0.348 0.231-0.557s-0.083-0.409-0.231-0.557c-0.148-0.148-0.348-0.231-0.557-0.231s-0.409 0.083-0.557 0.231l-1.795 1.803V0.944c0-0.208-0.083-0.407-0.23-0.554C8.407 0.243 8.208 0.16 8 0.16c-0.208 0-0.407 0.083-0.554 0.23-0.147 0.147-0.23 0.346-0.23 0.554v7.519L5.421 6.659c-0.073-0.073-0.16-0.131-0.255-0.171-0.096-0.039-0.198-0.06-0.301-0.06-0.103 0-0.206 0.02-0.301 0.06-0.095 0.04-0.182 0.098-0.255 0.171-0.073 0.073-0.131 0.16-0.171 0.255-0.04 0.095-0.06 0.198-0.06 0.301 0 0.103 0.02 0.206 0.06 0.301 0.04 0.096 0.098 0.182 0.171 0.255l3.136 3.136Z" fill="currentColor" strokeWidth="0.667"/>
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" height="14" width="14" aria-hidden="true">
      <path d="m5.421 4.635 1.795-1.803v7.519c0 0.208 0.083 0.407 0.23 0.554 0.147 0.147 0.346 0.23 0.554 0.23 0.208 0 0.407-0.083 0.554-0.23 0.147-0.147 0.23-0.346 0.23-0.554V2.831l1.795 1.803c0.073 0.074 0.16 0.132 0.255 0.172 0.096 0.04 0.198 0.06 0.302 0.06s0.206-0.02 0.302-0.06c0.095-0.04 0.182-0.098 0.255-0.172 0.073-0.073 0.132-0.16 0.172-0.255 0.04-0.096 0.06-0.198 0.06-0.301 0-0.104-0.02-0.206-0.06-0.302-0.04-0.096-0.098-0.182-0.172-0.255L8.557 0.385c-0.075-0.071-0.162-0.127-0.259-0.165-0.191-0.078-0.405-0.078-0.596 0-0.096 0.037-0.184 0.093-0.259 0.165l-3.136 3.136c-0.073 0.073-0.131 0.16-0.171 0.255-0.04 0.096-0.06 0.198-0.06 0.301 0 0.103 0.02 0.206 0.06 0.301 0.04 0.095 0.098 0.182 0.171 0.255 0.073 0.073 0.16 0.131 0.255 0.171 0.096 0.04 0.198 0.06 0.301 0.06 0.104 0 0.206-0.02 0.301-0.06 0.095-0.04 0.182-0.098 0.255-0.171Zm9.635 4.931c-0.208 0-0.407 0.083-0.554 0.23s-0.23 0.346-0.23 0.554v3.136c0 0.208-0.083 0.407-0.23 0.554-0.147 0.147-0.346 0.23-0.554 0.23H2.512c-0.208 0-0.407-0.083-0.554-0.23-0.147-0.147-0.23-0.346-0.23-0.554v-3.136c0-0.208-0.083-0.407-0.23-0.554-0.147-0.147-0.346-0.23-0.554-0.23s-0.407 0.083-0.554 0.23c-0.147 0.147-0.23 0.346-0.23 0.554v3.136c0 0.624 0.248 1.222 0.689 1.663 0.441 0.441 1.039 0.689 1.663 0.689h10.976c0.624 0 1.222-0.248 1.663-0.689 0.441-0.441 0.689-1.039 0.689-1.663v-3.136c0-0.208-0.083-0.407-0.23-0.554s-0.346-0.23-0.554-0.23Z" fill="currentColor" strokeWidth="0.667"/>
    </svg>
  );
}

export default function SaveDataPanel({ open, ...props }: SaveDataPanelProps) {
  const { mounted, state } = usePresence(open);
  // Count openings so a reopen during the exit animation still mounts a fresh dialog body.
  const [openCount, setOpenCount] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setOpenCount((count) => count + 1);
  }
  // The dialog body mounts per opening, so its state (mode, continuation flag) resets each time.
  if (!mounted) return null;
  return <SaveDataPanelDialog key={openCount} {...props} state={state} />;
}

function SaveDataPanelDialog({
  onClose,
  onSaveComplete,
  onCancelSaveContinuation,
  mode: initialMode = 'browse',
  state,
}: Omit<SaveDataPanelProps, 'open'> & { state: 'open' | 'closing' }) {
  const { t } = useTranslation();
  const slots = useSaveSlotStore((s) => s.slots);
  const labels = useSaveSlotStore((s) => s.labels ?? []);
  const loadFromSlot = useSaveSlotStore((s) => s.loadFromSlot);
  const clearSlot = useSaveSlotStore((s) => s.clearSlot);
  const swapSlots = useSaveSlotStore((s) => s.swapSlots);
  const renameSlot = useSaveSlotStore((s) => s.renameSlot);
  const renameSlotTrip = useSaveSlotStore((s) => s.renameSlotTrip);

  const tripName = useTripStore((s) => s.tripName);
  const tripId = useTripStore((s) => s.tripId);
  const isDirty = useTripStore((s) => s.isDirty);
  const dateDraftError = useTripStore((s) => s.dateDraftError);
  const loadSnapshot = useTripStore((s) => s.loadSnapshot);
  const markClean = useTripStore((s) => s.markClean);
  const { status, homeSlotIndex, hasUnsavedWork } = useTripSaveStatus();
  const homeCurrency = useSettingsStore((s) => s.preferredCurrency) || 'USD';

  const pushToast = useToastStore((s) => s.pushToast);

  const [mode, dispatchMode] = usePanelMode(initialMode);
  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent | null>(null);
  const [duplicate, setDuplicate] = useState<{ homeIndex: number; targetIndex: number } | null>(null);
  const [menuSlot, setMenuSlot] = useState<number | null>(null);
  // The card whose details drawer is open; only one at a time.
  const [drawerSlot, setDrawerSlot] = useState<number | null>(null);
  const [pendingFocus, setPendingFocus] = useState<PendingFocus | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSession, setExportSession] = useState(0);
  const [exportInitialSource, setExportInitialSource] = useState<ExportSource>({ type: 'active' });
  const saveContinuationCancelledRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importButtonRef = useRef<HTMLButtonElement | null>(null);
  const exportButtonRef = useRef<HTMLButtonElement | null>(null);
  const headerSaveRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tripNameRefs = useRef<(InlineEditableTextHandle | null)[]>([]);
  const seatRefs = useRef<(InlineEditableTextHandle | null)[]>([]);
  // The menu is a single popover; this points it at the trigger of the card it was opened from.
  const menuAnchorRef = useRef<HTMLElement | null>(null);
  // Released as soon as the panel starts closing: it is inert then, so toasts belong elsewhere.
  const toastHostRef = useToastHost(state === 'open');
  const titleId = useId();
  const bodyId = useId();
  const importHintId = useId();
  const exportPopoverId = useId();
  const menuId = useId();
  const editHintId = useId();

  // Rendered from the slots array, not MAX_SAVE_SLOTS, so capacity can change without UI edits.
  const displayLabels = useMemo(
    () => Array.from({ length: slots.length }, (_, index) => labels[index] ?? getDefaultSlotLabel(index)),
    [labels, slots.length]
  );
  const labelOf = useCallback(
    (slotIndex: number) => displayLabels[slotIndex] ?? getDefaultSlotLabel(slotIndex),
    [displayLabels]
  );
  const liveName = tripName || t('untitledTrip');
  const hasHome = homeSlotIndex >= 0;

  const statusText = status.type === 'saved'
    ? t('allChangesSaved', { slot: labelOf(status.slotIndex) })
    : status.type === 'unsaved-changes' || isDirty
      ? t('unsavedChanges')
      : t('notSavedToSlot');
  const filledSlotCount = slots.filter(Boolean).length;

  // Bring the active trip's card into view once, without animating.
  useLayoutEffect(() => {
    const activeCard = listRef.current?.querySelector<HTMLElement>('.slot-card--active');
    activeCard?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, []);

  // A drawer whose slot was emptied (e.g. by an Undo) must not reopen when the slot is filled again.
  useEffect(() => {
    if (drawerSlot !== null && !slots[drawerSlot]) setDrawerSlot(null);
  }, [drawerSlot, slots]);

  // Focus moves that must wait for the next render (a new card, a mode switch, a swap). A passive
  // effect on purpose: it runs after a closing confirm dialog has handed focus back to its opener.
  useEffect(() => {
    if (!pendingFocus) return;
    setPendingFocus(null);
    if (pendingFocus.type === 'menu') menuButtonRefs.current[pendingFocus.slotIndex]?.focus();
    if (pendingFocus.type === 'trip-name') tripNameRefs.current[pendingFocus.slotIndex]?.startEditing();
    if (pendingFocus.type === 'header-save') headerSaveRef.current?.focus();
    if (pendingFocus.type === 'first-target') {
      listRef.current?.querySelector<HTMLElement>('.slot-overlay, .slot-action:not([aria-disabled="true"])')?.focus();
    }
  }, [pendingFocus]);

  const closePopovers = useCallback(() => {
    setMenuSlot(null);
    setExportOpen(false);
  }, []);

  const enterPick = useCallback((source: PickSource, purpose: PickPurpose) => {
    closePopovers();
    setDrawerSlot(null);
    dispatchMode({ type: 'pick', source, purpose });
    setPendingFocus({ type: 'first-target' });
  }, [closePopovers, dispatchMode]);

  const enterMove = useCallback((slotIndex: number) => {
    closePopovers();
    setDrawerSlot(null);
    dispatchMode({ type: 'move', slotIndex });
    setPendingFocus({ type: 'first-target' });
  }, [closePopovers, dispatchMode]);

  const exitMode = useCallback(() => {
    if (mode.type === 'move') setPendingFocus({ type: 'menu', slotIndex: mode.slotIndex });
    else if (mode.type === 'pick') {
      setPendingFocus(mode.source === 'live' ? { type: 'header-save' } : { type: 'menu', slotIndex: mode.source.slotIndex });
    }
    dispatchMode({ type: 'browse' });
  }, [dispatchMode, mode]);

  const cancelSaveContinuation = useCallback(() => {
    saveContinuationCancelledRef.current = true;
    onCancelSaveContinuation?.();
  }, [onCancelSaveContinuation]);

  const continuationArmed = useCallback(
    () => Boolean(onSaveComplete) && !saveContinuationCancelledRef.current,
    [onSaveComplete]
  );

  // Save-continuation contract: after a write of live-trip data, finish the caller's flow (e.g.
  // "Save & start new trip") when it is armed and not cancelled; otherwise confirm with a toast.
  // Returns true when the continuation took over (the caller usually closes the panel then).
  const completeLiveSave = useCallback(
    (slotIndex: number) => {
      if (continuationArmed()) {
        onSaveComplete?.();
        return true;
      }
      pushToast({ type: 'success', title: t('tripSavedTitle'), message: t('tripSavedMessage', { slot: labelOf(slotIndex) }) });
      return false;
    },
    [continuationArmed, labelOf, onSaveComplete, pushToast, t]
  );

  // Quick save to the home slot (header strip and the home card). saveActions shows the toast
  // with Undo unless a continuation takes over.
  const runQuickSave = useCallback(
    (confirmed = false) => {
      const armed = continuationArmed();
      const result = quickSaveActiveTrip({ confirmed, notify: !armed });
      if (result.type === 'needs-confirm') {
        setConfirmIntent({ type: 'imported-quick-save', slotIndex: result.slotIndex });
      } else if (result.type === 'no-home') {
        enterPick('live', 'save');
      } else if (armed && (result.type === 'saved' || result.type === 'already-saved')) {
        // Already saved means nothing is at risk, so the continuation may proceed as well.
        onSaveComplete?.();
      }
    },
    [continuationArmed, enterPick, onSaveComplete]
  );

  const runSaveToSlot = useCallback(
    (slotIndex: number) => {
      const result = saveActiveTripToSlot(slotIndex);
      if (result.type === 'duplicate') {
        setDuplicate({ homeIndex: result.slotIndex, targetIndex: slotIndex });
        return;
      }
      if (result.type !== 'saved') return;
      dispatchMode({ type: 'browse' });
      // The pressed control (an empty card's blank or a pick action) is gone or replaced, so focus
      // moves to the saved card's menu button rather than falling back to <body>.
      if (!completeLiveSave(slotIndex)) setPendingFocus({ type: 'menu', slotIndex });
    },
    [completeLiveSave, dispatchMode]
  );

  const runCopy = useCallback(
    (source: PickSource, targetIndex: number) => {
      let sourceSnapshot;
      if (source === 'live') {
        const trip = useTripStore.getState();
        if (trip.dateDraftError) {
          pushToast({ type: 'warning', title: t('tripDatesNeedAttention'), message: t('invalidTripDateDraft') });
          return;
        }
        sourceSnapshot = trip.getSnapshot();
      } else {
        const slot = useSaveSlotStore.getState().slots[source.slotIndex];
        // The source slot changed while picking (e.g. an Undo emptied it or swapped another trip in):
        // stop picking and say so rather than copying a different trip.
        if (slot?.tripId !== source.tripId) {
          exitMode();
          pushToast(slot
            ? { type: 'warning', title: t('copyFailedTitle'), message: t('copyFailedMessage') }
            : { type: 'warning', title: t('slotEmptyTitle'), message: t('slotEmptyMessage', { slot: labelOf(source.slotIndex) }) });
          return;
        }
        sourceSnapshot = slot.data;
      }

      const result = saveCopy(sourceSnapshot, targetIndex);
      if (!result.ok) {
        pushToast({ type: 'error', title: t('copyFailedTitle'), message: t('copyFailedMessage') });
        return;
      }
      dispatchMode({ type: 'browse' });
      // A copy of the live trip keeps its data safe, so it may finish a continuation; a copy of
      // another slot does not save the live trip and never does.
      if (source === 'live' && continuationArmed()) {
        onSaveComplete?.();
        return;
      }
      pushToast({ type: 'success', title: t('copySavedTitle'), message: t('copySavedMessage', { slot: labelOf(targetIndex) }) });
      setPendingFocus({ type: 'trip-name', slotIndex: targetIndex });
    },
    [continuationArmed, dispatchMode, exitMode, labelOf, onSaveComplete, pushToast, t]
  );

  const { pendingFile, isImporting, selectFile, cancelImport, confirmImport } = useImportTrip({ cancelSaveContinuation });

  const runLoad = useCallback(
    (slotIndex: number) => {
      const slot = slots[slotIndex];
      const snapshot = loadFromSlot(slotIndex);
      if (!snapshot) {
        if (!slot) {
          pushToast({
            type: 'warning',
            title: t('slotEmptyTitle'),
            message: t('slotEmptyMessage', { slot: labelOf(slotIndex) }),
          });
        }
        return;
      }

      cancelSaveContinuation();
      loadSnapshot(snapshot);
      markClean();
      clearImportedTripGuard();
      pushToast({
        type: 'success',
        title: t('tripLoadedTitle'),
        message: t('tripLoadedMessage', { trip: snapshot.tripName || labelOf(slotIndex) }),
      });
    },
    [cancelSaveContinuation, labelOf, loadFromSlot, loadSnapshot, markClean, pushToast, slots, t]
  );

  const runClear = useCallback(
    (slotIndex: number) => {
      clearSlot(slotIndex);
      pushToast({
        type: 'success',
        title: t('slotClearedTitle'),
        message: t('slotClearedMessage', { slot: labelOf(slotIndex) }),
      });
    },
    [clearSlot, labelOf, pushToast, t]
  );

  // Move/swap: no confirm, an Undo toast instead. Labels stay with their positions.
  const runMove = useCallback(
    (fromIndex: number, toIndex: number) => {
      const store = useSaveSlotStore.getState();
      const targetFilled = Boolean(store.slots[toIndex]);
      const movedName = store.slots[fromIndex]?.tripName || t('untitledTrip');
      const handle = recordSlotUndo(() => {
        swapSlots(fromIndex, toIndex);
        return true;
      });
      dispatchMode({ type: 'browse' });
      setPendingFocus({ type: 'menu', slotIndex: toIndex });
      if (!handle) return;
      pushToast({
        type: 'success',
        title: targetFilled ? t('slotsSwappedTitle') : t('tripMovedTitle'),
        message: targetFilled
          ? t('swappedSlots', { first: labelOf(fromIndex), second: labelOf(toIndex) })
          : t('movedToSlot', { trip: movedName, slot: labelOf(toIndex) }),
        action: { label: t('undo'), onAction: () => { undoSlotWrite(handle); } },
      });
    },
    [dispatchMode, labelOf, pushToast, swapSlots, t]
  );

  const handleLoadClick = useCallback(
    (slotIndex: number) => {
      if (hasUnsavedWork || dateDraftError) {
        setConfirmIntent({ type: 'load', slotIndex });
        return;
      }
      runLoad(slotIndex);
    },
    [dateDraftError, hasUnsavedWork, runLoad]
  );

  // Renaming the home card's trip renames the live trip too (always written through, even when the
  // live trip has other unsaved edits). savedAt is not bumped. When the pair was clean and in sync
  // before, it is marked clean again so the rename alone never reads as "unsaved changes"; when the
  // live trip was dirty, its dirty flag is left as it is.
  const handleRenameTrip = useCallback(
    (slotIndex: number, name: string) => {
      const slot = useSaveSlotStore.getState().slots[slotIndex];
      if (!slot) return;
      const trip = useTripStore.getState();
      const isLive = slot.tripId === trip.tripId;
      const wasCleanAndSaved = isLive && !trip.isDirty && status.type === 'saved' && status.slotIndex === slotIndex;
      if (!renameSlotTrip(slotIndex, name)) return;
      if (!isLive) return;
      trip.setTripName(useSaveSlotStore.getState().slots[slotIndex]?.tripName ?? name);
      if (wasCleanAndSaved) useTripStore.getState().markClean();
    },
    [renameSlotTrip, status]
  );

  // ── Import: the button opens the file picker at once; the rate mode is chosen in the confirm step ──
  const handleImportClick = useCallback(() => {
    if (isImporting) return;
    fileInputRef.current?.click();
  }, [isImporting]);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset the input so re-selecting the same file triggers onChange
      e.target.value = '';
      if (file) selectFile(file);
    },
    [selectFile],
  );

  // ── Export: popover anchored to the footer button; also opened per slot from the card menu ──
  const openExport = useCallback((source: ExportSource = { type: 'active' }) => {
    setExportInitialSource(source);
    setExportSession((session) => session + 1);
    setExportOpen(true);
  }, []);
  const closeExport = useCallback(() => setExportOpen(false), []);

  const toggleMenu = useCallback((slotIndex: number) => {
    setExportOpen(false);
    setMenuSlot((current) => {
      if (current === slotIndex) return null;
      menuAnchorRef.current = menuButtonRefs.current[slotIndex] ?? null;
      return slotIndex;
    });
  }, []);
  const closeMenu = useCallback(() => setMenuSlot(null), []);

  const handleConfirmAction = useCallback(() => {
    if (!confirmIntent) {
      return;
    }
    setConfirmIntent(null);

    if (confirmIntent.type === 'load') runLoad(confirmIntent.slotIndex);
    if (confirmIntent.type === 'clear') runClear(confirmIntent.slotIndex);
    if (confirmIntent.type === 'imported-quick-save') runQuickSave(true);
    if (confirmIntent.type === 'overwrite') {
      if (confirmIntent.purpose === 'copy') runCopy(confirmIntent.source, confirmIntent.slotIndex);
      else runSaveToSlot(confirmIntent.slotIndex);
    }
  }, [confirmIntent, runClear, runCopy, runLoad, runQuickSave, runSaveToSlot]);

  // Escape leaves move/pick mode first; ModalShell skips an Escape that was already handled.
  const handlePanelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Escape' || event.defaultPrevented || mode.type === 'browse') return;
      event.preventDefault();
      exitMode();
    },
    [exitMode, mode.type]
  );

  // ── Per-card action, note and overlay for the current mode ──
  const cardState = (slotIndex: number): { action: SlotCardAction | null; note?: string; overlay?: SlotCardOverlay | null } => {
    const slot = slots[slotIndex] ?? null;
    const isHome = slot?.tripId === tripId;

    if (mode.type === 'move') {
      if (slotIndex === mode.slotIndex) return { action: null };
      return {
        action: null,
        overlay: {
          title: slot ? t('swapHere') : t('moveHere'),
          detail: slot ? t('swapWithSlot', { slot: labelOf(slotIndex) }) : t('moveToSlot', { slot: labelOf(slotIndex) }),
          onChoose: () => runMove(mode.slotIndex, slotIndex),
        },
      };
    }

    if (mode.type === 'pick') {
      const { source, purpose } = mode;
      const copying = purpose === 'copy' || hasHome;
      if (isPickSourceSlot(mode, slotIndex) || (purpose === 'copy' && source === 'live' && isHome)) {
        return { action: null, note: t('copyingFromHere') };
      }
      if (!slot) {
        return copying
          ? { action: { label: t('saveCopyHere'), variant: 'primary', onClick: () => runCopy(source, slotIndex) } }
          : { action: { label: t('saveHere'), variant: 'primary', onClick: () => runSaveToSlot(slotIndex) } };
      }
      if (isHome && purpose === 'save') {
        return { action: { label: t('updateHere'), variant: 'primary', onClick: () => runSaveToSlot(slotIndex) } };
      }
      // With a home slot, another filled slot can only take a copy (the trip ID lives in one slot),
      // so this asks one question ("replace it with a copy?") instead of a confirm then a duplicate.
      return {
        action: {
          label: t('overwriteEllipsis'),
          variant: 'load',
          onClick: () => setConfirmIntent({ type: 'overwrite', slotIndex, source, purpose: copying ? 'copy' : purpose }),
        },
      };
    }

    if (!slot) {
      return hasHome
        ? { action: { label: t('saveCopyHere'), variant: 'plain', onClick: () => runCopy('live', slotIndex) } }
        : { action: { label: t('saveCurrentTripHere'), variant: 'plain', onClick: () => runSaveToSlot(slotIndex) } };
    }
    if (isHome) {
      const saved = status.type === 'saved';
      return {
        action: {
          label: saved ? t('savedButton') : t('save'),
          variant: 'primary',
          inactive: saved,
          onClick: () => runQuickSave(),
        },
      };
    }
    return { action: { label: t('load'), variant: 'load', onClick: () => handleLoadClick(slotIndex) } };
  };

  const pickSourceName = (source: PickSource) =>
    source === 'live' ? liveName : slots[source.slotIndex]?.tripName || t('untitledTrip');

  let banner = null;
  if (mode.type === 'pick') {
    const message = mode.purpose === 'copy'
      ? t('chooseSlotForCopy', { name: pickSourceName(mode.source) })
      : hasHome
        ? t('tripAlreadyInSlot', { slot: labelOf(homeSlotIndex) })
        : t('chooseSlotFor', { trip: liveName });
    // Future: when no slot is empty, a `detail` line here says "All slots are full" and carries the
    // upgrade CTA (more or cloud slots), the same hook as the locked slot card.
    banner = <PanelModeBanner variant="pick" message={message} onCancel={exitMode} />;
  } else if (mode.type === 'move') {
    const movingName = slots[mode.slotIndex]?.tripName || t('untitledTrip');
    banner = <PanelModeBanner variant="move" message={t('movingTripBanner', { trip: movingName })} onCancel={exitMode} />;
  }

  const confirmCopy = (() => {
    if (!confirmIntent) return null;
    if (confirmIntent.type === 'load') {
      return { title: t('loadSavedTripTitle'), body: t(dateDraftError ? 'loadTripWithInvalidDateBody' : 'loadTripBody') };
    }
    if (confirmIntent.type === 'clear') return { title: t('clearSlotTitle'), body: t('clearSlotBody') };
    if (confirmIntent.type === 'imported-quick-save') {
      const slot = labelOf(confirmIntent.slotIndex);
      return { title: t('overwriteImportedTripTitle', { slot }), body: t('overwriteImportedTripBody', { slot }) };
    }
    const saved = slots[confirmIntent.slotIndex]?.tripName || t('untitledTrip');
    const slot = labelOf(confirmIntent.slotIndex);
    return {
      title: t('overwriteSlotTitle'),
      body: confirmIntent.purpose === 'copy'
        ? t('overwriteSlotWithCopyBody', { slot, saved, trip: pickSourceName(confirmIntent.source) })
        : t('overwriteSlotWithTripBody', { slot, saved, trip: liveName }),
    };
  })();

  const menuSlotData = menuSlot === null ? null : slots[menuSlot] ?? null;

  return (
    <>
      <ModalShell
        onClose={onClose}
        labelledBy={titleId}
        describedBy={bodyId}
        className="save-panel"
        overlayClassName="save-panel-overlay"
        state={state}
        initialFocus={focusCloseButton}
      >
        {/* display: contents, so the sections below stay the dialog's flex children. */}
        <div className="save-panel-content" onKeyDown={handlePanelKeyDown}>
          <header className="save-panel-header">
            <div className="save-panel-header-top">
              <h2 id={titleId} className="save-panel-title">{t('saveDataSlots')}</h2>
              <button type="button" className="save-panel-close" onClick={onClose} aria-label={t('closeSaveDataPanel')}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="save-panel-strip">
              <p className="save-panel-strip-info" id={bodyId}>
                <span className="save-panel-kicker">{t('activeTrip')}</span>
                <bdi className="save-panel-strip-name" dir="auto">{liveName}</bdi>
                {/* One flex item for the label and the ID, so the strip's gap never splits them. */}
                <span>{t('tripId')} <bdi dir="ltr">{tripId}</bdi></span>
                <span className="save-panel-status" role="status" data-state={status.type}>{statusText}</span>
              </p>
              {/* With a home slot: quick save there. Without one: choose a slot (pick mode). */}
              <button
                ref={headerSaveRef}
                type="button"
                className="save-panel-btn is-primary save-panel-strip-save"
                onClick={() => (hasHome ? runQuickSave() : enterPick('live', 'save'))}
              >
                {hasHome ? t('save') : t('saveEllipsis')}
              </button>
            </div>
          </header>

          {banner}
          <span className="sr-only" id={editHintId}>{t('activateToRename')}</span>

          <div ref={listRef} className="save-panel-list" data-mode={mode.type}>
            <SlotList mode={mode.type}>
              {slots.map((slot, slotIndex) => {
                const { action, note, overlay } = cardState(slotIndex);
                const isSource =
                  (mode.type === 'move' && mode.slotIndex === slotIndex) || note !== undefined;
                return (
                  <SlotCard
                    key={slotIndex}
                    slotIndex={slotIndex}
                    slot={slot}
                    label={labelOf(slotIndex)}
                    isActiveTrip={slot?.tripId === tripId}
                    homeCurrency={homeCurrency}
                    action={action}
                    note={note}
                    overlay={overlay}
                    isSource={isSource}
                    inert={mode.type === 'move'}
                    menuHidden={mode.type !== 'browse'}
                    menuOpen={menuSlot === slotIndex}
                    menuId={menuId}
                    menuButtonRef={(element) => { menuButtonRefs.current[slotIndex] = element; }}
                    onMenuToggle={() => toggleMenu(slotIndex)}
                    tripNameRef={(handle) => { tripNameRefs.current[slotIndex] = handle; }}
                    seatRef={(handle) => { seatRefs.current[slotIndex] = handle; }}
                    onRenameTrip={(name) => handleRenameTrip(slotIndex, name)}
                    onRenameSlot={(label) => renameSlot(slotIndex, label)}
                    editHintId={editHintId}
                    drawerOpen={drawerSlot === slotIndex && slot !== null}
                    onDrawerToggle={(open) => setDrawerSlot(open ? slotIndex : null)}
                  />
                );
              })}
            </SlotList>
          </div>

          <footer className="save-panel-footer">
            <span className="save-panel-note">
              {t('slotUsageNote', { count: filledSlotCount, total: DISPLAYED_SLOT_CAPACITY })}
            </span>
            <button
              ref={importButtonRef}
              type="button"
              className="save-panel-btn"
              onClick={handleImportClick}
              disabled={isImporting}
              aria-busy={isImporting}
              aria-describedby={importHintId}
            >
              <ImportIcon />
              {t('import')}
            </button>
            <span className="sr-only" id={importHintId}>{t('importHint')}</span>
            <button
              ref={exportButtonRef}
              type="button"
              className="save-panel-btn"
              aria-haspopup="dialog"
              aria-expanded={exportOpen}
              aria-controls={exportOpen ? exportPopoverId : undefined}
              onClick={() => {
                setMenuSlot(null);
                if (exportOpen) closeExport();
                else openExport();
              }}
            >
              <ExportIcon />
              {t('export')}
              <ChevronDown size={14} aria-hidden="true" className="save-panel-btn-chevron" />
            </button>
          </footer>

          {/* Popovers live here, outside the scrolling list, so the scroller never clips them. */}
          <div className="save-panel-layer">
            <ExportPopover
              key={exportSession}
              open={exportOpen}
              onClose={closeExport}
              anchorRef={exportButtonRef}
              id={exportPopoverId}
              initialSource={exportInitialSource}
              slots={slots}
              displayLabels={displayLabels}
              onOpenSettings={() => setSettingsModalOpen(true)}
              settingsOpen={settingsModalOpen}
            />
            <SlotMenu
              open={menuSlot !== null}
              onClose={closeMenu}
              anchorRef={menuAnchorRef}
              scrollContainerRef={listRef}
              id={menuId}
              label={menuSlot === null ? '' : labelOf(menuSlot)}
              filled={Boolean(menuSlotData)}
              onRename={() => { if (menuSlot !== null) seatRefs.current[menuSlot]?.startEditing(); }}
              onExport={() => { if (menuSlot !== null) openExport({ type: 'slot', slotIndex: menuSlot }); }}
              onMove={() => { if (menuSlot !== null) enterMove(menuSlot); }}
              onSaveCopy={() => {
                if (menuSlot === null) return;
                // A copy of the home card is a copy of the live trip, unsaved edits included.
                if (!menuSlotData) return;
                enterPick(menuSlotData.tripId === tripId ? 'live' : { slotIndex: menuSlot, tripId: menuSlotData.tripId }, 'copy');
              }}
              onClear={() => { if (menuSlot !== null) setConfirmIntent({ type: 'clear', slotIndex: menuSlot }); }}
            />
          </div>

          {/* Toasts render here while the panel is open, inside its focus trap (Undo is reachable). */}
          <div ref={toastHostRef} className="save-panel-toast-host" />
        </div>
      </ModalShell>

      {/* Never a tab stop, so it stays outside the dialog and out of the focus trap's reach. */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="save-panel-file-input"
        onChange={handleImportFile}
        tabIndex={-1}
        aria-hidden="true"
      />

      {settingsModalOpen ? (
        <ImportExportSettingsModal onClose={() => setSettingsModalOpen(false)} />
      ) : null}

      {pendingFile ? (
        <ImportConfirmDialog
          fileName={pendingFile.name}
          defaultMode={useSettingsStore.getState().importExchangeRateMode}
          replaceWarning={dateDraftError ? 'invalid-date' : hasUnsavedWork ? 'unsaved' : 'none'}
          busy={isImporting}
          onConfirm={(rateMode) => { void confirmImport(rateMode); }}
          onCancel={cancelImport}
          returnFocusRef={importButtonRef}
        />
      ) : null}

      {duplicate ? (
        <DuplicateTripDialog
          homeLabel={labelOf(duplicate.homeIndex)}
          targetLabel={labelOf(duplicate.targetIndex)}
          onOverwriteHome={() => {
            setDuplicate(null);
            runSaveToSlot(duplicate.homeIndex);
          }}
          onSaveCopy={() => {
            setDuplicate(null);
            runCopy('live', duplicate.targetIndex);
          }}
          onCancel={() => setDuplicate(null)}
        />
      ) : null}

      {confirmIntent && confirmCopy ? (
        <Modal
          icon={AlertTriangle}
          title={confirmCopy.title}
          body={confirmCopy.body}
          confirmLabel={t('confirm')}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmIntent(null)}
        />
      ) : null}
    </>
  );
}
