import { Suspense, lazy, useState } from 'react';
import { LocateFixed, Settings } from 'lucide-react';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimezoneSelect from './TimezoneSelect';

const ConfigModal = lazy(() => import('./ConfigModal/ConfigModal'));

export default function TimezoneNavbar() {
  const localTz = useTimezoneStore((state) => state.localTz);
  const setLocalTz = useTimezoneStore((state) => state.setLocalTz);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [detectTooltipVisible, setDetectTooltipVisible] = useState(false);

  const handleDetect = () => {
    setLocalTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  };

  return (
    <>
      <div className="card">
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          <span className="card-title" style={{ marginBottom: 0 }}>Local Timezone</span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'end' }}>
            <TimezoneSelect
              value={localTz}
              onChange={setLocalTz}
              placeholder="Select local timezone"
              searchable={false}
            />

            <div style={{ position: 'relative' }}>
              <button
                className="btn-add"
                onClick={handleDetect}
                aria-label="Detect my timezone"
                onMouseEnter={() => setDetectTooltipVisible(true)}
                onMouseLeave={() => setDetectTooltipVisible(false)}
                onFocus={() => setDetectTooltipVisible(true)}
                onBlur={() => setDetectTooltipVisible(false)}
                style={{ paddingInline: 14, minWidth: 44 }}
              >
                <LocateFixed size={14} />
              </button>
              {detectTooltipVisible && (
                <div
                  className="affordance-tooltip"
                  role="tooltip"
                  style={{ bottom: 'calc(100% + 6px)', right: 0 }}
                >
                  Use browser timezone
                </div>
              )}
            </div>

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

      <Suspense fallback={null}>
        {isConfigOpen && <ConfigModal onClose={() => setIsConfigOpen(false)} />}
      </Suspense>
    </>
  );
}
