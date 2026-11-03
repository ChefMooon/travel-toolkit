import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/motion';
import type { SaveSlot } from '@/store/types';
import { computeSlotDetails, isUnavailable, type SlotDetails, type SlotDetailsResult, type SlotUnavailableReason } from './slotDetails';

/** A result ready within this long renders straight away (no skeleton at all). */
export const SKELETON_DELAY_MS = 150;
/** Once revealed, the skeleton stays at least this long so it never flickers. */
export const SKELETON_MIN_MS = 350;
/** Cross-fade from the skeleton to the content (CSS owns the actual duration; instant when reduced). */
export const FADE_MS = 180;

export type SlotDetailsState = 'idle' | 'pending' | 'skeleton' | 'ready' | 'unavailable';

export interface SlotDetailsView {
  state: SlotDetailsState;
  details: SlotDetails | null;
  unavailable: SlotUnavailableReason | null;
  /** The skeleton was shown, so the content cross-fades in (never under reduced motion). */
  fade: boolean;
  /** For aria-busy: a result is on its way. */
  busy: boolean;
}

/** Runs `task` later and returns a canceller. */
export type ScheduleCompute = (task: () => void) => () => void;

// A Worker (or an idle callback) can replace this later without touching the hook.
const defaultScheduleCompute: ScheduleCompute = (task) => {
  const id = setTimeout(task, 0);
  return () => clearTimeout(id);
};
let scheduleCompute: ScheduleCompute = defaultScheduleCompute;

/** Test seam: swap the scheduler (null restores the default). */
export function setScheduleCompute(next: ScheduleCompute | null) {
  scheduleCompute = next ?? defaultScheduleCompute;
}

// Keyed by trip and save time: a rename does not change the totals, and Undo restoring a slot
// restores its old key. Totals live only here, never on a slot or in a store.
const cache = new Map<string, SlotDetailsResult>();

export function slotDetailsKey(slot: SaveSlot): string {
  return `${slot.tripId}:${slot.savedAt}`;
}

export function clearSlotDetailsCache() {
  cache.clear();
}

export function isDetailsBusy(state: SlotDetailsState): boolean {
  return state === 'pending' || state === 'skeleton';
}

type Phase = { key: string; state: 'pending' | 'skeleton' | 'ready'; result: SlotDetailsResult | null; fade: boolean };

function viewOf(state: SlotDetailsState, result: SlotDetailsResult | null, fade: boolean): SlotDetailsView {
  const settled = result && state === 'ready' ? result : null;
  const unavailable = settled && isUnavailable(settled) ? settled.unavailable : null;
  const finalState: SlotDetailsState = unavailable ? 'unavailable' : state;
  return {
    state: finalState,
    details: settled && !isUnavailable(settled) ? settled : null,
    unavailable,
    fade,
    busy: isDetailsBusy(finalState),
  };
}

/**
 * Details for a saved trip, calculated off the render path. Rule: a result within
 * SKELETON_DELAY_MS renders immediately; otherwise a skeleton is revealed at that point and stays
 * for at least SKELETON_MIN_MS before the content cross-fades in. A cache hit is immediate.
 */
export function useSlotDetails(slot: SaveSlot | null, enabled: boolean): SlotDetailsView {
  const reduced = usePrefersReducedMotion();
  const key = slot ? slotDetailsKey(slot) : null;
  const cached = enabled && key ? cache.get(key) : undefined;
  const [phase, setPhase] = useState<Phase | null>(null);
  const slotRef = useRef(slot);
  slotRef.current = slot;

  useEffect(() => {
    const current = slotRef.current;
    if (!enabled || !key || !current || cache.has(key)) return;
    // Tokens: leaving (slot changes, disabled, unmount) flips this, so a late result is dropped.
    let stale = false;
    let skeletonShownAt = 0;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    setPhase({ key, state: 'pending', result: null, fade: false });

    const skeletonTimer = setTimeout(() => {
      if (stale) return;
      skeletonShownAt = Date.now();
      setPhase({ key, state: 'skeleton', result: null, fade: !reduced });
    }, SKELETON_DELAY_MS);

    const cancelCompute = scheduleCompute(() => {
      if (stale) return;
      const result = computeSlotDetails(current);
      cache.set(key, result);
      clearTimeout(skeletonTimer);
      if (!skeletonShownAt) {
        setPhase({ key, state: 'ready', result, fade: false });
        return;
      }
      const remaining = Math.max(0, SKELETON_MIN_MS - (Date.now() - skeletonShownAt));
      const reveal = () => setPhase({ key, state: 'ready', result, fade: !reduced });
      if (remaining === 0) reveal();
      else {
        revealTimer = setTimeout(() => {
          if (!stale) reveal();
        }, remaining);
      }
    });

    return () => {
      stale = true;
      clearTimeout(skeletonTimer);
      clearTimeout(revealTimer);
      cancelCompute();
    };
  }, [enabled, key, reduced]);

  if (!enabled || !key) return viewOf('idle', null, false);
  // The phase wins over the cache: the cache is filled when the compute ends, but a revealed skeleton
  // still has to be held for SKELETON_MIN_MS.
  if (phase && phase.key === key) return viewOf(phase.state, phase.result, phase.fade);
  if (cached) return viewOf('ready', cached, false);
  return viewOf('pending', null, false);
}
