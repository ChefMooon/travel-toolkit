import { DateTime } from 'luxon';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildTimezoneOptions,
  createTrackedZone,
  getClockDisplayData,
} from './timezones';

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

  it('buildTimezoneOptions falls back when Intl.supportedValuesOf is unavailable', () => {
    const fallbackTz = 'Europe/Paris';

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      (() =>
        ({
          resolvedOptions: () => ({ timeZone: fallbackTz }),
        }) as Intl.DateTimeFormat) as typeof Intl.DateTimeFormat
    );

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
