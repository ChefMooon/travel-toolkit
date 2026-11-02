/// <reference types="vitest" />

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, renderHook } from '@testing-library/react';
import { usePopoverPosition, type UsePopoverPositionOptions } from '@/components/Popover';

type Position = { top: number } | { hidden: true };
const initial: Position = { hidden: true };

function setup(props: Partial<UsePopoverPositionOptions<Position>> & { open: boolean }) {
  let top = 0;
  const compute = vi.fn((): Position => ({ top: ++top }));
  const view = renderHook((current: Partial<UsePopoverPositionOptions<Position>> & { open: boolean }) =>
    usePopoverPosition<Position>({ compute, initial, ...current }), { initialProps: props });
  return { compute, ...view };
}

describe('usePopoverPosition', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the initial value until opened, then measures', () => {
    const { compute, result, rerender } = setup({ open: false });
    expect(result.current).toBe(initial);
    expect(compute).not.toHaveBeenCalled();

    rerender({ open: true });
    expect(compute).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual({ top: 1 });
  });

  it('re-measures on window resize and capture-phase scroll', () => {
    const { compute, result } = setup({ open: true });
    act(() => { window.dispatchEvent(new Event('resize')); });
    expect(result.current).toEqual({ top: 2 });

    const scroller = document.createElement('div');
    document.body.appendChild(scroller);
    fireEvent.scroll(scroller);
    expect(compute).toHaveBeenCalledTimes(3);
    expect(result.current).toEqual({ top: 3 });
    scroller.remove();
  });

  it('keeps the current value when compute returns null', () => {
    const compute = vi.fn((): Position | null => null);
    const { result } = renderHook(() => usePopoverPosition<Position>({ open: true, compute, initial }));
    expect(compute).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(initial);
  });

  it('re-measures when deps change while open', () => {
    const { compute, rerender } = setup({ open: true, deps: [1] });
    rerender({ open: true, deps: [2] });
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('removes listeners on close and unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { compute, rerender, unmount } = setup({ open: true });
    rerender({ open: false });
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    act(() => { window.dispatchEvent(new Event('resize')); window.dispatchEvent(new Event('scroll')); });
    expect(compute).toHaveBeenCalledTimes(1);

    rerender({ open: true });
    removeSpy.mockClear();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });

  it('keeps the last position after closing by default', () => {
    const { result, rerender } = setup({ open: true });
    rerender({ open: false });
    expect(result.current).toEqual({ top: 1 });
  });

  it('restores the initial value on close with resetOnClose', () => {
    const { result, rerender } = setup({ open: true, resetOnClose: true });
    expect(result.current).toEqual({ top: 1 });
    rerender({ open: false, resetOnClose: true });
    expect(result.current).toBe(initial);
  });

  it('attaches the capture scroll listener to document with scrollTarget document', () => {
    const docAdd = vi.spyOn(document, 'addEventListener');
    const winAdd = vi.spyOn(window, 'addEventListener');
    const docRemove = vi.spyOn(document, 'removeEventListener');
    const { compute, unmount } = setup({ open: true, scrollTarget: 'document' });
    expect(docAdd).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(winAdd).not.toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(winAdd).toHaveBeenCalledWith('resize', expect.any(Function));
    act(() => { document.dispatchEvent(new Event('scroll')); });
    expect(compute).toHaveBeenCalledTimes(2);
    unmount();
    expect(docRemove).toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });

  it('re-measures on visualViewport resize and scroll when enabled', () => {
    const viewport = new EventTarget();
    const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    try {
      const { compute, unmount } = setup({ open: true, visualViewport: true });
      act(() => { viewport.dispatchEvent(new Event('resize')); viewport.dispatchEvent(new Event('scroll')); });
      expect(compute).toHaveBeenCalledTimes(3);
      unmount();
      act(() => { viewport.dispatchEvent(new Event('resize')); });
      expect(compute).toHaveBeenCalledTimes(3);

      const off = setup({ open: true });
      act(() => { viewport.dispatchEvent(new Event('resize')); });
      expect(off.compute).toHaveBeenCalledTimes(1);
      off.unmount();
    } finally {
      if (original) Object.defineProperty(window, 'visualViewport', original);
      else delete (window as { visualViewport?: unknown }).visualViewport;
    }
  });

  it('re-measures once on the next frame with remeasureOnFrame and cancels it on close', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callbacks.push(callback); return callbacks.length; });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const { compute, result, rerender } = setup({ open: true, remeasureOnFrame: true });
    expect(callbacks).toHaveLength(1);
    act(() => { callbacks[0]!(0); });
    expect(compute).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ top: 2 });
    rerender({ open: false, remeasureOnFrame: true });
    expect(cancel).toHaveBeenCalledWith(1);

    callbacks.length = 0;
    setup({ open: true });
    expect(callbacks).toHaveLength(0);
  });
});
