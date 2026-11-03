import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import type { ToastItem } from '@/store/toastStore';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '@/lib/motion';
import { useTopToastHost } from './toastHost';

const EXIT_MS = 180;

interface TimerEntry {
  timeoutId: number | null;
  remainingMs: number;
  startedAt: number;
}

export default function ToastViewport() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const host = useTopToastHost();
  const reduced = usePrefersReducedMotion();
  const timersRef = useRef<Map<string, TimerEntry>>(new Map());
  const hoveredRef = useRef<Set<string>>(new Set());
  const focusedRef = useRef<Set<string>>(new Set());
  const [prevToasts, setPrevToasts] = useState<ToastItem[]>(toasts);
  const [closing, setClosing] = useState<ToastItem[]>([]);

  // Keep removed toasts around briefly so the exit animation can play (derived during render to avoid a flicker).
  if (prevToasts !== toasts) {
    setPrevToasts(toasts);
    if (!reduced) {
      const removed = prevToasts.filter(
        (prev) => !toasts.some((toast) => toast.id === prev.id) && !closing.some((c) => c.id === prev.id)
      );
      if (removed.length > 0) setClosing([...closing, ...removed]);
    }
  }

  useEffect(() => {
    if (closing.length === 0) return;
    const timeoutId = window.setTimeout(() => setClosing([]), EXIT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [closing]);

  const startTimer = (id: string, entry: TimerEntry) => {
    entry.startedAt = Date.now();
    entry.timeoutId = window.setTimeout(() => {
      timersRef.current.delete(id);
      hoveredRef.current.delete(id);
      focusedRef.current.delete(id);
      removeToast(id);
    }, entry.remainingMs);
  };

  const pauseTimer = (id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry || entry.timeoutId === null) return;
    window.clearTimeout(entry.timeoutId);
    entry.timeoutId = null;
    entry.remainingMs = Math.max(0, entry.remainingMs - (Date.now() - entry.startedAt));
  };

  const resumeTimer = (id: string) => {
    const entry = timersRef.current.get(id);
    if (!entry || entry.timeoutId !== null) return;
    if (hoveredRef.current.has(id) || focusedRef.current.has(id)) return;
    startTimer(id, entry);
  };

  useEffect(() => {
    for (const toast of toasts) {
      if (timersRef.current.has(toast.id)) continue;
      const entry: TimerEntry = { timeoutId: null, remainingMs: toast.durationMs, startedAt: 0 };
      timersRef.current.set(toast.id, entry);
      startTimer(toast.id, entry);
    }

    for (const [id, entry] of timersRef.current.entries()) {
      if (toasts.some((toast) => toast.id === id)) continue;
      if (entry.timeoutId !== null) window.clearTimeout(entry.timeoutId);
      timersRef.current.delete(id);
      hoveredRef.current.delete(id);
      focusedRef.current.delete(id);
    }
    // startTimer only reads refs and the stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts, removeToast]);

  // Moving the list into another host remounts it, so pointer/focus state is stale: resume everything.
  useEffect(() => {
    hoveredRef.current.clear();
    focusedRef.current.clear();
    for (const id of timersRef.current.keys()) resumeTimer(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const entry of timers.values()) {
        if (entry.timeoutId !== null) window.clearTimeout(entry.timeoutId);
      }
      timers.clear();
    };
  }, []);

  const setActive = (set: Set<string>, id: string, active: boolean) => {
    if (active) {
      set.add(id);
      pauseTimer(id);
    } else {
      set.delete(id);
      resumeTimer(id);
    }
  };

  const renderToast = (toast: ToastItem, isClosing: boolean) => {
    const liveMode = toast.type === 'error' ? 'assertive' : 'polite';

    return (
      <article
        key={toast.id}
        className={`toast toast-${toast.type}`}
        role="status"
        aria-live={liveMode}
        data-state={isClosing ? 'closing' : 'open'}
        onMouseEnter={() => setActive(hoveredRef.current, toast.id, true)}
        onMouseLeave={() => setActive(hoveredRef.current, toast.id, false)}
        onFocus={() => setActive(focusedRef.current, toast.id, true)}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setActive(focusedRef.current, toast.id, false);
        }}
      >
        <div className="toast-copy">
          <p className="toast-title">{toast.title}</p>
          <p className="toast-message">{toast.message}</p>
        </div>
        {toast.action && (
          <button
            type="button"
            className="toast-action"
            disabled={isClosing}
            onClick={() => {
              toast.action?.onAction();
              removeToast(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          className="toast-dismiss"
          aria-label={t('dismissNotification')}
          disabled={isClosing}
          onClick={() => removeToast(toast.id)}
        >
          <X size={16} />
        </button>
      </article>
    );
  };

  const list = (
    <div className="toast-viewport" aria-label={t('toastNotifications')} role="region">
      {toasts.map((toast) => renderToast(toast, false))}
      {closing
        .filter((toast) => !toasts.some((live) => live.id === toast.id))
        .map((toast) => renderToast(toast, true))}
    </div>
  );

  return host ? createPortal(list, host) : list;
}
