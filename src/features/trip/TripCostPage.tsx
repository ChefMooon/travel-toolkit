import App from '@/App';
import TripToolbar from '@/components/TripToolbar';
import { useEffect, useRef } from 'react';
import { useTripStore } from '@/store/tripStore';
import { calculateCountdown } from '@/features/countdown/countdown';
import { useLocalDate } from '@/features/countdown/useLocalDate';
import { Link } from '@tanstack/react-router';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function TripCountdownStrip() {
  const { t } = useTranslation();
  const start = useTripStore((s) => s.tripStartDate);
  const end = useTripStore((s) => s.tripEndDate);
  const today = useLocalDate();
  const result = calculateCountdown(start, end, today);
  const previousSummary = useRef('');
  let summary = '';
  switch (result.kind) {
    case 'upcoming': summary = t('daysUntilDeparture', { count: result.daysUntil }); break;
    case 'today': summary = t('tripStartsTodayShort'); break;
    case 'active': summary = t('daysRemain', { count: result.daysRemaining }); break;
    case 'lastDay': summary = t('lastDayOfTrip'); break;
    case 'ended': summary = t('daysAgoTripEnded', { count: result.daysAgo }); break;
    case 'elapsed': summary = t('daysAgoStarted', { count: result.daysAgo }); break;
    default: break;
  }
  if (summary) previousSummary.current = summary;
  return <div className="trip-countdown-transition" data-visible={summary ? 'true' : 'false'} aria-hidden={!summary}>
    <div className="trip-countdown-transition-inner">
      <div className="trip-countdown-strip">
        <span role="status">{summary || previousSummary.current}</span>
        <Link to="/countdown" search={{ fromTrip: true }} className="trip-countdown-link" aria-label={t('openCountdown')} title={t('openCountdown')} tabIndex={summary ? undefined : -1}>
          <CalendarDays size={17} aria-hidden="true" />
        </Link>
      </div>
    </div>
  </div>;
}

export default function TripCostPage() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.isComposing || !(event.ctrlKey || event.metaKey)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"], dialog[open]')) return;

      const key = event.key.toLowerCase();
      const undo = key === 'z' && !event.shiftKey;
      const redo = (key === 'z' && event.shiftKey) || (key === 'y' && !event.shiftKey);
      if (!undo && !redo) return;
      event.preventDefault();
      const state = useTripStore.getState();
      if (undo && state.canUndo) state.undo();
      if (redo && state.canRedo) state.redo();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <TripToolbar />
      <TripCountdownStrip />
      <App />
    </>
  );
}
