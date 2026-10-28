import { useState } from 'react';
import DatePicker from '@/components/DatePicker/DatePicker';
import { getDateDraftError } from '@/components/DatePicker/dateUtils';
import { calculateCountdown } from './countdown';
import { useLocalDate } from './useLocalDate';
import { useTripStore } from '@/store/tripStore';

function message(result: ReturnType<typeof calculateCountdown>) {
  switch (result.kind) {
    case 'empty': return 'Choose your trip start date to see the countdown.';
    case 'invalid': return 'Correct the trip dates to see a countdown.';
    case 'upcoming': return `${result.daysUntil} ${result.daysUntil === 1 ? 'day' : 'days'} until your trip.`;
    case 'today': return 'Your trip starts today!';
    case 'active': return `Trip in progress · ${result.daysRemaining} ${result.daysRemaining === 1 ? 'day' : 'days'} remaining · ${result.duration} ${result.duration === 1 ? 'day' : 'days'} total`;
    case 'lastDay': return `Last day of your trip · ${result.duration} ${result.duration === 1 ? 'day' : 'days'} total`;
    case 'ended': return `Trip ended ${result.daysAgo} ${result.daysAgo === 1 ? 'day' : 'days'} ago · ${result.duration} ${result.duration === 1 ? 'day' : 'days'} total`;
    case 'elapsed': return `This trip started ${result.daysAgo} ${result.daysAgo === 1 ? 'day' : 'days'} ago.`;
  }
}

export default function CountdownPage({ fromTrip = false }: { fromTrip?: boolean }) {
  const [dates, setDates] = useState(() => {
    const trip = useTripStore.getState();
    return fromTrip ? { start: trip.tripStartDate, end: trip.tripEndDate } : { start: '', end: '' };
  });
  const error = getDateDraftError(dates.start, dates.end);
  const today = useLocalDate();
  const result = error ? { kind: 'invalid' as const } : calculateCountdown(dates.start, dates.end, today);
  return <main className="tool-page countdown-page" data-page-entrance aria-label="Travel Countdown">
    <h1>Travel Countdown</h1>
    <p className="unit-intro">Count down to your trip and see how many days are left while you travel.</p>
    <section className="card" aria-labelledby="countdown-dates-title">
      <div className="card-header"><h2 id="countdown-dates-title" className="card-title">Trip dates</h2></div>
      <div className="card-body countdown-date-fields">
        <DatePicker id="countdown-start" label="Start date" value={dates.start} invalid={!!error} describedBy={error ? 'countdown-date-error' : undefined} onChange={(start) => setDates((current) => ({ ...current, start }))} />
        <DatePicker id="countdown-end" label="End date (optional)" value={dates.end} invalid={!!error} describedBy={error ? 'countdown-date-error' : undefined} onChange={(end) => setDates((current) => ({ ...current, end }))} />
        {error && <p className="trip-date-error" id="countdown-date-error" role="alert">{error}</p>}
      </div>
    </section>
    <section className="card" aria-labelledby="countdown-result-title">
      <div className="card-header"><h2 id="countdown-result-title" className="card-title">Countdown</h2></div>
      <div className="card-body countdown-result" aria-live="polite" aria-atomic="true">
        {result.kind === 'upcoming' ? (
          <p className="countdown-result-message"><strong className="countdown-result-number">{result.daysUntil.toLocaleString()}</strong><span>{result.daysUntil === 1 ? 'day' : 'days'} until your trip</span></p>
        ) : <p className="countdown-result-message">{message(result)}</p>}
      </div>
    </section>
  </main>;
}
