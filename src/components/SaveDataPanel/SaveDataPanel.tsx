import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, ChevronDown, Edit2, RotateCcw, X } from 'lucide-react';
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
import type { ExportSchema, ExportSource, FileNamePreset } from '@/lib/xlsx/types';
import { useSettingsStore } from '@/store/settingsStore';
import ImportExportSettingsModal from '@/components/ImportExportSettingsModal';
import CogIcon from '@/components/ImportExportSettingsModal/CogIcon';

interface SaveDataPanelProps {
  open: boolean;
  onClose: () => void;
  onSaveComplete?: () => void;
  onCancelSaveContinuation?: () => void;
}

type ConfirmIntent =
  | { type: 'load'; slotIndex: number }
  | { type: 'overwrite'; slotIndex: number }
  | { type: 'clear'; slotIndex: number }
  | { type: 'import' }
  | { type: 'swap'; firstSlotIndex: number; secondSlotIndex: number };

type ImportRateMode = 'hybrid' | 'keep-imported' | 'refresh-live';

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

function ImportIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" height="14" width="14">
      <path d="M15.056 9.568c-0.208 0-0.407 0.083-0.554 0.23s-0.23 0.346-0.23 0.554v3.136c0 0.208-0.083 0.407-0.23 0.554s-0.346 0.23-0.554 0.23H2.512c-0.208 0-0.407-0.083-0.554-0.23-0.147-0.147-0.23-0.346-0.23-0.554v-3.136c0-0.208-0.083-0.407-0.23-0.554-0.147-0.147-0.346-0.23-0.554-0.23s-0.407 0.083-0.554 0.23c-0.147 0.147-0.23 0.346-0.23 0.554v3.136c0 0.624 0.248 1.222 0.689 1.663 0.441 0.441 1.039 0.689 1.663 0.689h10.976c0.624 0 1.222-0.248 1.663-0.689 0.441-0.441 0.689-1.039 0.689-1.663v-3.136c0-0.208-0.083-0.407-0.23-0.554s-0.346-0.23-0.554-0.23Zm-7.613 1.341c0.075 0.071 0.162 0.127 0.259 0.165 0.094 0.041 0.195 0.063 0.298 0.063 0.103 0 0.204-0.021 0.298-0.063 0.096-0.037 0.184-0.093 0.259-0.165l3.136-3.136c0.148-0.148 0.231-0.348 0.231-0.557s-0.083-0.409-0.231-0.557c-0.148-0.148-0.348-0.231-0.557-0.231s-0.409 0.083-0.557 0.231l-1.795 1.803V0.944c0-0.208-0.083-0.407-0.23-0.554C8.407 0.243 8.208 0.16 8 0.16c-0.208 0-0.407 0.083-0.554 0.23-0.147 0.147-0.23 0.346-0.23 0.554v7.519L5.421 6.659c-0.073-0.073-0.16-0.131-0.255-0.171-0.096-0.039-0.198-0.06-0.301-0.06-0.103 0-0.206 0.02-0.301 0.06-0.095 0.04-0.182 0.098-0.255 0.171-0.073 0.073-0.131 0.16-0.171 0.255-0.04 0.095-0.06 0.198-0.06 0.301 0 0.103 0.02 0.206 0.06 0.301 0.04 0.096 0.098 0.182 0.171 0.255l3.136 3.136Z" fill="currentColor" strokeWidth="0.667"/>
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" height="14" width="14">
      <path d="m5.421 4.635 1.795-1.803v7.519c0 0.208 0.083 0.407 0.23 0.554 0.147 0.147 0.346 0.23 0.554 0.23 0.208 0 0.407-0.083 0.554-0.23 0.147-0.147 0.23-0.346 0.23-0.554V2.831l1.795 1.803c0.073 0.074 0.16 0.132 0.255 0.172 0.096 0.04 0.198 0.06 0.302 0.06s0.206-0.02 0.302-0.06c0.095-0.04 0.182-0.098 0.255-0.172 0.073-0.073 0.132-0.16 0.172-0.255 0.04-0.096 0.06-0.198 0.06-0.301 0-0.104-0.02-0.206-0.06-0.302-0.04-0.096-0.098-0.182-0.172-0.255L8.557 0.385c-0.075-0.071-0.162-0.127-0.259-0.165-0.191-0.078-0.405-0.078-0.596 0-0.096 0.037-0.184 0.093-0.259 0.165l-3.136 3.136c-0.073 0.073-0.131 0.16-0.171 0.255-0.04 0.096-0.06 0.198-0.06 0.301 0 0.103 0.02 0.206 0.06 0.301 0.04 0.095 0.098 0.182 0.171 0.255 0.073 0.073 0.16 0.131 0.255 0.171 0.096 0.04 0.198 0.06 0.301 0.06 0.104 0 0.206-0.02 0.301-0.06 0.095-0.04 0.182-0.098 0.255-0.171Zm9.635 4.931c-0.208 0-0.407 0.083-0.554 0.23s-0.23 0.346-0.23 0.554v3.136c0 0.208-0.083 0.407-0.23 0.554-0.147 0.147-0.346 0.23-0.554 0.23H2.512c-0.208 0-0.407-0.083-0.554-0.23-0.147-0.147-0.23-0.346-0.23-0.554v-3.136c0-0.208-0.083-0.407-0.23-0.554-0.147-0.147-0.346-0.23-0.554-0.23s-0.407 0.083-0.554 0.23c-0.147 0.147-0.23 0.346-0.23 0.554v3.136c0 0.624 0.248 1.222 0.689 1.663 0.441 0.441 1.039 0.689 1.663 0.689h10.976c0.624 0 1.222-0.248 1.663-0.689 0.441-0.441 0.689-1.039 0.689-1.663v-3.136c0-0.208-0.083-0.407-0.23-0.554s-0.346-0.23-0.554-0.23Z" fill="currentColor" strokeWidth="0.667"/>
    </svg>
  );
}

