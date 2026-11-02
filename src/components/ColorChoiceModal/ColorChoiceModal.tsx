import { useCallback, useId } from 'react';
import { X } from 'lucide-react';
import { COUPLE_COLORS, getColorThemeValue } from '@/store/types';
import Tooltip from '@/components/Tooltip';
import { useResolvedTheme } from '@/store/theme';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { ModalShell } from '@/components/Modal';

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
  const { t } = useTranslation();
  const titleId = useId();
  const handleColorClick = useCallback(
    (index: number) => {
      onConfirm(index);
    },
    [onConfirm]
  );

  const currentTheme = useResolvedTheme();

  return (
    <ModalShell
      onClose={onCancel}
      labelledBy={titleId}
      overlayClassName="color-choice-overlay modal-overlay"
      className="color-choice-modal"
    >
        <div className="color-modal-header">
          <h2 id={titleId} className="color-modal-title">{t('chooseAColor')}</h2>
          <button
            type="button"
            className="color-modal-close"
            onClick={onCancel}
            aria-label={t('close')}
          >
            <X size={16} />
          </button>
        </div>
        <div className="color-grid">
          {Object.entries(COUPLE_COLORS).map(([colorKey, colorEntry]) => {
            const index = parseInt(colorKey);
            const color = getColorThemeValue(index, currentTheme);
            const colorName = t(`groupColor_${colorEntry.name.toLowerCase()}`, { defaultValue: colorEntry.name });

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
    </ModalShell>
  );
}
