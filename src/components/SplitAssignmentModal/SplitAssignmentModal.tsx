import { useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus } from 'lucide-react';
import { MAX_GROUPS, getColorThemeValue, type Couple, type SplitType } from '@/store/types';
import { useTripStore } from '@/store/tripStore';

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
  const theme = useTripStore((s) => s.theme);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const titleId = useId();

  // Capture trigger element on open; restore focus when modal closes
  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement;
    }
    return () => {
      if (open) {
        (returnFocusRef.current as HTMLElement | null)?.focus();
      }
    };
  }, [open]);

  // Move focus to first focusable element when modal opens
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable.item(0);
    if (first) {
      first.focus();
    } else {
      dialog.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;
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

  if (!open || !mode) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        id={modalName}
        className="split-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="split-modal-header">
          <span className="split-modal-title" id={titleId}>
            {mode === 'subset' ? 'Select Groups' : 'Select Group'}
          </span>
          <button
            className="split-modal-close"
            onClick={onClose}
            aria-label="Close"
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
            Create Group
          </button>
        </div>

        <div
          className="split-modal-couples"
          role={mode === 'individual' ? 'radiogroup' : undefined}
          aria-label={mode === 'individual' ? 'Select a group' : undefined}
        >
          {couples.length === 0 && (
            <div className="split-modal-empty">No groups yet. Create one to continue.</div>
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
                    ● {couple.name}
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
                  ● {couple.name}
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
              Close
            </button>
            <button
              className="split-modal-btn confirm"
              onClick={onConfirmSubset}
              disabled={selectedCoupleIds.length === 0}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}