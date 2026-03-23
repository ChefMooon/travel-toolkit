import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useTimezoneStore } from '@/store/timezoneStore';
import ConfigModal from './ConfigModal/ConfigModal';
import TimezoneSelect from './TimezoneSelect';

export default function TimezoneNavbar() {
  const localTz = useTimezoneStore((state) => state.localTz);
  const setLocalTz = useTimezoneStore((state) => state.setLocalTz);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          <span className="card-title" style={{ marginBottom: 0 }}>Local Timezone</span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
            <TimezoneSelect
              value={localTz}
              onChange={setLocalTz}
              placeholder="Select local timezone"
              searchable={false}
            />

            <button
              className="btn-add tz-settings-btn"
              onClick={() => setIsConfigOpen(true)}
              aria-label="Manage tracked timezones"
              title="Manage tracked timezones"
            >
              <Settings size={14} />
              <span className="tz-settings-label">Tracked Timezones</span>
            </button>
          </div>
        </div>
      </div>

      {isConfigOpen && <ConfigModal onClose={() => setIsConfigOpen(false)} />}
    </>
  );
}
