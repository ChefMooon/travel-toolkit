/// <reference types="vitest" />

import { describe, expect, it } from 'vitest';
import { nextActiveIndex } from '@/components/Popover';

const KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'a'] as const;
const disabledFrom = (set: readonly number[]) => (index: number) => set.includes(index);

describe('nextActiveIndex: Select config (wrap + homeEnd)', () => {
  const select = (key: string, current: number, count: number) => nextActiveIndex(key, { current, count, wrap: true, homeEnd: true });

  it.each([
    ['ArrowDown', 0, 3, 1], ['ArrowDown', 2, 3, 0], ['ArrowUp', 0, 3, 2], ['ArrowUp', 1, 3, 0],
    ['ArrowDown', 0, 1, 0], ['ArrowUp', 0, 1, 0], ['Home', 2, 3, 0], ['End', 0, 3, 2],
    ['ArrowDown', 0, 0, undefined], ['Home', 0, 0, undefined], ['End', 0, 0, undefined], ['Enter', 0, 3, undefined],
  ] as const)('%s from %i of %i -> %s', (key, current, count, expected) => {
    expect(select(key, current, count)).toBe(expected);
  });
});

describe('nextActiveIndex: Timezone config (skip disabled, no wrap)', () => {
  const tz = (key: string, current: number, count: number, disabled: number[] = []) => nextActiveIndex(key, { current, count, isDisabled: disabledFrom(disabled) });

  it.each([
    ['ArrowDown', -1, 3, [], 0], ['ArrowDown', 0, 3, [], 1], ['ArrowDown', 2, 3, [], 2],
    ['ArrowUp', -1, 3, [], 2], ['ArrowUp', 2, 3, [], 1], ['ArrowUp', 0, 3, [], 0],
    ['ArrowDown', -1, 3, [0], 1], ['ArrowDown', 0, 3, [1], 2], ['ArrowDown', 1, 3, [2], 1],
    ['ArrowUp', -1, 3, [2], 1], ['ArrowUp', 2, 3, [1], 0], ['ArrowUp', 1, 3, [0], 1],
    ['ArrowDown', -1, 3, [0, 1, 2], -1], ['ArrowUp', -1, 3, [0, 1, 2], -1], ['ArrowDown', 1, 3, [0, 1, 2], 1],
    ['ArrowDown', -1, 1, [], 0], ['ArrowUp', 0, 1, [], 0], ['ArrowDown', 5, 3, [], 5], ['ArrowUp', 3, 3, [], 2],
    ['ArrowDown', -1, 0, [], undefined], ['Home', 1, 3, [], undefined], ['End', 1, 3, [], undefined],
  ] as const)('%s from %i of %i (disabled %j) -> %s', (key, current, count, disabled, expected) => {
    expect(tz(key, current, count, [...disabled])).toBe(expected);
  });
});

describe('nextActiveIndex: Forecast config (clamp, allowNone)', () => {
  const forecast = (key: string, current: number, count: number) => nextActiveIndex(key, { current, count, allowNone: true });

  it.each([
    ['ArrowDown', -1, 3, 0], ['ArrowDown', 2, 3, 2], ['ArrowDown', 5, 3, 2], ['ArrowUp', 0, 3, -1], ['ArrowUp', -1, 3, -1],
    ['ArrowUp', 2, 3, 1], ['ArrowDown', -1, 1, 0], ['ArrowDown', 0, 1, 0], ['ArrowDown', 1, 0, -1], ['ArrowUp', -1, 0, -1],
    ['Home', 1, 3, undefined], ['End', 1, 3, undefined], ['Enter', 1, 3, undefined],
  ] as const)('%s from %i of %i -> %s', (key, current, count, expected) => {
    expect(forecast(key, current, count)).toBe(expected);
  });
});

// Differential: the pre-refactor per-caller arithmetic, copied from HEAD and reduced to pure functions.
describe('nextActiveIndex: differential against the previous inline arithmetic', () => {
  // Select.tsx keyDown: `nextIndex` then `setActive(options[nextIndex] ?? '')`; unhandled keys never reach it.
  const oldSelect = (key: string, index: number, options: string[]): string | undefined => {
    if (!(key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End')) return undefined;
    const nextIndex = key === 'Home' ? 0 : key === 'End' ? options.length - 1 : (index + (key === 'ArrowDown' ? 1 : options.length - 1)) % options.length;
    return options[nextIndex] ?? '';
  };

  // TimezoneSelect.tsx handleSearchKeyDown + findEnabledIndex; `undefined` = key not handled.
  const oldTimezone = (key: string, index: number, count: number, disabled: (i: number) => boolean): number | undefined => {
    const findEnabledIndex = (start: number, direction: 1 | -1) => {
      for (let i = start; i >= 0 && i < count; i += direction) {
        if (!disabled(i)) return i;
      }
      return -1;
    };
    if (key === 'ArrowDown' && count > 0) {
      const next = findEnabledIndex(index + 1, 1);
      return next < 0 ? index : next;
    }
    if (key === 'ArrowUp' && count > 0) {
      const start = index < 0 ? count - 1 : index - 1;
      const next = findEnabledIndex(start, -1);
      return next < 0 ? index : next;
    }
    return undefined;
  };

  // ForecastTool.tsx handleDestinationKeyDown; `undefined` = key not handled.
  const oldForecast = (key: string, previousIndex: number, count: number): number | undefined => {
    if (key === 'ArrowDown') {
      if (count === 0) return -1;
      return Math.min(previousIndex + 1, count - 1);
    }
    if (key === 'ArrowUp') {
      if (count === 0) return -1;
      return Math.max(previousIndex - 1, -1);
    }
    return undefined;
  };

  const subsets = (count: number) => Array.from({ length: 2 ** count }, (_, mask) => Array.from({ length: count }, (_, i) => i).filter((i) => mask & (1 << i)));

  it('Select config matches for count 0..6, current -1..count', () => {
    let cases = 0;
    for (let count = 0; count <= 6; count++) {
      const options = Array.from({ length: count }, (_, i) => `opt-${i}`);
      for (let current = -1; current <= count; current++) {
        for (const key of KEYS) {
          const next = nextActiveIndex(key, { current, count, wrap: true, homeEnd: true });
          const handled = key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End';
          const actual = handled ? options[next ?? -1] ?? '' : next;
          expect(actual, `${key} current=${current} count=${count}`).toBe(oldSelect(key, current, options));
          cases++;
        }
      }
    }
    expect(cases).toBeGreaterThan(0);
  });

  it('Timezone config matches for count 0..6, current -1..count, all disabled subsets', () => {
    for (let count = 0; count <= 6; count++) {
      for (const set of subsets(count)) {
        const isDisabled = disabledFrom(set);
        for (let current = -1; current <= count; current++) {
          for (const key of KEYS) {
            expect(nextActiveIndex(key, { current, count, isDisabled }), `${key} current=${current} count=${count} disabled=${set.join(',')}`)
              .toBe(oldTimezone(key, current, count, isDisabled));
          }
        }
      }
    }
  });

  it('Forecast config matches for count 0..6, current -1..count', () => {
    for (let count = 0; count <= 6; count++) {
      for (let current = -1; current <= count; current++) {
        for (const key of KEYS) {
          expect(nextActiveIndex(key, { current, count, allowNone: true }), `${key} current=${current} count=${count}`).toBe(oldForecast(key, current, count));
        }
      }
    }
  });
});
