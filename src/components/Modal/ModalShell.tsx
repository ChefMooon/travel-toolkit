import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE_SELECTOR =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Shared across shells so nested modals restore the original overflow only when the last one closes.
let scrollLockCount = 0;
let savedBodyOverflow = '';
let savedHtmlOverflow = '';

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedHtmlOverflow = document.documentElement.style.overflow;
  }
  scrollLockCount += 1;
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount > 0) return;
  document.body.style.overflow = savedBodyOverflow;
  document.documentElement.style.overflow = savedHtmlOverflow;
}

interface ModalShellProps {
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  className?: string;
  overlayClassName?: string;
  id?: string;
  initialFocus?: (dialog: HTMLElement) => HTMLElement | null;
  returnFocusRef?: RefObject<HTMLElement | null>;
  lockScroll?: boolean;
  children: ReactNode;
}

export default function ModalShell({
  onClose,
  labelledBy,
  describedBy,
  className,
  overlayClassName,
  id,
  initialFocus,
  returnFocusRef,
  lockScroll = true,
  children,
}: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const initialFocusRef = useRef(initialFocus);
  const returnFocusTargetRef = useRef(returnFocusRef);

  useEffect(() => {
    initialFocusRef.current = initialFocus;
    returnFocusTargetRef.current = returnFocusRef;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const target =
      initialFocusRef.current?.(dialog) ??
      dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      dialog;
    target.focus();

    return () => {
      const returnTarget = returnFocusTargetRef.current?.current ?? previousFocus;
      if (returnTarget && returnTarget.isConnected) returnTarget.focus();
    };
  }, []);

  useEffect(() => {
    if (!lockScroll) return;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [lockScroll]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleDialogKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (e.key === 'Escape') {
        // A child (e.g. a search field clearing its query) already handled this Escape.
        if (e.defaultPrevented) return;
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;
      const active = document.activeElement;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    },
    [onClose]
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={overlayClassName ? `modal-bd ${overlayClassName}` : 'modal-bd'} onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        id={id}
        className={className ? `modal ${className}` : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
