import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { prefersReducedMotion, usePresence, usePrefersReducedMotion } from '@/lib/motion';

function stubMatchMedia(reduce: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: reduce,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      query.matches = next;
      listeners.forEach((fn) => fn());
    },
  };
}

describe('motion helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
    // jsdom has no matchMedia; restore that
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it('treats a missing matchMedia as reduced motion', () => {
    expect(prefersReducedMotion()).toBe(true);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(true);
  });

  it('reads and follows the media query', () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => media.set(true));
    expect(result.current).toBe(true);
  });

  it('usePresence unmounts immediately without matchMedia', () => {
    const { result, rerender } = renderHook(({ open }) => usePresence(open), { initialProps: { open: true } });
    expect(result.current).toEqual({ mounted: true, state: 'open' });
    rerender({ open: false });
    expect(result.current.mounted).toBe(false);
  });

  it('usePresence lingers for exitMs when motion is allowed', () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    const { result, rerender } = renderHook(({ open }) => usePresence(open, { exitMs: 100 }), {
      initialProps: { open: true },
    });
    rerender({ open: false });
    expect(result.current).toEqual({ mounted: true, state: 'closing' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.mounted).toBe(false);
    rerender({ open: true });
    expect(result.current).toEqual({ mounted: true, state: 'open' });
  });
});
