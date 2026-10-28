import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLocalDate } from './useLocalDate';

afterEach(() => vi.useRealTimers());

describe('useLocalDate', () => {
  it('keeps only one midnight timer when focus or visibility refreshes the date', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useLocalDate());
    expect(vi.getTimerCount()).toBe(1);
    act(() => window.dispatchEvent(new Event('focus')));
    expect(vi.getTimerCount()).toBe(1);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
