import { useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { COUPLE_ICONS } from '@/store/types';
import Tooltip from '@/components/Tooltip';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { useChoiceDialogFocus } from '@/components/Modal/useChoiceDialogFocus';

interface IconChoiceModalProps {
  iconIndex: number;
  onConfirm: (index: number) => void;
  onCancel: () => void;
}

export default function IconChoiceModal({
  iconIndex,
  onConfirm,
  onCancel,
}: IconChoiceModalProps) {
  const { t } = useTranslation();
  const dialogRef = useChoiceDialogFocus();
  const titleId = useId();
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleIconClick = useCallback(
    (index: number) => {
      onConfirm(index);
    },
    [onConfirm]
  );

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return createPortal(
    <div
      className="icon-choice-overlay modal-overlay"
      onClick={handleBackdropClick}
    >
      <div ref={dialogRef} className="icon-choice-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="icon-modal-header">
          <h2 id={titleId} className="icon-modal-title">{t('chooseAnIcon')}</h2>
          <button
            type="button"
            className="icon-modal-close"
            onClick={onCancel}
            aria-label={t('close')}
          >
            <X size={16} />
          </button>
        </div>
        <div className="icon-grid">
          {COUPLE_ICONS.map(({ name, symbol }, index) => {
            const label = t(`groupIcon_${name.toLowerCase()}`, { defaultValue: name });
            return <Tooltip key={index} content={label}>
              <button
                className={`icon-item ${index === iconIndex ? 'selected' : ''}`}
                onClick={() => handleIconClick(index)}
                aria-label={label}
                type="button"
              >
                {symbol}
              </button>
            </Tooltip>;
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
