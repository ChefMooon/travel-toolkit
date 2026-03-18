import { create } from 'zustand';

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  durationMs: number;
}

interface ToastInput {
  type: ToastType;
  title: string;
  message: string;
  durationMs?: number;
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
  const saveTarget = mode === 'new' ? 'new cost entry' : 'cost changes';

  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return {
        type: 'error',
        title: `Could not save ${saveTarget}`,
        message: 'Browser storage is full. Clear some trip data in this browser and try again.',
      };
    }

    if (error.name === 'SecurityError') {
      return {
        type: 'error',
        title: `Could not save ${saveTarget}`,
        message: 'Browser storage is blocked in this context. Enable local storage and try again.',
      };
    }
  }

  if (error instanceof Error && /storage|persist|localStorage/i.test(error.message)) {
    return {
      type: 'error',
      title: `Could not save ${saveTarget}`,
      message: 'Storage failed while saving. Try refreshing and saving again.',
    };
  }

  return {
    type: 'error',
    title: `Could not save ${saveTarget}`,
    message: 'An unexpected error occurred while saving. Please try again.',
  };
}

const DEFAULT_DURATION_MS = 4800;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = generateToastId();
    const nextToast: ToastItem = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      durationMs: toast.durationMs ?? DEFAULT_DURATION_MS,
    };

    set((state) => ({ toasts: [...state.toasts, nextToast] }));
    return id;
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));
