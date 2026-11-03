import i18n from '@/i18n';
import { activeLocale, formatCurrency, formatDate } from '@/i18n/format';
import { isValidDateOnly } from '@/components/DatePicker/dateUtils';

export function formatRelativeTime(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) {
    return i18n.t('unknownSaveTime');
  }

  const seconds = Math.round((Date.now() - timestamp) / 1000);
  const absSeconds = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(activeLocale(), { numeric: 'auto' });

  if (absSeconds < 60) {
    return rtf.format(-seconds, 'second');
  }
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return rtf.format(-minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return rtf.format(-hours, 'hour');
  }
  const days = Math.round(hours / 24);
  return rtf.format(-days, 'day');
}

function dateOnlyToUtc(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Localized "4–16 Jun 2026" style range; null when the trip has no (valid) start date. */
export function formatTripDates(start?: string, end?: string): string | null {
  if (!start || !isValidDateOnly(start)) return null;
  // Date-only values are formatted in UTC so the day never shifts with the viewer's time zone.
  const format = new Intl.DateTimeFormat(activeLocale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const startDate = dateOnlyToUtc(start);
  if (!end || !isValidDateOnly(end) || end <= start) return format.format(startDate);
  const endDate = dateOnlyToUtc(end);
  // formatRange (ES2021) merges shared parts ("4–16 Jun 2026"); the lib target here is ES2020.
  const ranged = format as Intl.DateTimeFormat & { formatRange?: (from: Date, to: Date) => string };
  return ranged.formatRange ? ranged.formatRange(startDate, endDate) : `${format.format(startDate)} – ${format.format(endDate)}`;
}

/** Currency text that never throws: a saved slot may hold a code Intl rejects. */
export function formatSlotMoney(value: number, currency: string): string {
  try {
    return formatCurrency(value, currency);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Exact local date and time of a save, e.g. "Nov 3, 2026, 6:14 AM". */
export function formatSavedAt(iso: string, hour12: boolean): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return i18n.t('unknownSaveTime');
  return formatDate(new Date(timestamp), { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12 });
}
