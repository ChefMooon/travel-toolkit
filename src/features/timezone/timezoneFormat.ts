import { DateTime } from 'luxon';
import { activeLocale } from '@/i18n/format';

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

export function getClockDisplayData(now: DateTime, tz: string): ClockDisplayData {
  const dt = now.setZone(tz).setLocale(activeLocale());
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
