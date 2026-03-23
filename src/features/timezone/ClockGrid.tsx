import { useMemo } from 'react';
import type { DateTime } from 'luxon';
import { useTimezoneStore } from '@/store/timezoneStore';
import ClockCard from './ClockCard';

interface ClockGridProps {
  now: DateTime;
}

export default function ClockGrid({ now }: ClockGridProps) {
  const trackedZones = useTimezoneStore((state) => state.trackedZones);
  const orderedZones = useMemo(
    () => [...trackedZones].sort((a, b) => a.order - b.order),
    [trackedZones]
  );

  if (orderedZones.length === 0) {
    return (
      <p className="tool-status">
        No timezones tracked yet. Open settings to add your first timezone.
      </p>
    );
  }

  return (
    <div
      className="timezone-clock-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 16,
      }}
    >
      {orderedZones.map((zone) => (
        <ClockCard key={zone.id} zone={zone} now={now} />
      ))}
    </div>
  );
}
