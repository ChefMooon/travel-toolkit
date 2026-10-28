import { useState } from 'react';
import DatePicker from '@/components/DatePicker/DatePicker';
import { getDateDraftError } from '@/components/DatePicker/dateUtils';
import { calculateCountdown } from './countdown';
import { useLocalDate } from './useLocalDate';
import { useTripStore } from '@/store/tripStore';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { dateDraftErrorKey } from '@/i18n/dateDraft';
import type { TFunction } from 'i18next';

function message(result: ReturnType<typeof calculateCountdown>, t: TFunction) {
  switch (result.kind) {
    case 'empty': return t('chooseStartDate');
    case 'invalid': return t('correctTripDates');
    case 'upcoming': return `${formatNumber(result.daysUntil)} ${t('daysUntilTrip', { count: result.daysUntil })}`;
    case 'today': return t('tripStartsTodayShort');
    case 'active': return `${t('tripInProgress')} · ${t('daysRemain', { count: result.daysRemaining })} · ${result.duration} ${t('daysTotal')}`;
    case 'lastDay': return `${t('lastDayOfTrip')} · ${result.duration} ${t('daysTotal')}`;
    case 'ended': return `${t('daysAgoTripEnded', { count: result.daysAgo })} · ${result.duration} ${t('daysTotal')}`;
    case 'elapsed': return t('daysAgoStarted', { count: result.daysAgo });
  }
}

export default function CountdownPage({ fromTrip = false }: { fromTrip?: boolean }) {
  const { t } = useTranslation();
  const [dates, setDates] = useState(() => {
    const trip = useTripStore.getState();
    return fromTrip ? { start: trip.tripStartDate, end: trip.tripEndDate } : { start: '', end: '' };
  });
  const error = getDateDraftError(dates.start, dates.end);
  const today = useLocalDate();
  const result = error ? { kind: 'invalid' as const } : calculateCountdown(dates.start, dates.end, today);
  return <main className="tool-page countdown-page" data-page-entrance aria-label={t('toolCountdown')}>
    <h1>{t('toolCountdown')}</h1>
    <p className="unit-intro">{t('countdownIntro')}</p>
    <section className="card" aria-labelledby="countdown-dates-title">
      <div className="card-header"><h2 id="countdown-dates-title" className="card-title">{t('tripDates')}</h2></div>
      <div className="card-body countdown-date-fields">
        <DatePicker showToday id="countdown-start" label={t('startDate')} value={dates.start} invalid={!!error} describedBy={error ? 'countdown-date-error' : undefined} onChange={(start) => setDates((current) => ({ ...current, start }))} />
        <DatePicker id="countdown-end" label={t('endDateOptional')} value={dates.end} invalid={!!error} describedBy={error ? 'countdown-date-error' : undefined} onChange={(end) => setDates((current) => ({ ...current, end }))} />
        {error && <p className="trip-date-error" id="countdown-date-error" role="alert">{t(dateDraftErrorKey(error) ?? 'dateStartInvalid')}</p>}
      </div>
    </section>
    <section className="card" aria-labelledby="countdown-result-title">
      <div className="card-header"><h2 id="countdown-result-title" className="card-title">{t('countdown')}</h2></div>
      <div className="card-body countdown-result" aria-live="polite" aria-atomic="true">
        {result.kind === 'upcoming' ? (
          <p className="countdown-result-message"><strong className="countdown-result-number">{formatNumber(result.daysUntil)}</strong><span>{t('daysUntilTrip', { count: result.daysUntil })}</span></p>
        ) : <p className="countdown-result-message">{message(result, t)}</p>}
      </div>
    </section>
  </main>;
}
