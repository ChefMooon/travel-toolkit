import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExportableSnapshot } from '@/lib/xlsx/types';
import { clearImportedTripGuard, markImportedTripMatchesSlot } from '@/store/importedTripGuard';
import { findSlotIndexByTripId, useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';

export type ImportRateMode = 'hybrid' | 'keep-imported' | 'refresh-live';

export function applyImportRateMode(snapshot: ExportableSnapshot, mode: ImportRateMode): ExportableSnapshot {
  return {
    ...snapshot,
    exchangeRates: snapshot.exchangeRates.map((rate) => {
      if (mode === 'keep-imported') return { ...rate, isOverridden: true };
      if (mode === 'refresh-live') return { ...rate, isOverridden: false };
      return rate;
    }),
  };
}

interface UseImportTripOptions {
  /** Called right before the imported trip replaces the workspace. */
  cancelSaveContinuation: () => void;
}

/** Picked file -> confirm (rate mode) -> import. Only one import can run at a time. */
export function useImportTrip({ cancelSaveContinuation }: UseImportTripOptions) {
  const { t } = useTranslation();
  const loadSnapshot = useTripStore((s) => s.loadSnapshot);
  const markClean = useTripStore((s) => s.markClean);
  const pushToast = useToastStore((s) => s.pushToast);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  // State updates land after the click; the ref blocks a second import within the same tick.
  const runningRef = useRef(false);

  const selectFile = useCallback((file: File) => {
    if (runningRef.current) return;
    setPendingFile(file);
  }, []);

  const cancelImport = useCallback(() => {
    if (runningRef.current) return;
    setPendingFile(null);
  }, []);

  const confirmImport = useCallback(
    async (mode: ImportRateMode) => {
      const file = pendingFile;
      if (!file || runningRef.current) return;
      runningRef.current = true;
      setIsImporting(true);
      try {
        const { importWorkbook } = await import('@/lib/xlsx/importWorkbook');
        const { snapshot: exportable, warnings } = await importWorkbook(file);
        const adjusted = applyImportRateMode(exportable, mode);

        cancelSaveContinuation();
        loadSnapshot(adjusted);
        markClean();

        // Read the slots now: they may have changed while the workbook was being parsed.
        if (findSlotIndexByTripId(useSaveSlotStore.getState().slots, adjusted.tripId) >= 0) {
          markImportedTripMatchesSlot(adjusted.tripId);
        } else {
          clearImportedTripGuard();
        }

        if (warnings.length > 0) {
          pushToast({
            type: 'warning',
            title: t('importedWithWarnings'),
            message: t('importWarningsDetails'),
          });
        } else {
          pushToast({
            type: 'success',
            title: t('tripImported'),
            message: t('tripImportedMessage', { trip: adjusted.tripName }),
          });
        }
      } catch {
        pushToast({
          type: 'error',
          title: t('importFailed'),
          message: t('couldNotReadFile'),
        });
      } finally {
        runningRef.current = false;
        setIsImporting(false);
        setPendingFile(null);
      }
    },
    [cancelSaveContinuation, loadSnapshot, markClean, pendingFile, pushToast, t],
  );

  return { pendingFile, isImporting, selectFile, cancelImport, confirmImport };
}
