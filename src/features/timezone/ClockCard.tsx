import type { DateTime } from 'luxon';
import type { TrackedZone } from '@/store/timezoneStore';
import AnalogClock from './AnalogClock';
import DigitalClock from './DigitalClock';
import { getClockDisplayData } from './timezoneFormat';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from 'react-i18next';

interface ClockCardProps {
  zone: TrackedZone;
  now: DateTime;
}

export default function ClockCard({ zone, now }: ClockCardProps) {
  useTranslation();
  const data = getClockDisplayData(now, zone.tz);
  const clockFormat = useSettingsStore((s) => s.clockFormat);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">{zone.label}</span>
        {zone.showUTC && (
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: 'var(--text-3)',
              fontWeight: 700,
            }}
          >
            {data.utcLabel}
          </span>
        )}
      </div>

      <div
        className="card-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          minHeight: 162,
        }}
      >
        {zone.displayMode === 'analog' ? (
          <>
            <span className="timezone-visually-hidden">
              {clockFormat === '24h' ? data.time24 : data.time12}{zone.showDate ? `, ${data.date}` : ''}
            </span>
            <AnalogClock hourDeg={data.hourDeg} minuteDeg={data.minuteDeg} secondDeg={data.secondDeg} />
            {zone.showDate && (
              <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 700, marginTop: 4 }}>
                {data.date}
              </div>
            )}
          </>
        ) : (
          <DigitalClock displayData={data} zone={zone} />
        )}
      </div>
    </div>
  );
}
