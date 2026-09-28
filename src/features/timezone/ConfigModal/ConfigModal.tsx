import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimezoneSelect from '../TimezoneSelect';
import { createTrackedZone } from '../timezones';
import ZoneList from './ZoneList';

interface ConfigModalProps {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const trackedZones = useTimezoneStore((state) => state.trackedZones);
  const addZone = useTimezoneStore((state) => state.addZone);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLInputElement>('[aria-label="Search timezones"]')?.focus();

    return () => previouslyFocused?.focus();
  }, []);

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

  const handleAddZone = (tz: string) => {
    if (trackedZones.some((zone) => zone.tz === tz)) return;
    const fallbackLabel = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
    const nextOrder = trackedZones.reduce((maximum, zone) => Math.max(maximum, zone.order), -1) + 1;
    addZone(createTrackedZone(tz, fallbackLabel, nextOrder));
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);
    if (!first || !last) return;

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  };

  return (
    <div className="modal-bd" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="modal timezone-config-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="timezone-config-header">
          <div className="modal-title" id={titleId}>
            Timezone Settings
          </div>
          <button className="ibtn" onClick={onClose} aria-label="Close settings">
            <X size={14} />
          </button>
        </div>

        <div className="timezone-config-modal-scroll">
          <section className="timezone-config-section" aria-labelledby={`${titleId}-add`}>
            <h2 className="timezone-config-section-title" id={`${titleId}-add`}>Add Timezone</h2>
            <TimezoneSelect
              value=""
              onChange={handleAddZone}
              placeholder="Select timezone to add"
              addedTimezones={trackedZones.map((zone) => zone.tz)}
            />
          </section>

          <section className="timezone-config-section" aria-labelledby={`${titleId}-tracked`}>
            <div className="timezone-config-section-heading">
              <h2 className="timezone-config-section-title" id={`${titleId}-tracked`}>Tracked Timezones</h2>
              <span className="timezone-config-count">{trackedZones.length}</span>
            </div>
            <ZoneList />
          </section>
        </div>
      </div>
    </div>
  );
}
