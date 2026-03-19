import { createPortal } from 'react-dom';
import { X, Plus } from 'lucide-react';
import type { Couple, SplitType } from '@/store/types';

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
  if (!open || !mode) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="split-modal" onClick={(e) => e.stopPropagation()}>
        <div className="split-modal-header">
          <span className="split-modal-title">
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
          >
            <Plus size={14} />
            Create Group
          </button>
        </div>

        <div className="split-modal-couples">
          {couples.length === 0 && (
            <div className="split-modal-empty">No groups yet. Create one to continue.</div>
          )}

          {couples.map((couple) => (
            <label key={couple.id} className="split-modal-couple">
              <input
                type={mode === 'individual' ? 'radio' : 'checkbox'}
                name={mode === 'individual' ? modalName : undefined}
                checked={selectedCoupleIds.includes(couple.id)}
                onChange={() => onToggleCouple(couple.id)}
              />
              <span style={{ color: `var(--c${couple.colorIndex})`, fontWeight: 700 }}>
                ● {couple.name}
              </span>
            </label>
          ))}
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