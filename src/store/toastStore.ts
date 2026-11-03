import { create } from 'zustand';
import i18n from '@/i18n';

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs: number;
  action?: ToastAction;
}

interface ToastInput {
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
  action?: ToastAction;
}

interface ToastStore {
  toasts: ToastItem[];
  pushToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

function generateToastId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getSaveFailureCopy(error: unknown, mode: 'new' | 'edit'): Pick<ToastItem, 'type' | 'title' | 'message'> {
  const title = i18n.t(mode === 'new' ? 'couldNotSaveNewCost' : 'couldNotSaveCostChanges');

  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return {
        type: 'error',
        title,
        message: i18n.t('browserStorageFull'),
      };
    }

    if (error.name === 'SecurityError') {
      return {
        type: 'error',
        title,
        message: i18n.t('browserStorageBlocked'),
      };
    }
  }

  if (error instanceof Error && /storage|persist|localStorage/i.test(error.message)) {
    return {
      type: 'error',
      title,
      message: i18n.t('storageFailedSaving'),
    };
  }

  return {
    type: 'error',
    title,
    message: i18n.t('unexpectedSaveError'),
  };
}

// Toasts with an action stay longer so there is time to reach the button.
const DEFAULT_DURATION_MS = 4800;
const DEFAULT_ACTION_DURATION_MS = 8000;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = generateToastId();
    const nextToast: ToastItem = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      durationMs: toast.durationMs ?? (toast.action ? DEFAULT_ACTION_DURATION_MS : DEFAULT_DURATION_MS),
      action: toast.action,
    };

    set((state) => ({ toasts: [...state.toasts, nextToast] }));
    return id;
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));
