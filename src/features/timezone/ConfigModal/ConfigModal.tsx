import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimezoneSelect from '../TimezoneSelect';
import { createTrackedZone } from '../timezones';
import ZoneList from './ZoneList';

interface ConfigModalProps {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
  const [addTz, setAddTz] = useState('');
  const trackedZones = useTimezoneStore((state) => state.trackedZones);
  const addZone = useTimezoneStore((state) => state.addZone);

  const nextOrder = useMemo(() => trackedZones.length, [trackedZones.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  const handleAddZone = () => {
    if (!addTz) return;
    const fallbackLabel = addTz.split('/').pop()?.replace(/_/g, ' ') ?? addTz;
    addZone(createTrackedZone(addTz, fallbackLabel, nextOrder));
    setAddTz('');
  };

  return (
    <div className="modal-bd" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className="modal timezone-config-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Configure timezone cards"
        style={{ width: 'min(92vw, 760px)', maxWidth: 'none', textAlign: 'left', gap: 14 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>
            Configure Timezones
          </div>
          <button className="ibtn" onClick={onClose} aria-label="Close settings">
            <X size={14} />
          </button>
        </div>

        <div className="timezone-config-modal-scroll">
          <div style={{ display: 'grid', gap: 10 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Add Timezone</div>
            <TimezoneSelect
              value={addTz}
              onChange={setAddTz}
              placeholder="Select timezone to add"
              action={(
                <button className="btn-add" onClick={handleAddZone} disabled={!addTz}>
                  <Plus size={14} /> Add
                </button>
              )}
            />
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Tracked Zones</div>
            <ZoneList />
          </div>

        </div>
      </div>
    </div>
  );
}
