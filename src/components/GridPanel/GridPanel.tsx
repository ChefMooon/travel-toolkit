import { useEffect, useRef } from 'react';
import { TOOLS } from '@/lib/tools';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import ToolStamp from '@/components/ToolStamp';
import type { TranslationKey } from '@/i18n';

const toolTitleKeys: Record<string, TranslationKey> = { 'Trip Cost': 'toolTripCost', 'Currency Converter': 'toolCurrency', 'Timezone Tracker': 'toolTimezone', 'Unit Converter': 'toolUnits', 'Destination Forecast': 'toolForecast', 'Travel Countdown': 'toolCountdown' };

type GridPanelProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export default function GridPanel({ open, onClose, triggerRef }: GridPanelProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );

    (focusable ?? panelRef.current)?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!first || !last) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <>
      <div
        className="grid-panel-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        id="tool-grid-panel"
        ref={panelRef}
        className="grid-panel"
        role="dialog"
        aria-label={t('toolNavigation')}
        aria-modal="true"
        tabIndex={-1}
      >
        <ul className="grid-panel-list">
          {TOOLS.map((tool) => (
            <li key={tool.route}>
              <Link
                to={tool.route}
                data-tool={tool.route.slice(1)}
                className="grid-panel-item"
                onClick={onClose}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <ToolStamp icon={tool.icon} size="row" />
                    <span className="grid-panel-item-title">{toolTitleKeys[tool.label] ? t(toolTitleKeys[tool.label]!) : tool.label}</span>
                    {isActive ? <span className="grid-panel-here" aria-hidden="true">{t('currentToolHere')}</span> : null}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
