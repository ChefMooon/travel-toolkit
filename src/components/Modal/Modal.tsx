import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  icon: string;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onCancel: () => void;
}

export default function Modal({
  icon,
  title,
  body,
  confirmLabel,
  onConfirm,
  secondaryActionLabel,
  onSecondaryAction,
  onCancel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const first = focusable.item(0);
    if (first) {
      first.focus();
      return;
    }

    dialog.focus();
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onCancel();
    },
    [onCancel]
  );

  const handleDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
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
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [onCancel]
  );

  return typeof document === 'undefined'
    ? null
    : createPortal(
        <div className="modal-bd" onClick={handleBackdropClick}>
          <div
            ref={dialogRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
          >
            <div className="modal-ico">{icon}</div>
            <div className="modal-title" id={titleId}>{title}</div>
            <div className="modal-body" id={bodyId}>{body}</div>
            <div className="modal-acts">
              <button className="btn-m-cancel" onClick={onCancel}>Cancel</button>
              {secondaryActionLabel && onSecondaryAction ? (
                <button className="btn-m-secondary" onClick={onSecondaryAction}>{secondaryActionLabel}</button>
              ) : null}
              <button className="btn-m-confirm" onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </div>
        </div>,
        document.body
      );
}
