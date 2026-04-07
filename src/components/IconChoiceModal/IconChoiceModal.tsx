import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { COUPLE_ICONS } from '@/store/types';

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
      <div className="icon-choice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="icon-modal-header">
          <h2 className="icon-modal-title">Choose an Icon</h2>
          <button
            type="button"
            className="icon-modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="icon-grid">
          {COUPLE_ICONS.map(({ name, symbol }, index) => (
            <button
              key={index}
              className={`icon-item ${index === iconIndex ? 'selected' : ''}`}
              onClick={() => handleIconClick(index)}
              title={name}
              aria-label={name}
              type="button"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
