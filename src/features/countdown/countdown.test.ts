import { describe, expect, it } from 'vitest';
import { calculateCountdown } from './countdown';

describe('calculateCountdown', () => {
  it('validates inputs and reports upcoming, same-day, and one-day counts', () => {
    expect(calculateCountdown('', '', '2026-10-27')).toEqual({ kind: 'empty' });
    expect(calculateCountdown('', '2026-10-28', '2026-10-27')).toEqual({ kind: 'invalid' });
    expect(calculateCountdown('2026-10-28', '', '2026-10-27')).toEqual({ kind: 'upcoming', daysUntil: 1 });
    expect(calculateCountdown('2026-10-27', '', '2026-10-27')).toEqual({ kind: 'today' });
    expect(calculateCountdown('2026-10-27', '2026-10-27', '2026-10-27')).toEqual({ kind: 'today' });
    expect(calculateCountdown('2026-02-30', '', '2026-10-27')).toEqual({ kind: 'invalid' });
    expect(calculateCountdown('0001-01-02', '', '0001-01-01')).toEqual({ kind: 'upcoming', daysUntil: 1 });
  });

  it('uses UTC calendar ordinals across DST boundaries and makes end date inclusive', () => {
    expect(calculateCountdown('2026-03-08', '', '2026-03-07')).toEqual({ kind: 'upcoming', daysUntil: 1 });
    expect(calculateCountdown('2026-03-06', '2026-03-10', '2026-03-08')).toEqual({ kind: 'active', daysRemaining: 2, duration: 5 });
    expect(calculateCountdown('2026-03-06', '2026-03-10', '2026-03-10')).toEqual({ kind: 'lastDay', duration: 5 });
    expect(calculateCountdown('2026-03-06', '2026-03-10', '2026-03-11')).toEqual({ kind: 'ended', daysAgo: 1, duration: 5 });
    expect(calculateCountdown('2026-03-06', '', '2026-03-10')).toEqual({ kind: 'elapsed', daysAgo: 4 });
  });

  it('rejects end dates before start dates', () => {
    expect(calculateCountdown('2026-10-28', '2026-10-27', '2026-10-27')).toEqual({ kind: 'invalid' });
  });
});
