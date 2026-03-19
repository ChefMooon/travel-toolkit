import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
        </div>
        <div className="icon-grid">
          {COUPLE_ICONS.map((icon, index) => (
            <button
              key={index}
              className={`icon-item ${index === iconIndex ? 'selected' : ''}`}
              onClick={() => handleIconClick(index)}
              title={`Icon ${index + 1}`}
              type="button"
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
