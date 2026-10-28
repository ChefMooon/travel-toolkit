import { isValidDateOnly } from '@/components/DatePicker/dateUtils';

export type CountdownResult =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'upcoming'; daysUntil: number }
  | { kind: 'today' }
  | { kind: 'active'; daysRemaining: number; duration: number }
  | { kind: 'lastDay'; duration: number }
  | { kind: 'ended'; daysAgo: number; duration: number }
  | { kind: 'elapsed'; daysAgo: number };

function ordinal(dateOnly: string): number {
  const [year = 0, month = 1, day = 1] = dateOnly.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return Math.floor(date.getTime() / 86_400_000);
}

export function getLocalDateOnly(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calculateCountdown(startDate: string, endDate: string, today: string): CountdownResult {
  if (!startDate) return endDate ? { kind: 'invalid' } : { kind: 'empty' };
  if (!isValidDateOnly(startDate) || (endDate && !isValidDateOnly(endDate)) || !isValidDateOnly(today) || (endDate && endDate < startDate)) return { kind: 'invalid' };
  const delta = ordinal(startDate) - ordinal(today);
  const duration = endDate ? ordinal(endDate) - ordinal(startDate) + 1 : undefined;
  if (delta > 0) return { kind: 'upcoming', daysUntil: delta };
  if (delta === 0) return { kind: 'today' };
  if (!endDate) return { kind: 'elapsed', daysAgo: -delta };
  const endDelta = ordinal(endDate) - ordinal(today);
  if (endDelta === 0) return { kind: 'lastDay', duration: duration! };
  return endDelta >= 0
    ? { kind: 'active', daysRemaining: endDelta, duration: duration! }
    : { kind: 'ended', daysAgo: -endDelta, duration: duration! };
}
