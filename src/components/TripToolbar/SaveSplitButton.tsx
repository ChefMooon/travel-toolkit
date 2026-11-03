import { useCallback, useId, useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/Modal';
import { quickSaveActiveTrip } from '@/components/SaveDataPanel/saveActions';
import Tooltip from '@/components/Tooltip';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { getDefaultSlotLabel } from '@/store/types';
import { useTripSaveStatus } from '@/store/useTripSaveStatus';

export type SavePanelMode = 'browse' | 'pick';

interface SaveSplitButtonProps {
  /** Whether the save data panel is open (the chevron's aria-expanded). */
  panelOpen: boolean;
  onOpenPanel: (mode: SavePanelMode) => void;
}

/**
 * Trip-page save control: [ ●Save | ▾ ].
 * Main part: with a home slot, quick-saves there (toast with Undo, the panel stays closed); without
 * one, "Save…" opens the panel to pick a slot. The chevron opens the panel to browse (and load).
 */
export default function SaveSplitButton({ panelOpen, onOpenPanel }: SaveSplitButtonProps) {
  const { t } = useTranslation();
  const labels = useSaveSlotStore((s) => s.labels);
  const { homeSlotIndex, hasUnsavedWork } = useTripSaveStatus();
  // Slot an imported trip matched: its first quick save asks before overwriting (as in the panel).
  const [confirmSlot, setConfirmSlot] = useState<number | null>(null);
  const unsavedId = useId();

  const hasHome = homeSlotIndex >= 0;
  const labelOf = (slotIndex: number) => labels?.[slotIndex] ?? getDefaultSlotLabel(slotIndex);
  const mainName = hasHome ? t('saveToSlotLabel', { slot: labelOf(homeSlotIndex) }) : t('saveToASlotLabel');

  const runQuickSave = useCallback(
    (confirmed = false) => {
      const result = quickSaveActiveTrip({ confirmed });
      if (result.type === 'needs-confirm') setConfirmSlot(result.slotIndex);
      // The home slot went away since the last render: fall back to choosing one.
      else if (result.type === 'no-home') onOpenPanel('pick');
    },
    [onOpenPanel]
  );

  const confirmLabel = confirmSlot === null ? '' : labelOf(confirmSlot);

  return (
    <>
      <div className="save-split" role="group" aria-label={t('saveSlots')}>
        <Tooltip content={mainName}>
          <button
            type="button"
            className="rule-btn save-split-main"
            aria-label={mainName}
            aria-describedby={hasUnsavedWork ? unsavedId : undefined}
            onClick={() => (hasHome ? runQuickSave() : onOpenPanel('pick'))}
          >
            <img src="/save.svg" alt="" aria-hidden="true" />
            {/* The single unsaved-changes indicator; the hidden text keeps it from being colour-only.
                Future: auto-save (paid tier) status would sit next to this dot. */}
            {hasUnsavedWork ? (
              <span className="save-split-dot">
                <span className="sr-only" id={unsavedId}>{t('unsavedChanges')}</span>
              </span>
            ) : null}
            <span className="save-split-text">{hasHome ? t('save') : t('saveEllipsis')}</span>
          </button>
        </Tooltip>
        <Tooltip content={t('saveSlots')}>
          <button
            type="button"
            className="rule-btn save-split-chevron"
            aria-label={t('openSaveSlots')}
            aria-haspopup="dialog"
            aria-expanded={panelOpen}
            onClick={() => onOpenPanel('browse')}
          >
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      {confirmSlot !== null ? (
        <Modal
          icon={AlertTriangle}
          title={t('overwriteImportedTripTitle', { slot: confirmLabel })}
          body={t('overwriteImportedTripBody', { slot: confirmLabel })}
          confirmLabel={t('confirm')}
          onConfirm={() => {
            setConfirmSlot(null);
            runQuickSave(true);
          }}
          onCancel={() => setConfirmSlot(null)}
        />
      ) : null}
    </>
  );
}
