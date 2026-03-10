import { useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { COUPLE_COLORS, getColorThemeValue } from '@/store/types';

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

  // Get current theme
  const currentTheme = useMemo(() => {
    const theme = document.documentElement.dataset.theme as 'light' | 'dark' | undefined;
    return theme === 'dark' ? 'dark' : 'light';
  }, []);

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
        </div>
        <div className="color-grid">
          {Object.entries(COUPLE_COLORS).map(([colorKey, _]) => {
            const index = parseInt(colorKey);
            const color = getColorThemeValue(index, currentTheme);

            return (
              <button
                key={index}
                className={`color-swatch ${index === colorIndex ? 'selected' : ''}`}
                onClick={() => handleColorClick(index)}
                style={{ backgroundColor: color }}
                title={`Color ${index}`}
                type="button"
              >
                {index === colorIndex && (
                  <span className="color-indicator">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
