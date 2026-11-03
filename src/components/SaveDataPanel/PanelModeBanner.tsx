import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PanelModeBannerProps {
  variant: 'pick' | 'move';
  message: ReactNode;
  /** Secondary line, e.g. the all-slots-full note in pick mode. */
  detail?: ReactNode;
  onCancel: () => void;
}

/** Explains the current pick-a-slot or move mode above the wallet, with a way out. */
export default function PanelModeBanner({ variant, message, detail, onCancel }: PanelModeBannerProps) {
  const { t } = useTranslation();
  return (
    <div className={`save-panel-banner save-panel-banner--${variant}`} role="status" data-tool="trip">
      <div className="save-panel-banner-text">
        <span>{message}</span>
        {detail ? <small>{detail}</small> : null}
      </div>
      <button type="button" className="save-panel-btn" onClick={onCancel}>
        {t('cancel')}
      </button>
    </div>
  );
}
