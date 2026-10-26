import { useMemo } from 'react';
import type { DateTime } from 'luxon';
import { useTimezoneStore } from '@/store/timezoneStore';
import ClockCard from './ClockCard';
import { Plus } from 'lucide-react';

interface ClockGridProps {
  now: DateTime;
  onAddTimezone?: () => void;
}

export default function ClockGrid({ now, onAddTimezone = () => {} }: ClockGridProps) {
  const trackedZones = useTimezoneStore((state) => state.trackedZones);
  const orderedZones = useMemo(
    () => [...trackedZones].sort((a, b) => a.order - b.order),
    [trackedZones]
  );

  if (orderedZones.length === 0) {
    return (
      <div className="tool-status timezone-empty-state">
        <span>No timezones tracked yet.</span>
        <button
          className="btn-add"
          onClick={(event) => {
            event.currentTarget.focus();
            onAddTimezone();
          }}
        >
          <Plus size={14} /> Add timezone
        </button>
      </div>
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
