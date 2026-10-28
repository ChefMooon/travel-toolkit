import { DateTime } from 'luxon';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildTimezoneOptions,
  createTrackedZone,
} from './timezones';
import { getClockDisplayData } from './timezoneFormat';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('timezone utilities', () => {
  it('buildTimezoneOptions returns sorted options with labels and offsets', () => {
    const options = buildTimezoneOptions();

    expect(options.length).toBeGreaterThan(0);
    expect(options.every((item) => item.tz.length > 0)).toBe(true);
    expect(options.every((item) => item.label === item.tz.replace(/_/g, ' '))).toBe(true);
    expect(options.every((item) => /^UTC[+-]\d{2}:\d{2}$/.test(item.offset))).toBe(true);

    for (let i = 1; i < options.length; i++) {
      expect(options[i]!.offsetMinutes).toBeGreaterThanOrEqual(options[i - 1]!.offsetMinutes);
    }
  });

  it('buildTimezoneOptions calculates DST offsets from one supplied instant', () => {
    const winter = buildTimezoneOptions(new Date('2026-01-15T12:00:00Z'));
    const summer = buildTimezoneOptions(new Date('2026-07-15T12:00:00Z'));
    const winterNewYork = winter.find((item) => item.tz === 'America/New_York');
    const summerNewYork = summer.find((item) => item.tz === 'America/New_York');
    expect(winterNewYork?.offset).toBe('UTC-05:00');
    expect(summerNewYork?.offset).toBe('UTC-04:00');
  });

  it('localizes the timezone display name and retains the stable IANA identifier', () => {
    const english = buildTimezoneOptions(new Date('2026-01-15T12:00:00Z'), 'en-US').find((item) => item.tz === 'America/Toronto');
    const french = buildTimezoneOptions(new Date('2026-01-15T12:00:00Z'), 'fr-CA').find((item) => item.tz === 'America/Toronto');
    expect(english?.localizedLabel).toContain('Eastern Standard Time');
    expect(french?.localizedLabel).toContain('heure normale de l’Est');
    expect(french?.label).toBe('America/Toronto');
    expect(french?.tz).toBe('America/Toronto');
  });

  it('buildTimezoneOptions falls back when Intl.supportedValuesOf is unavailable', () => {
    const fallbackTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const original = (Intl as typeof Intl & { supportedValuesOf?: unknown }).supportedValuesOf;
    Object.defineProperty(Intl, 'supportedValuesOf', {
      value: undefined,
      configurable: true,
    });

    const options = buildTimezoneOptions();

    expect(options).toHaveLength(1);
    expect(options[0]!.tz).toBe(fallbackTz);

    Object.defineProperty(Intl, 'supportedValuesOf', {
      value: original,
      configurable: true,
    });
  });

  it('getClockDisplayData returns deterministic formatted values and hand degrees', () => {
    const now = DateTime.fromObject(
      { year: 2026, month: 3, day: 23, hour: 14, minute: 45, second: 30 },
      { zone: 'UTC' }
    );

    const data = getClockDisplayData(now, 'UTC');

    expect(data.time24).toBe('14:45:30');
    expect(data.time12).toBe('02:45:30 PM');
    expect(data.timeCompact).toBe('14:45');
    expect(data.date).toBe('Mon, Mar 23');
    expect(data.utcLabel).toBe('UTC+00:00');
    expect(data.offsetMinutes).toBe(0);

    expect(data.hourDeg).toBe(82.5);
    expect(data.minuteDeg).toBe(273);
    expect(data.secondDeg).toBe(180);
  });

  it('createTrackedZone creates a zone with expected defaults', () => {
    const zone = createTrackedZone('Asia/Tokyo', 'Tokyo', 4);

    expect(zone.id.length).toBeGreaterThan(0);
    expect(zone.tz).toBe('Asia/Tokyo');
    expect(zone.label).toBe('Tokyo');
    expect(zone.order).toBe(4);
    expect(zone.displayMode).toBe('digital');
    expect(zone.detailLevel).toBe('detailed');
    expect(zone.showUTC).toBe(true);
    expect(zone.showDate).toBe(true);
    expect(zone.showSeconds).toBe(false);
  });
});
