import { Suspense, lazy, useState } from 'react';
import type { RefObject } from 'react';
import { LocateFixed, Settings } from 'lucide-react';
import { useTimezoneStore } from '@/store/timezoneStore';
import Tooltip from '@/components/Tooltip';
import TimezoneSelect from './TimezoneSelect';
import { useTranslation } from 'react-i18next';

const ConfigModal = lazy(() => import('./ConfigModal/ConfigModal'));

export default function TimezoneNavbar({ manageRef }: { manageRef?: RefObject<(() => void) | null> }) {
  const { t } = useTranslation();
  const localTz = useTimezoneStore((state) => state.localTz);
  const setLocalTz = useTimezoneStore((state) => state.setLocalTz);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const openConfig = () => setIsConfigOpen(true);
  if (manageRef) manageRef.current = openConfig;
  const handleDetect = () => {
    setLocalTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  };

  return (
    <>
      <div className="card">
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          <span className="card-title" style={{ marginBottom: 0 }}>{t('zoneLocalTimezone')}</span>

          <div className="timezone-navbar-controls">
            <TimezoneSelect
              value={localTz}
              onChange={setLocalTz}
              placeholder={t('zoneSelectLocalTimezone')}
              searchable={false}
            />

            <Tooltip content={t('zoneUseBrowserTimezone')}>
              <button
                className="btn-add"
                onClick={handleDetect}
                aria-label={t('zoneDetectTimezone')}
                style={{ paddingInline: 14, minWidth: 44 }}
              >
                <LocateFixed size={14} />
              </button>
            </Tooltip>

            <Tooltip content={t('zoneManageTrackedTimezones')}>
              <button
                className="btn-add tz-settings-btn"
                onClick={openConfig}
                aria-label={t('zoneManageTrackedTimezones')}
              >
                <Settings size={14} />
                <span className="tz-settings-label">{t('zoneTrackedTimezones')}</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        {isConfigOpen && <ConfigModal onClose={() => setIsConfigOpen(false)} />}
      </Suspense>
    </>
  );
}
