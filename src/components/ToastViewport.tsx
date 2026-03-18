import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

export default function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    for (const toast of toasts) {
      if (timersRef.current.has(toast.id)) continue;

      const timeoutId = window.setTimeout(() => {
        removeToast(toast.id);
        timersRef.current.delete(toast.id);
      }, toast.durationMs);

      timersRef.current.set(toast.id, timeoutId);
    }

    for (const [id, timeoutId] of timersRef.current.entries()) {
      if (toasts.some((toast) => toast.id === id)) continue;
      window.clearTimeout(timeoutId);
      timersRef.current.delete(id);
    }
  }, [toasts, removeToast]);

  useEffect(() => {
    return () => {
      for (const timeoutId of timersRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      timersRef.current.clear();
    };
  }, []);

  return (
    <div className="toast-viewport" aria-label="Notifications" role="region">
      {toasts.map((toast) => {
        const liveMode = toast.type === 'error' ? 'assertive' : 'polite';

        return (
          <article
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="status"
            aria-live={liveMode}
          >
            <div className="toast-copy">
              <p className="toast-title">{toast.title}</p>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => removeToast(toast.id)}
            >
              <X size={16} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
