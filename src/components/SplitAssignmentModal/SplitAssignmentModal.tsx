import { useId } from 'react';
import { X, Plus } from 'lucide-react';
import ModalShell from '@/components/Modal/ModalShell';
import { MAX_GROUPS, getColorThemeValue, type Couple, type SplitType } from '@/store/types';
import { useResolvedTheme } from '@/store/theme';
import { useTranslation } from 'react-i18next';
import '@/i18n';

interface SplitAssignmentModalProps {
  open: boolean;
  mode: Extract<SplitType, 'subset' | 'individual'> | null;
  couples: Couple[];
  selectedCoupleIds: string[];
  modalName?: string;
  onToggleCouple: (coupleId: string) => void;
  onConfirmSubset: () => void;
  onClose: () => void;
  onCreateGroup: () => void;
}

export default function SplitAssignmentModal({
  open,
  mode,
  couples,
  selectedCoupleIds,
  modalName,
  onToggleCouple,
  onConfirmSubset,
  onClose,
  onCreateGroup,
}: SplitAssignmentModalProps) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const titleId = useId();

  if (!open || !mode) return null;

  return (
    <ModalShell
      onClose={onClose}
      labelledBy={titleId}
      id={modalName}
      className="split-modal"
      overlayClassName="modal-overlay"
    >
      <div className="split-modal-header">
        <span className="split-modal-title" id={titleId}>
          {mode === 'subset' ? t('selectGroups') : t('selectGroup')}
        </span>
        <button
          className="split-modal-close"
          onClick={onClose}
          aria-label={t('close')}
        >
          <X size={16} />
        </button>
      </div>

      <div className="split-modal-create-row">
        <button
          type="button"
          className="split-modal-create-btn"
          onClick={onCreateGroup}
          disabled={couples.length >= MAX_GROUPS}
        >
          <Plus size={14} />
          {t('createGroup')}
        </button>
      </div>

      <div
        className="split-modal-couples"
        role={mode === 'individual' ? 'radiogroup' : undefined}
        aria-label={mode === 'individual' ? t('selectGroup') : undefined}
      >
        {couples.length === 0 && (
        <div className="split-modal-empty">{t('noGroupsCreateOne')}</div>
        )}

        {couples.map((couple) => {
          const isSelected = selectedCoupleIds.includes(couple.id);

          if (mode === 'individual') {
            return (
              <button
                key={couple.id}
                type="button"
                className={`split-modal-couple split-modal-couple-btn${isSelected ? ' is-selected' : ''}`}
                role="radio"
                aria-checked={isSelected}
                onClick={() => onToggleCouple(couple.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleCouple(couple.id);
                  }
                }}
              >
                <span className="split-modal-radio" aria-hidden="true">
                  {isSelected ? '◉' : '◯'}
                </span>
                <span style={{ color: getColorThemeValue(couple.colorIndex, theme), fontWeight: 700 }}>
                  ● <bdi dir="auto">{couple.name}</bdi>
                </span>
              </button>
            );
          }

          return (
            <label key={couple.id} className="split-modal-couple">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleCouple(couple.id)}
              />
              <span style={{ color: getColorThemeValue(couple.colorIndex, theme), fontWeight: 700 }}>
                ● <bdi dir="auto">{couple.name}</bdi>
              </span>
            </label>
          );
        })}
      </div>

      {mode === 'subset' && (
        <div className="split-modal-actions">
          <button
            className="split-modal-btn cancel"
            onClick={onClose}
          >
            {t('close')}
          </button>
          <button
            className="split-modal-btn confirm"
            onClick={onConfirmSubset}
            disabled={selectedCoupleIds.length === 0}
          >
            {t('confirm')}
          </button>
        </div>
      )}
    </ModalShell>
  );
}
