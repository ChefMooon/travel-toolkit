export interface ListNavigationOptions {
  /** Currently active index (-1 = no active option). */
  current: number;
  /** Number of options in the list. */
  count: number;
  /** Arrow keys wrap around both ends (modulo). */
  wrap?: boolean;
  /** Handle Home/End (jump to first/last option). */
  homeEnd?: boolean;
  /** Clamp instead of skipping: ArrowUp can reach -1 ("no active option"); an empty list yields -1. */
  allowNone?: boolean;
  /** Options to skip (only used when neither `wrap` nor `allowNone` is set). */
  isDisabled?: (index: number) => boolean;
}

/**
 * Pure active-index arithmetic for listbox keyboard navigation (ArrowUp/ArrowDown, optionally Home/End).
 * Returns the next active index, or `undefined` when the key is not handled / there is nothing to do.
 * Three modes, matching the existing callers:
 * - `wrap`: modulo wrap (Select).
 * - `allowNone`: clamp to [-1, count - 1] (Forecast destination search).
 * - default: skip disabled options without wrapping; ArrowUp from none goes to the last enabled option;
 *   stays on `current` when no enabled option exists in that direction (Timezone search).
 */
export function nextActiveIndex(key: string, { current, count, wrap = false, homeEnd = false, allowNone = false, isDisabled }: ListNavigationOptions): number | undefined {
  if (key === 'Home' || key === 'End') {
    if (!homeEnd || count === 0) return undefined;
    return key === 'Home' ? 0 : count - 1;
  }
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return undefined;
  const down = key === 'ArrowDown';
  if (count === 0) return allowNone ? -1 : undefined;
  if (wrap) return (current + (down ? 1 : count - 1)) % count;
  if (allowNone) return down ? Math.min(current + 1, count - 1) : Math.max(current - 1, -1);

  const direction = down ? 1 : -1;
  const start = down ? current + 1 : current < 0 ? count - 1 : current - 1;
  for (let index = start; index >= 0 && index < count; index += direction) {
    if (!isDisabled?.(index)) return index;
  }
  return current;
}
