import type { DateTime } from 'luxon';
import type { TrackedZone } from '@/store/timezoneStore';
import AnalogClock from './AnalogClock';
import DigitalClock from './DigitalClock';
import { getClockDisplayData } from './timezones';

interface ClockCardProps {
  zone: TrackedZone;
  now: DateTime;
}

export default function ClockCard({ zone, now }: ClockCardProps) {
  const data = getClockDisplayData(now, zone.tz);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">{zone.label}</span>
        {zone.displayMode === 'analog' && zone.showUTC && (
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
