import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { useTimezoneStore, type DetailLevel, type DisplayMode, type TrackedZone } from '@/store/timezoneStore';

interface ZoneConfigRowProps {
  zone: TrackedZone;
}

export default function ZoneConfigRow({ zone }: ZoneConfigRowProps) {
  const updateZone = useTimezoneStore((state) => state.updateZone);
  const removeZone = useTimezoneStore((state) => state.removeZone);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: zone.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const setDisplayMode = (displayMode: DisplayMode) => {
    updateZone(zone.id, { displayMode });
  };

  const setDetailLevel = (detailLevel: DetailLevel) => {
    updateZone(zone.id, { detailLevel });
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        position: 'relative',
        background: 'var(--surface-2)',
        border: '1.5px solid var(--border)',
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <button
        className="ibtn del"
        onClick={() => removeZone(zone.id)}
        aria-label="Remove timezone"
        style={{ position: 'absolute', top: 10, right: 12, zIndex: 2 }}
      >
        <X size={14} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="ibtn"
          aria-label="Drag to reorder"
          style={{ cursor: 'grab' }}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>

        <input
          className="group-name-input"
          value={zone.label}
          onChange={(event) => updateZone(zone.id, { label: event.target.value })}
          aria-label="Timezone label"
          style={{ flex: 1, paddingRight: 34 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="sublabel" style={{ minWidth: 44 }}>Display</span>
        <div className="seg">
          <button className={`seg-btn${zone.displayMode === 'analog' ? ' on' : ''}`} onClick={() => setDisplayMode('analog')}>
            Analog
          </button>
          <button className={`seg-btn${zone.displayMode === 'digital' ? ' on' : ''}`} onClick={() => setDisplayMode('digital')}>
            Digital
          </button>
        </div>
      </div>

      {zone.displayMode === 'digital' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="sublabel" style={{ minWidth: 44 }}>Detail</span>
          <div className="seg">
            <button className={`seg-btn${zone.detailLevel === 'compact' ? ' on' : ''}`} onClick={() => setDetailLevel('compact')}>
              Compact
            </button>
            <button className={`seg-btn${zone.detailLevel === 'detailed' ? ' on' : ''}`} onClick={() => setDetailLevel('detailed')}>
              Detailed
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
          <input
            type="checkbox"
            checked={zone.showUTC}
            onChange={(event) => updateZone(zone.id, { showUTC: event.target.checked })}
          />
          Show UTC
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
          <input
            type="checkbox"
            checked={zone.showDate}
            onChange={(event) => updateZone(zone.id, { showDate: event.target.checked })}
          />
          Show Date
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
          <input
            type="checkbox"
            checked={zone.showSeconds}
            onChange={(event) => updateZone(zone.id, { showSeconds: event.target.checked })}
          />
          Show Seconds
        </label>
      </div>
    </div>
  );
}
