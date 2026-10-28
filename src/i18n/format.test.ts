import { afterEach, describe, expect, it } from 'vitest';
import { activateLanguage } from '@/i18n';
import { formatCurrency, formatDate, formatNumber, formatRelativeTime } from './format';
import { getBlogPostDisplayDate } from '@/lib/blogPosts';
import { calculateCountdown } from '@/features/countdown/countdown';

afterEach(async () => {
  await activateLanguage('en');
});

describe('locale-aware display formatters', () => {
  it('uses locale conventions for numbers, currency, and relative time', async () => {
    await activateLanguage('fr-CA');
    expect(formatNumber(1234.5)).toBe(new Intl.NumberFormat('fr-CA').format(1234.5));
    expect(formatNumber(1234.5)).toContain(',');
    expect(formatCurrency(1234.5, 'CAD')).toBe(new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(1234.5));
    expect(formatRelativeTime(-2, 'day')).toBe(new Intl.RelativeTimeFormat('fr-CA').format(-2, 'day'));
  });

  it('formats UTC date-only values consistently without shifting their calendar day', async () => {
    await activateLanguage('fr-CA');
    const boundary = new Date('2027-03-01T00:00:00.000Z');
    const options: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeZone: 'UTC' };
    expect(formatDate(boundary, options)).toBe(new Intl.DateTimeFormat('fr-CA', options).format(boundary));
    expect(getBlogPostDisplayDate('2027-03-01T00:00:00.000Z')).toBe(
      new Intl.DateTimeFormat('fr-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(boundary),
    );
    expect(calculateCountdown('2027-03-01', '', '2027-02-28')).toEqual({ kind: 'upcoming', daysUntil: 1 });
  });

  it('respects an explicit timezone and 12/24-hour clock choice', async () => {
    await activateLanguage('fr-CA');
    const instant = new Date('2027-03-01T03:05:00.000Z');
    for (const hour12 of [true, false]) {
      const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12, timeZone: 'America/Toronto' };
      expect(formatDate(instant, options)).toBe(new Intl.DateTimeFormat('fr-CA', options).format(instant));
    }
  });
});
