import { useEffect, useState } from 'react';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

// Environments without matchMedia (jsdom) are treated as "reduce" so transitions stay instant.
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia(REDUCE_QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(REDUCE_QUERY);
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

interface PresenceOptions {
  exitMs?: number;
}

/** Keeps content mounted for `exitMs` after `open` turns false so an exit transition can play. */
export function usePresence(open: boolean, { exitMs = 180 }: PresenceOptions = {}) {
  const reduced = usePrefersReducedMotion();
  const delay = reduced ? 0 : exitMs;
  const [lingering, setLingering] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Adjust state during render so the closing frame never shows an unmounted gap.
  if (prevOpen !== open) {
    setPrevOpen(open);
    setLingering(!open && delay > 0);
  }

  useEffect(() => {
    if (open || !lingering) return;
    const id = window.setTimeout(() => setLingering(false), delay);
    return () => window.clearTimeout(id);
  }, [open, lingering, delay]);

  if (open) return { mounted: true, state: 'open' as const };
  return { mounted: lingering, state: 'closing' as const };
}
