import type { TrackedZone } from '@/store/timezoneStore';
import type { ClockDisplayData } from './timezones';

interface DigitalClockProps {
  displayData: ClockDisplayData;
  zone: TrackedZone;
}

function removeSeconds(time: string): string {
  return time.replace(/:(\d{2})(\s[AP]M)?$/, '$2').trim();
}

export default function DigitalClock({ displayData, zone }: DigitalClockProps) {
  const clockText =
    zone.detailLevel === 'compact'
      ? displayData.timeCompact
      : zone.showSeconds
        ? displayData.time12
        : removeSeconds(displayData.time12);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '8px 0',
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: zone.detailLevel === 'compact' ? 30 : 24,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {clockText}
      </div>

      {zone.showDate && (
        <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 700 }}>
          {displayData.date}
        </div>
      )}

      {zone.showUTC && (
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
            color: 'var(--text-3)',
            fontWeight: 700,
          }}
        >
          {displayData.utcLabel}
        </div>
      )}
    </div>
  );
}
