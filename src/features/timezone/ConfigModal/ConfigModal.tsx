import { useId } from 'react';
import { X } from 'lucide-react';
import ModalShell from '@/components/Modal/ModalShell';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimezoneSelect from '../TimezoneSelect';
import { createTrackedZone } from '../timezones';
import ZoneList from './ZoneList';
import { useTranslation } from 'react-i18next';

const focusSearchInput = (dialog: HTMLElement) =>
  dialog.querySelector<HTMLInputElement>('input[role="combobox"]');

interface ConfigModalProps {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const trackedZones = useTimezoneStore((state) => state.trackedZones);
  const addZone = useTimezoneStore((state) => state.addZone);

  const handleAddZone = (tz: string) => {
    if (trackedZones.some((zone) => zone.tz === tz)) return;
    const fallbackLabel = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
    const nextOrder = trackedZones.reduce((maximum, zone) => Math.max(maximum, zone.order), -1) + 1;
    addZone(createTrackedZone(tz, fallbackLabel, nextOrder));
  };

  return (
    <ModalShell
      onClose={onClose}
      labelledBy={titleId}
      className="timezone-config-modal"
      initialFocus={focusSearchInput}
    >
      <div className="timezone-config-header">
          <div className="modal-title" id={titleId}>
          {t('zoneSettings')}
        </div>
        <button className="ibtn" onClick={onClose} aria-label={t('zoneCloseSettings')}>
          <X size={14} />
        </button>
      </div>

      <div className="timezone-config-modal-scroll">
        <section className="timezone-config-section" aria-labelledby={`${titleId}-add`}>
          <h2 className="timezone-config-section-title" id={`${titleId}-add`}>{t('zoneAddTimezone')}</h2>
          <TimezoneSelect
            value=""
            onChange={handleAddZone}
            placeholder={t('zoneSelectTimezoneToAdd')}
            addedTimezones={trackedZones.map((zone) => zone.tz)}
          />
        </section>

        <section className="timezone-config-section" aria-labelledby={`${titleId}-tracked`}>
          <div className="timezone-config-section-heading">
            <h2 className="timezone-config-section-title" id={`${titleId}-tracked`}>{t('zoneTrackedTimezones')}</h2>
            <span className="timezone-config-count">{trackedZones.length}</span>
          </div>
          <ZoneList />
        </section>
      </div>
    </ModalShell>
  );
}
