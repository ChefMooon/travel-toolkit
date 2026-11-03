/// <reference types="vitest" />

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveSlot } from '@/store/types';
import { makeSlot } from './slotDetailsFixtures';
import {
  clearSlotDetailsCache,
  isDetailsBusy,
  SKELETON_DELAY_MS,
  SKELETON_MIN_MS,
  setScheduleCompute,
  slotDetailsKey,
  useSlotDetails,
  type SlotDetailsState,
} from './useSlotDetails';

// Pretend the compute finishes `ms` after it was scheduled.
function computeTakes(ms: number) {
  setScheduleCompute((task) => {
    const id = setTimeout(task, ms);
    return () => clearTimeout(id);
  });
}

function mockMotionAllowed() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function renderDetails(slot: SaveSlot | null) {
  const states: SlotDetailsState[] = [];
  const hook = renderHook(
    ({ current }: { current: SaveSlot | null }) => {
      const view = useSlotDetails(current, true);
      states.push(view.state);
      return view;
    },
    { initialProps: { current: slot } }
  );
  return { ...hook, states };
}

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe('useSlotDetails', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearSlotDetailsCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setScheduleCompute(null);
  });

  it('is idle without a slot or when disabled', () => {
    expect(renderDetails(null).result.current.state).toBe('idle');
    const { result } = renderHook(() => useSlotDetails(makeSlot(), false));
    expect(result.current.state).toBe('idle');
  });

  it('uses the default scheduler: pending first, then ready on the next task', () => {
    const { result } = renderDetails(makeSlot());
    expect(result.current.state).toBe('pending');
    expect(result.current.busy).toBe(true);
    advance(0);
    expect(result.current.state).toBe('ready');
    expect(result.current.details?.entryCount).toBe(3);
    expect(result.current.busy).toBe(false);
  });

  it('never shows a skeleton when the result is ready within the delay', () => {
    computeTakes(100);
    const { result, states } = renderDetails(makeSlot());
    advance(99);
    expect(result.current.state).toBe('pending');
    advance(1);
    expect(result.current.state).toBe('ready');
    advance(1000);
    expect(states).not.toContain('skeleton');
    expect(result.current.fade).toBe(false);
  });

  it('reveals the skeleton at 150ms and holds it for at least 350ms before the content', () => {
    mockMotionAllowed();
    computeTakes(400);
    const { result } = renderDetails(makeSlot());
    advance(SKELETON_DELAY_MS - 1);
    expect(result.current.state).toBe('pending');
    advance(1);
    expect(result.current.state).toBe('skeleton');
    expect(result.current.busy).toBe(true);

    // The result lands at 400ms but the skeleton has only been up for 250ms.
    advance(400 - SKELETON_DELAY_MS);
    expect(result.current.state).toBe('skeleton');
    advance(SKELETON_DELAY_MS + SKELETON_MIN_MS - 400 - 1);
    expect(result.current.state).toBe('skeleton');
    advance(1);
    expect(result.current.state).toBe('ready');
    expect(result.current.fade).toBe(true);
  });

  it('shows the content straight away when the result lands after the skeleton has had its minimum time', () => {
    computeTakes(2000);
    const { result } = renderDetails(makeSlot());
    advance(1999);
    expect(result.current.state).toBe('skeleton');
    advance(1);
    expect(result.current.state).toBe('ready');
  });

  it('does not fade under reduced motion (or without matchMedia)', () => {
    computeTakes(400);
    const { result } = renderDetails(makeSlot());
    advance(SKELETON_DELAY_MS);
    expect(result.current.state).toBe('skeleton');
    expect(result.current.fade).toBe(false);
    advance(SKELETON_DELAY_MS + SKELETON_MIN_MS);
    expect(result.current.state).toBe('ready');
    expect(result.current.fade).toBe(false);
  });

  it('answers a cache hit immediately, with no skeleton and no scheduled work', () => {
    const scheduler = vi.fn(() => () => {});
    setScheduleCompute(scheduler);
    const slot = makeSlot();
    // First visit fills the cache.
    setScheduleCompute((task) => { task(); return () => {}; });
    renderDetails(slot).unmount();
    setScheduleCompute(scheduler);

    const { result, states } = renderDetails(slot);
    expect(result.current.state).toBe('ready');
    expect(states).toEqual(['ready']);
    advance(1000);
    expect(scheduler).not.toHaveBeenCalled();
  });

  it('keys the cache by trip and save time, so a rename hits and a new save recomputes', () => {
    const slot = makeSlot();
    expect(slotDetailsKey({ ...slot, tripName: 'Renamed' })).toBe(slotDetailsKey(slot));
    expect(slotDetailsKey({ ...slot, savedAt: '2026-11-04T00:00:00.000Z' })).not.toBe(slotDetailsKey(slot));
  });

  it('discards a stale result after the slot changes', () => {
    computeTakes(300);
    const first = makeSlot({ tripId: '111111' }, { tripId: '111111' });
    const second = makeSlot({ tripId: '222222' }, { tripId: '222222', globalMarkup: 5 });
    const { result, rerender } = renderDetails(first);
    advance(200);
    rerender({ current: second });
    expect(result.current.state).toBe('pending');
    advance(100); // the first slot's compute would have landed here
    expect(result.current.state).toBe('pending');
    advance(200 + SKELETON_MIN_MS);
    expect(result.current.state).toBe('ready');
    expect(result.current.details?.tripId).toBe('222222');
  });

  it('drops the result and timers when unmounted', () => {
    computeTakes(300);
    const { unmount } = renderDetails(makeSlot());
    unmount();
    expect(() => advance(1000)).not.toThrow();
  });

  it('exposes unavailable results without a details payload', () => {
    const { result } = renderDetails(makeSlot({ schemaVersion: 2 }));
    advance(0);
    expect(result.current.state).toBe('unavailable');
    expect(result.current.unavailable).toBe('schema');
    expect(result.current.details).toBeNull();
  });

  it('reports busy only while pending or showing the skeleton', () => {
    expect(['idle', 'pending', 'skeleton', 'ready', 'unavailable'].map((state) => isDetailsBusy(state as SlotDetailsState))).toEqual([false, true, true, false, false]);
  });
});
