import { useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModalShell } from '@/components/Modal';
import type { ImportRateMode } from './useImportTrip';

interface ImportConfirmDialogProps {
  fileName: string;
  defaultMode: ImportRateMode;
  /** Unsaved work (or an invalid date draft) would be replaced: show the replace warning. */
  replaceWarning: 'none' | 'unsaved' | 'invalid-date';
  busy: boolean;
  onConfirm: (mode: ImportRateMode) => void;
  onCancel: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

const focusCheckedRate = (dialog: HTMLElement) => dialog.querySelector<HTMLElement>('input[type="radio"]:checked');

export default function ImportConfirmDialog({
  fileName,
  defaultMode,
  replaceWarning,
  busy,
  onConfirm,
  onCancel,
  returnFocusRef,
}: ImportConfirmDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ImportRateMode>(defaultMode);
  const titleId = useId();
  const bodyId = useId();
  const ratesLabelId = useId();
  const radioName = useId();
  const actionsRef = useRef<HTMLDivElement | null>(null);

  // Busy disables every control, which would drop focus to <body>: park it on the dialog itself.
  useLayoutEffect(() => {
    if (!busy) return;
    const dialog = actionsRef.current?.closest<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const active = document.activeElement;
    if (!active || active === document.body || dialog.contains(active)) dialog.focus();
  }, [busy]);

  const options: { value: ImportRateMode; label: string; description: string }[] = [
    { value: 'hybrid', label: t('hybridRates'), description: t('keepOverridesRefreshOthers') },
    { value: 'keep-imported', label: t('keepImportedRates'), description: t('freezeRatesFromFile') },
    { value: 'refresh-live', label: t('refreshWithLive'), description: t('liveRatesOverrideImported') },
  ];

  return (
    <ModalShell
      onClose={onCancel}
      labelledBy={titleId}
      describedBy={replaceWarning === 'none' ? undefined : bodyId}
      className="import-confirm"
      initialFocus={focusCheckedRate}
      returnFocusRef={returnFocusRef}
    >
      <div className="modal-ico"><FileUp size={36} aria-hidden="true" focusable="false" /></div>
      <div className="modal-title" id={titleId}>
        {replaceWarning === 'none' ? t('importTripTitle') : t('importOverwriteTripTitle')}
      </div>
      {replaceWarning === 'none' ? null : (
        <div className="modal-body import-confirm-warning" id={bodyId}>
          {t(replaceWarning === 'invalid-date' ? 'importWithInvalidDateBody' : 'importTripBody')}
        </div>
      )}
      <p className="import-confirm-file">
        <span className="import-confirm-kicker">{t('importFileLabel')}</span>
        <bdi dir="auto" className="import-confirm-file-name">{fileName}</bdi>
      </p>
      <div className="import-confirm-rates" role="radiogroup" aria-labelledby={ratesLabelId}>
        <span className="import-confirm-kicker" id={ratesLabelId}>{t('exchangeRates')}</span>
        {options.map((option) => (
          <label key={option.value} className="import-confirm-rate">
            <input
              type="radio"
              name={radioName}
              value={option.value}
              checked={mode === option.value}
              onChange={() => setMode(option.value)}
              disabled={busy}
            />
            <span className={`rate-mode-dot rate-mode-dot--${option.value}`} aria-hidden="true" />
            <span className="import-confirm-rate-label">{option.label}</span>
            <span className="import-confirm-rate-desc">{option.description}</span>
          </label>
        ))}
      </div>
      <div className="modal-acts" ref={actionsRef}>
        <button type="button" className="btn-m-cancel" onClick={onCancel} disabled={busy}>{t('cancel')}</button>
        <button
          type="button"
          className="btn-m-confirm"
          onClick={() => onConfirm(mode)}
          disabled={busy}
          aria-busy={busy}
        >
          {t('import')}
        </button>
      </div>
    </ModalShell>
  );
}
