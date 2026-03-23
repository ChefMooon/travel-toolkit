import { DateTime } from 'luxon';
import type { TrackedZone } from '@/store/timezoneStore';

export interface TimezoneOption {
  tz: string;
  label: string;
  offset: string;
  offsetMinutes: number;
}

export interface ClockDisplayData {
  time24: string;
  time12: string;
  timeCompact: string;
  date: string;
  utcLabel: string;
  offsetMinutes: number;
  hourDeg: number;
  minuteDeg: number;
  secondDeg: number;
}

export function buildTimezoneOptions(): TimezoneOption[] {
  const intlWithSupported = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };
  const zones = intlWithSupported.supportedValuesOf
    ? intlWithSupported.supportedValuesOf('timeZone')
    : [Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'];

  return zones
    .map((tz) => {
      const now = DateTime.now().setZone(tz);
      return {
        tz,
        label: tz.replace(/_/g, ' '),
        offset: `UTC${now.toFormat('ZZ')}`,
        offsetMinutes: now.offset,
      };
    })
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes);
}

export function getClockDisplayData(now: DateTime, tz: string): ClockDisplayData {
  const dt = now.setZone(tz);
  const hour = dt.hour % 12;
  const minute = dt.minute;
  const second = dt.second;

  return {
    time24: dt.toFormat('HH:mm:ss'),
    time12: dt.toFormat('hh:mm:ss a'),
    timeCompact: dt.toFormat('HH:mm'),
    date: dt.toFormat('ccc, LLL dd'),
    utcLabel: `UTC${dt.toFormat('ZZ')}`,
    offsetMinutes: dt.offset,
    hourDeg: hour * 30 + minute * 0.5,
    minuteDeg: minute * 6 + second * 0.1,
    secondDeg: second * 6,
  };
}

export function createTrackedZone(tz: string, label: string, order: number): TrackedZone {
  return {
    id: crypto.randomUUID(),
    tz,
    label,
    order,
    displayMode: 'digital',
    detailLevel: 'detailed',
    showUTC: true,
    showDate: true,
    showSeconds: false,
  };
}
