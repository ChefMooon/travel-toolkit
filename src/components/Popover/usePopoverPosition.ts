import { useLayoutEffect, useRef, useState, type DependencyList } from 'react';

export interface UsePopoverPositionOptions<T> {
  open: boolean;
  /** Reads refs/rects at call time; return `null`/`undefined` to keep the current value. */
  compute: () => T | null | undefined;
  /** Value before the first measurement (e.g. a hidden style). */
  initial: T;
  /** Restore `initial` when the popover closes; otherwise the last position is kept. */
  resetOnClose?: boolean;
  /** Extra values that trigger a re-measure while open. */
  deps?: DependencyList;
  /** Where the capture-phase scroll listener is attached (default `window`). */
  scrollTarget?: 'window' | 'document';
  /** Also re-measure on `window.visualViewport` resize and scroll. */
  visualViewport?: boolean;
  /** Re-measure once more on the next animation frame after opening. */
  remeasureOnFrame?: boolean;
}

/**
 * Measures an anchored popover before paint while open and re-measures on
 * window resize and any (capture-phase) scroll.
 */
export function usePopoverPosition<T>({ open, compute, initial, resetOnClose = false, deps = [], scrollTarget = 'window', visualViewport = false, remeasureOnFrame = false }: UsePopoverPositionOptions<T>): T {
  const [position, setPosition] = useState<T>(initial);
  const computeRef = useRef(compute);
  const initialRef = useRef(initial);
  useLayoutEffect(() => { computeRef.current = compute; initialRef.current = initial; });

  useLayoutEffect(() => {
    if (!open) {
      if (resetOnClose) setPosition(initialRef.current);
      return;
    }
    const update = () => {
      const next = computeRef.current();
      if (next != null) setPosition(next);
    };
    update();
    const scroller = scrollTarget === 'document' ? document : window;
    const viewport = visualViewport ? window.visualViewport : null;
    window.addEventListener('resize', update);
    scroller.addEventListener('scroll', update, true);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    const frame = remeasureOnFrame ? requestAnimationFrame(update) : 0;
    return () => {
      if (remeasureOnFrame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', update); scroller.removeEventListener('scroll', update, true);
      viewport?.removeEventListener('resize', update); viewport?.removeEventListener('scroll', update);
    };
  }, [open, resetOnClose, scrollTarget, visualViewport, remeasureOnFrame, ...deps]);

  return position;
}
