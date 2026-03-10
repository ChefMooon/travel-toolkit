import { useCallback } from 'react';

interface ModalProps {
  icon: string;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  compact?: boolean;
}

export default function Modal({ icon, title, body, confirmLabel, onConfirm, onCancel, compact = false }: ModalProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onCancel();
    },
    [onCancel]
  );

  return (
    <div className={`modal-bd ${compact ? 'modal-bd-compact' : ''}`} onClick={handleBackdropClick}>
      <div className={`modal ${compact ? 'modal-compact' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-ico">{icon}</div>
        <div className="modal-title">{title}</div>
        <div className="modal-body">{body}</div>
        <div className="modal-acts">
          <button className="btn-m-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-m-confirm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
