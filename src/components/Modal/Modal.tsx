import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import ModalShell from './ModalShell';

interface ModalProps {
  icon: LucideIcon;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onCancel: () => void;
}

const focusFirstButton = (dialog: HTMLElement) => dialog.querySelector<HTMLElement>('button:not(:disabled)');

export default function Modal({
  icon,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  secondaryActionLabel,
  onSecondaryAction,
  onCancel,
}: ModalProps) {
  const Icon = icon;
  const { t } = useTranslation();
  const titleId = useId();
  const bodyId = useId();

  return (
    <ModalShell onClose={onCancel} labelledBy={titleId} describedBy={bodyId} initialFocus={focusFirstButton}>
      <div className="modal-ico"><Icon size={36} aria-hidden="true" focusable="false" /></div>
      <div className="modal-title" id={titleId}>{title}</div>
      <div className="modal-body" id={bodyId}>{body}</div>
      <div className="modal-acts">
        <button className="btn-m-cancel" onClick={onCancel}>{cancelLabel ?? t('cancel')}</button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button className="btn-m-secondary" onClick={onSecondaryAction}>{secondaryActionLabel}</button>
        ) : null}
        <button className="btn-m-confirm" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </ModalShell>
  );
}