export default function SaveDataPanel({
  open,
  onClose,
  onSaveComplete,
  onCancelSaveContinuation,
}: SaveDataPanelProps) {
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
  const dateDraftError = useTripStore((s) => s.dateDraftError);
  const getSnapshot = useTripStore((s) => s.getSnapshot);
  const loadSnapshot = useTripStore((s) => s.loadSnapshot);
  const markClean = useTripStore((s) => s.markClean);

  const pushToast = useToastStore((s) => s.pushToast);

  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent | null>(null);
  const [selectedForSwap, setSelectedForSwap] = useState<number[]>([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  // ── Import / Export state ──
  const [exportSchema, setExportSchema] = useState<ExportSchema>(() => useSettingsStore.getState().exportSchema);
  const [exportSource, setExportSource] = useState<ExportSource>({ type: 'active' });
  const [namePreset, setNamePreset] = useState<FileNamePreset>(() => useSettingsStore.getState().exportFilenamePreset);
  const [customName, setCustomName] = useState('');
  const [includeDateInFileName, setIncludeDateInFileName] = useState(() => useSettingsStore.getState().exportIncludeDate);
  const [importRateMode, setImportRateMode] = useState<ImportRateMode>(() => useSettingsStore.getState().importExchangeRateMode);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [importRateDropdownOpen, setImportRateDropdownOpen] = useState(false);
  const [schemaDropdownOpen, setSchemaDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [namePresetDropdownOpen, setNamePresetDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveContinuationCancelledRef = useRef(false);
  const wasOpenRef = useRef(false);

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
      wasOpenRef.current = false;
      saveContinuationCancelledRef.current = false;
      setConfirmIntent(null);
      setSelectedForSwap([]);
      setEditingSlotIndex(null);
      setPendingImportFile(null);
      setImportRateDropdownOpen(false);
      setSchemaDropdownOpen(false);
      setSourceDropdownOpen(false);
      setNamePresetDropdownOpen(false);
      return;
    }

    if (!wasOpenRef.current) {
      saveContinuationCancelledRef.current = false;
      wasOpenRef.current = true;
    }

    const s = useSettingsStore.getState();
    setExportSchema(s.exportSchema);
    setNamePreset(s.exportFilenamePreset);
    setIncludeDateInFileName(s.exportIncludeDate);
    setImportRateMode(s.importExchangeRateMode);

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
      if (useTripStore.getState().dateDraftError) {
        pushToast({ type: 'warning', title: 'Trip dates need attention', message: useTripStore.getState().dateDraftError });
        return;
      }
      const ok = saveToSlot(slotIndex, getSnapshot());
      if (!ok) {
        return;
      }

      markClean();
      if (onSaveComplete && !saveContinuationCancelledRef.current) {
        onSaveComplete();
        return;
      }

      pushToast({
        type: 'success',
        title: 'Trip saved',
        message: `Saved to ${displayLabels[slotIndex]}.`,
      });
    },
    [displayLabels, getSnapshot, markClean, onSaveComplete, pushToast, saveToSlot]
  );

  const cancelSaveContinuation = useCallback(() => {
    saveContinuationCancelledRef.current = true;
    onCancelSaveContinuation?.();
  }, [onCancelSaveContinuation]);

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

      cancelSaveContinuation();
      loadSnapshot(snapshot);
      markClean();
      pushToast({
        type: 'success',
        title: 'Trip loaded',
        message: `Loaded ${snapshot.tripName || displayLabels[slotIndex]}.`,
      });
    },
    [cancelSaveContinuation, displayLabels, loadFromSlot, loadSnapshot, markClean, pushToast, slots]
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
      if (isDirty || dateDraftError) {
        setConfirmIntent({ type: 'load', slotIndex });
        return;
      }
      runLoad(slotIndex);
    },
    [dateDraftError, isDirty, runLoad]
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

  const runImportFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const { importWorkbook } = await import('@/lib/xlsx/importWorkbook');
        const { snapshot: exportable, warnings } = await importWorkbook(file);

        const adjustedExchangeRates = exportable.exchangeRates.map((rate) => {
          if (importRateMode === 'keep-imported') {
            return { ...rate, isOverridden: true };
          }
          if (importRateMode === 'refresh-live') {
            return { ...rate, isOverridden: false };
          }
          return rate;
        });

        const adjustedExportable = {
          ...exportable,
          exchangeRates: adjustedExchangeRates,
        };

        cancelSaveContinuation();
        loadSnapshot(adjustedExportable);
        markClean();

        if (warnings.length > 0) {
          pushToast({
            type: 'warning',
            title: 'Imported with warnings',
            message: warnings.slice(0, 3).join(' '),
          });
        } else {
          pushToast({
            type: 'success',
            title: 'Trip imported',
            message: `Loaded "${adjustedExportable.tripName}" from file.`,
          });
        }
      } catch (err) {
        pushToast({
          type: 'error',
          title: 'Import failed',
          message: err instanceof Error ? err.message : 'Could not read the file.',
        });
      } finally {
        setIsImporting(false);
      }
    },
    [cancelSaveContinuation, importRateMode, loadSnapshot, markClean, pushToast],
  );

  // ── Import handler ──
  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset the input so re-selecting the same file triggers onChange
      e.target.value = '';

      if (isDirty || dateDraftError) {
        setPendingImportFile(file);
        setConfirmIntent({ type: 'import' });
        return;
      }

      await runImportFile(file);
    },
    [dateDraftError, isDirty, runImportFile],
  );

  const handleConfirmAction = useCallback(async () => {
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

    if (confirmIntent.type === 'import') {
      if (pendingImportFile) {
        await runImportFile(pendingImportFile);
      }
      setPendingImportFile(null);
    }

    setConfirmIntent(null);
  }, [confirmIntent, pendingImportFile, runClear, runImportFile, runLoad, runSave, runSwap]);

  // ── Export handler ──
  const handleExport = useCallback(async () => {
    if (exportSource.type === 'active' && useTripStore.getState().dateDraftError) {
      pushToast({ type: 'warning', title: 'Trip dates need attention', message: useTripStore.getState().dateDraftError });
      return;
    }
    setIsExporting(true);
    try {
      let snapshot: TripSnapshot;
      let slotLabel: string | undefined;

      if (exportSource.type === 'slot') {
        const slot = slots[exportSource.slotIndex];
        if (!slot) {
          pushToast({ type: 'warning', title: 'Slot is empty', message: 'Select a slot with saved data.' });
          return;
        }
        snapshot = slot.data;
        slotLabel = displayLabels[exportSource.slotIndex];
      } else {
        snapshot = getSnapshot();
        slotLabel = undefined;
      }

      const { exportWorkbook } = await import('@/lib/xlsx/exportWorkbook');
      await exportWorkbook(snapshot, {
        schema: exportSchema,
        source: exportSource,
        namePreset,
        customName: customName || undefined,
        slotLabel,
        includeDate: includeDateInFileName,
      });

      pushToast({
        type: 'success',
        title: 'Exported',
        message: `Trip exported as ${exportSchema === 'three-sheet' ? 'multi-sheet' : 'single-sheet'} .xlsx.`,
      });
    } catch (err) {
      pushToast({
        type: 'error',
        title: 'Export failed',
        message: err instanceof Error ? err.message : 'Could not generate the file.',
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    exportSchema,
    exportSource,
    namePreset,
    customName,
    includeDateInFileName,
    slots,
    displayLabels,
    getSnapshot,
    pushToast,
  ]);

  // Build export source options
  const exportSourceOptions = useMemo(() => {
    const options: { label: string; source: ExportSource }[] = [
      { label: 'Active Trip', source: { type: 'active' } },
    ];
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      const slot = slots[i];
      if (slot) {
        options.push({
          label: `${displayLabels[i]} — ${slot.tripName || 'Untitled'}`,
          source: { type: 'slot', slotIndex: i },
        });
      }
    }
    return options;
  }, [slots, displayLabels]);

  const selectedExportSourceLabel = useMemo(() => {
    if (exportSource.type === 'active') {
      return 'Active Trip';
    }
    const option = exportSourceOptions.find(
      (item) => item.source.type === 'slot' && item.source.slotIndex === exportSource.slotIndex,
    );
    return option?.label ?? `Slot ${exportSource.slotIndex + 1}`;
  }, [exportSource, exportSourceOptions]);

  const namePresetLabel = useMemo(() => {
    if (namePreset === 'tripName') return 'Trip Name';
    if (namePreset === 'slotLabel') return 'Slot Name';
    if (namePreset === 'custom') return 'Custom';
    return 'Trip ID';
  }, [namePreset]);

  const importRateModeLabel = useMemo(() => {
    if (importRateMode === 'keep-imported') return 'Keep imported rates';
    if (importRateMode === 'refresh-live') return 'Refresh with live';
    return 'Hybrid rates';
  }, [importRateMode]);

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
              {selectedForSwap.length > 0 ? (
                <div
                  className="save-data-panel-swap-actions"
                  role="group"
                  aria-label="Swap selection actions"
                >
                  {canSwap ? (
                    <button
                      type="button"
                      className="save-slot-swap-action is-primary"
                      onClick={() => {
                        setConfirmIntent({
                          type: 'swap',
                          firstSlotIndex: selectedForSwap[0]!,
                          secondSlotIndex: selectedForSwap[1]!,
                        });
                      }}
                    >
                      <ArrowLeftRight size={14} aria-hidden="true" />
                      Swap Selected Slots
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="save-slot-swap-action is-clear"
                    onClick={() => setSelectedForSwap([])}
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    Clear Swap Selection
                  </button>
                </div>
              ) : null}
              <button type="button" className="save-data-panel-close" onClick={onClose} aria-label="Close save data panel">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Import / Export row ── */}
          <div className="save-data-io-row">
            <div className="save-data-io-left">
              <span className="save-data-io-label">Data:</span>
              <button
                type="button"
                className="save-data-io-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <ImportIcon /> Import
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="save-data-io-file-input"
                onChange={handleImportFile}
                tabIndex={-1}
                aria-hidden="true"
              />

              <div className="save-data-io-dropdown-wrap">
                <button
                  type="button"
                  className="save-data-io-dropdown-btn save-data-io-dropdown-btn-wide"
                  onClick={() => {
                    setImportRateDropdownOpen((v) => !v);
                    setSchemaDropdownOpen(false);
                    setSourceDropdownOpen(false);
                    setNamePresetDropdownOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={importRateDropdownOpen}
                >
                  <span className="save-data-io-dropdown-btn-text">{importRateModeLabel}</span>
                  <ChevronDown size={12} />
                </button>
                {importRateDropdownOpen ? (
                  <div className="save-data-io-dropdown" role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={importRateMode === 'hybrid'}
                      className={`save-data-io-dropdown-item${importRateMode === 'hybrid' ? ' is-active' : ''}`}
                      onClick={() => {
                        setImportRateMode('hybrid');
                        setImportRateDropdownOpen(false);
                      }}
                    >
                      <span className="save-data-io-dropdown-dot" style={{ background: '#5AA3FF' }} />
                      <span>Hybrid rates</span>
                      <span className="save-data-io-dropdown-desc">Keep overrides, refresh others</span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={importRateMode === 'keep-imported'}
                      className={`save-data-io-dropdown-item${importRateMode === 'keep-imported' ? ' is-active' : ''}`}
                      onClick={() => {
                        setImportRateMode('keep-imported');
                        setImportRateDropdownOpen(false);
                      }}
                    >
                      <span className="save-data-io-dropdown-dot" style={{ background: '#2CBF6D' }} />
                      <span>Keep imported rates</span>
                      <span className="save-data-io-dropdown-desc">Freeze all from file</span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={importRateMode === 'refresh-live'}
                      className={`save-data-io-dropdown-item${importRateMode === 'refresh-live' ? ' is-active' : ''}`}
                      onClick={() => {
                        setImportRateMode('refresh-live');
                        setImportRateDropdownOpen(false);
                      }}
                    >
                      <span className="save-data-io-dropdown-dot" style={{ background: '#F2B65A' }} />
                      <span>Refresh with live</span>
                      <span className="save-data-io-dropdown-desc">Live rates override imported</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="save-data-io-right">
              <span className="save-data-io-label">Export as:</span>

              {/* Schema selector (dropdown) */}
              <div className="save-data-io-dropdown-wrap">
                <button
                  type="button"
                  className="save-data-io-dropdown-btn"
                  onClick={() => {
                    setSchemaDropdownOpen((v) => !v);
                    setSourceDropdownOpen(false);
                    setNamePresetDropdownOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={schemaDropdownOpen}
                >
                  {exportSchema === 'three-sheet' ? '.xlsx v1' : '.xlsx v2'}
                  <ChevronDown size={12} />
                </button>
                {schemaDropdownOpen ? (
                  <div className="save-data-io-dropdown" role="listbox">
                    <button
                      type="button"
                      role="option"
                      aria-selected={exportSchema === 'three-sheet'}
                      className={`save-data-io-dropdown-item${exportSchema === 'three-sheet' ? ' is-active' : ''}`}
                      onClick={() => { setExportSchema('three-sheet'); setSchemaDropdownOpen(false); }}
                    >
                      <span className="save-data-io-dropdown-dot" style={{ background: '#2CBF6D' }} />
                      <span>.xlsx v1</span>
                      <span className="save-data-io-dropdown-desc">Multi-sheet</span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={exportSchema === 'single-sheet'}
                      className={`save-data-io-dropdown-item${exportSchema === 'single-sheet' ? ' is-active' : ''}`}
                      onClick={() => { setExportSchema('single-sheet'); setSchemaDropdownOpen(false); }}
                    >
                      <span className="save-data-io-dropdown-dot" style={{ background: '#9CE7B5' }} />
                      <span>.xlsx v2</span>
                      <span className="save-data-io-dropdown-desc">Single sheet</span>
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Source selector */}
              <div className="save-data-io-dropdown-wrap">
                <button
                  type="button"
                  className="save-data-io-dropdown-btn save-data-io-dropdown-btn-wide"
                  onClick={() => {
                    setSourceDropdownOpen((v) => !v);
                    setSchemaDropdownOpen(false);
                    setNamePresetDropdownOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={sourceDropdownOpen}
                >
                  <span className="save-data-io-dropdown-btn-text">{selectedExportSourceLabel}</span>
                  <ChevronDown size={12} />
                </button>
                {sourceDropdownOpen ? (
                  <div className="save-data-io-dropdown" role="listbox">
                    {exportSourceOptions.map((opt) => {
                      const selected =
                        (opt.source.type === 'active' && exportSource.type === 'active') ||
                        (opt.source.type === 'slot' &&
                          exportSource.type === 'slot' &&
                          opt.source.slotIndex === exportSource.slotIndex);
                      return (
                        <button
                          key={opt.source.type === 'active' ? 'active' : `slot-${opt.source.slotIndex}`}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`save-data-io-dropdown-item${selected ? ' is-active' : ''}`}
                          onClick={() => {
                            setExportSource(opt.source);
                            setSourceDropdownOpen(false);
                          }}
                        >
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Name preset + custom input */}
              <div className="save-data-io-dropdown-wrap save-data-io-dropdown-wrap-left">
                <button
                  type="button"
                  className="save-data-io-dropdown-btn"
                  onClick={() => {
                    setNamePresetDropdownOpen((v) => !v);
                    setSchemaDropdownOpen(false);
                    setSourceDropdownOpen(false);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={namePresetDropdownOpen}
                >
                  <span>{namePresetLabel}</span>
                  <ChevronDown size={12} />
                </button>
                {namePresetDropdownOpen ? (
                  <div className="save-data-io-dropdown" role="listbox">
                    {[
                      { value: 'tripId' as const, label: 'Trip ID' },
                      { value: 'tripName' as const, label: 'Trip Name' },
                      { value: 'slotLabel' as const, label: 'Slot Name' },
                      { value: 'custom' as const, label: 'Custom' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        role="option"
                        aria-selected={namePreset === item.value}
                        className={`save-data-io-dropdown-item${namePreset === item.value ? ' is-active' : ''}`}
                        onClick={() => {
                          setNamePreset(item.value);
                          setNamePresetDropdownOpen(false);
                        }}
                      >
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <label className="save-data-io-date-toggle" htmlFor="save-data-include-date">
                <input
                  id="save-data-include-date"
                  type="checkbox"
                  checked={includeDateInFileName}
                  onChange={(e) => setIncludeDateInFileName(e.target.checked)}
                />
                <span>Add date</span>
              </label>
              {namePreset === 'custom' ? (
                <input
                  className="save-data-io-name-input"
                  type="text"
                  placeholder="File name…"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value.slice(0, 60))}
                  maxLength={60}
                />
              ) : null}

              <div className="save-data-io-export-actions">
                <button
                  type="button"
                  className="save-data-io-export-btn"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <ExportIcon /> Export
                  </span>
                </button>
                <button
                  type="button"
                  className="save-data-io-cog-btn"
                  onClick={() => setSettingsModalOpen(true)}
                  aria-label="Import / Export settings"
                >
                  <CogIcon />
                </button>
              </div>
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

      {settingsModalOpen ? (
        <ImportExportSettingsModal onClose={() => setSettingsModalOpen(false)} />
      ) : null}

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
              : confirmIntent.type === 'import'
              ? 'Import and overwrite current trip?'
              : 'Swap selected slots?'
          }
          body={
            confirmIntent.type === 'load'
              ? `This will replace your current trip in the workspace. Unsaved changes${dateDraftError ? ' and the invalid trip date draft' : ''} will be lost.`
              : confirmIntent.type === 'overwrite'
              ? 'This slot already has saved data. Overwrite it with the current trip?'
              : confirmIntent.type === 'clear'
              ? 'This removes all saved data from the selected slot.'
              : confirmIntent.type === 'import'
              ? `Importing will replace the current workspace trip data${dateDraftError ? ' and discard the invalid trip date draft' : ''}.`
              : 'This swaps the saved data between the two selected slots.'
          }
          confirmLabel="Confirm"
          onConfirm={handleConfirmAction}
          onCancel={() => {
            if (confirmIntent.type === 'import') {
              setPendingImportFile(null);
            }
            setConfirmIntent(null);
          }}
        />
      ) : null}
    </>,
    document.body
  );
}
