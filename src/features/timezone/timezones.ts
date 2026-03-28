import type { TrackedZone } from '@/store/timezoneStore';

export interface TimezoneOption {
  tz: string;
  label: string;
  offset: string;
  offsetMinutes: number;
}

function buildOffsetInfo(tz: string): { offset: string; offsetMinutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date());

  const zoneName = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+00:00';
  const match = zoneName.match(/([+-])(\d{1,2}):(\d{2})/);

  if (!match) {
    return { offset: 'UTC+00:00', offsetMinutes: 0 };
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number.parseInt(match[2] ?? '0', 10);
  const minutes = Number.parseInt(match[3] ?? '0', 10);
  const totalMinutes = sign * (hours * 60 + minutes);

  return {
    offset: `UTC${sign < 0 ? '-' : '+'}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    offsetMinutes: totalMinutes,
  };
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
      const { offset, offsetMinutes } = buildOffsetInfo(tz);

      return {
        tz,
        label: tz.replace(/_/g, ' '),
        offset,
        offsetMinutes,
      };
    })
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes);
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
