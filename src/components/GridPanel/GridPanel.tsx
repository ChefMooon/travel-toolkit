import { useEffect, useRef } from 'react';
import { TOOLS } from '@/lib/tools';
import { Link } from '@tanstack/react-router';

type GridPanelProps = {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export default function GridPanel({ open, onClose, triggerRef }: GridPanelProps) {
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
        aria-label="Tool navigation"
        aria-modal="true"
        tabIndex={-1}
      >
        {TOOLS.map((tool) => (
          <Link
            key={tool.route}
            to={tool.route}
            className="grid-panel-item"
            onClick={onClose}
          >
            <img src={tool.icon} alt="" aria-hidden="true" />
            <span className="grid-panel-item-title">{tool.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
