import { useCallback, useId } from 'react';
import { X } from 'lucide-react';
import { COUPLE_ICONS } from '@/store/types';
import Tooltip from '@/components/Tooltip';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { ModalShell } from '@/components/Modal';

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
  const titleId = useId();
  const handleIconClick = useCallback(
    (index: number) => {
      onConfirm(index);
    },
    [onConfirm]
  );

  return (
    <ModalShell
      onClose={onCancel}
      labelledBy={titleId}
      overlayClassName="icon-choice-overlay modal-overlay"
      className="icon-choice-modal"
    >
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
    </ModalShell>
  );
}
