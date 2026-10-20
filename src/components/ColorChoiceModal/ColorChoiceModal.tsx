import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { COUPLE_COLORS, getColorThemeValue } from '@/store/types';
import Tooltip from '@/components/Tooltip';
import { useResolvedTheme } from '@/store/theme';

interface ColorChoiceModalProps {
  colorIndex: number;
  onConfirm: (index: number) => void;
  onCancel: () => void;
}

export default function ColorChoiceModal({
  colorIndex,
  onConfirm,
  onCancel,
}: ColorChoiceModalProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleColorClick = useCallback(
    (index: number) => {
      onConfirm(index);
    },
    [onConfirm]
  );

  const currentTheme = useResolvedTheme();

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
      className="color-choice-overlay modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="color-choice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="color-modal-header">
          <h2 className="color-modal-title">Choose a Color</h2>
          <button
            type="button"
            className="color-modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="color-grid">
          {Object.entries(COUPLE_COLORS).map(([colorKey, colorEntry]) => {
            const index = parseInt(colorKey);
            const color = getColorThemeValue(index, currentTheme);
            const colorName = colorEntry.name;

            return (
              <Tooltip key={index} content={colorName}>
                <button
                  className={`color-swatch ${index === colorIndex ? 'selected' : ''}`}
                  onClick={() => handleColorClick(index)}
                  style={{ backgroundColor: color }}
                  aria-label={colorName}
                  type="button"
                >
                  {index === colorIndex && (
                    <span className="color-indicator">✓</span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
