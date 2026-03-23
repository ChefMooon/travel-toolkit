import ClockGrid from './ClockGrid';
import TimezoneNavbar from './TimezoneNavbar';
import { useClockTick } from './useClockTick';

export default function TimezonePage() {
  const now = useClockTick();

  return (
    <section className="tool-page" aria-label="Timezone converter">
      <h1>Timezone Converter</h1>
      <TimezoneNavbar />
      <ClockGrid now={now} />
    </section>
  );
}
