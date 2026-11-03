import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from 'react';

// Dialogs register an element here so toasts render inside the aria-modal dialog
// (reachable by Tab within the focus trap and exposed to screen readers).
let hosts: HTMLElement[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getTopHost(): HTMLElement | null {
  return hosts[hosts.length - 1] ?? null;
}

function getServerHost(): HTMLElement | null {
  return null;
}

/**
 * Ref callback: place the returned ref on an element inside a dialog to host toasts while it is
 * mounted and `active`. Pass `active: false` as soon as the dialog starts closing (it is inert
 * then), so new toasts go to the next host or the global viewport instead.
 */
export function useToastHost(active = true): (el: HTMLElement | null) => void {
  const elementRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef(active);
  const registeredRef = useRef<HTMLElement | null>(null);

  const sync = useCallback(() => {
    const next = activeRef.current ? elementRef.current : null;
    const previous = registeredRef.current;
    if (previous === next) return;
    if (previous) hosts = hosts.filter((host) => host !== previous);
    registeredRef.current = next;
    if (next) hosts = [...hosts, next];
    emit();
  }, []);

  useLayoutEffect(() => {
    activeRef.current = active;
    sync();
  }, [active, sync]);

  return useCallback((el: HTMLElement | null) => {
    elementRef.current = el;
    sync();
  }, [sync]);
}

export function useTopToastHost(): HTMLElement | null {
  return useSyncExternalStore(subscribe, getTopHost, getServerHost);
}
