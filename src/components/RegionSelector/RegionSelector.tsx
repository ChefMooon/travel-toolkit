import { useTripStore } from '@/store/tripStore';
import { REGION_LIST } from '@/store/types';
import type { Region } from '@/store/types';
import Select from '@/components/Select/Select';
import { useEffect, useState } from 'react';
import { useDraftStore } from '@/store/draftStore';
import DatePicker from '@/components/DatePicker/DatePicker';
import { getDateDraftError } from '@/components/DatePicker/dateUtils';

export default function RegionSelector() {
  const region = useTripStore((s) => s.region);
  const setRegion = useTripStore((s) => s.setRegion);
  const startDate = useTripStore((s) => s.tripStartDate);
  const endDate = useTripStore((s) => s.tripEndDate);
  const identityRevision = useTripStore((s) => s.tripIdentityRevision);
  const setTripDates = useTripStore((s) => s.setTripDates);
  const setDateDraftError = useTripStore((s) => s.setDateDraftError);
  const [draft, setDraft] = useState({ start: startDate, end: endDate });
  const error = useTripStore((s) => s.dateDraftError);
  const setDraftDirty = useDraftStore((s) => s.setDraft);
  useEffect(() => () => { setDraftDirty('trip-dates', false); setDateDraftError?.(''); }, [setDateDraftError, setDraftDirty]);
  useEffect(() => { setDraft({ start: startDate, end: endDate }); setDateDraftError?.(''); setDraftDirty('trip-dates', false); }, [identityRevision, setDateDraftError, setDraftDirty]);
  useEffect(() => {
    if (!error) {
      setDraft({ start: startDate, end: endDate });
      setDraftDirty('trip-dates', false);
    }
  }, [startDate, endDate, error, setDraftDirty]);
  const editDate = (field: 'start' | 'end', value: string) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    const message = getDateDraftError(next.start, next.end);
    setDateDraftError?.(message);
    setDraftDirty('trip-dates', !!message);
    if (!message) setTripDates?.(next.start, next.end);
  };

  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div className="card-header">
        <h2 id="region-heading" className="card-title">Trip Information</h2>
      </div>
      <div className="trip-information-content">
        <div className="trip-information-fields">
          <div className="trip-region-field"><label htmlFor="trip-region-select">Region</label><Select
            id="trip-region-select"
            value={region}
            options={REGION_LIST}
            onChange={(value) => setRegion(value as Region)}
            className="shared-select-full"
            aria-label="Region"
          /></div>
          <div className="trip-date-fields">
            <DatePicker id="trip-start-date" label="Start date" value={draft.start} invalid={!!error} describedBy={error ? 'trip-date-error' : undefined} onChange={(value) => editDate('start', value)} />
            <DatePicker id="trip-end-date" label="End date" value={draft.end} invalid={!!error} describedBy={error ? 'trip-date-error' : undefined} onChange={(value) => editDate('end', value)} />
          </div>
          {error && <p id="trip-date-error" className="trip-date-error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
