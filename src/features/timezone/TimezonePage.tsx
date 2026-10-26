import { useRef } from 'react';
import ClockGrid from './ClockGrid';
import TimezoneNavbar from './TimezoneNavbar';
import { useClockTick } from './useClockTick';

export default function TimezonePage() {
  const now = useClockTick();
  const openConfig = useRef<(() => void) | null>(null);

  return (
    <main className="tool-page" aria-label="Timezone converter">
      <h1>Timezone Converter</h1>
      <TimezoneNavbar manageRef={openConfig} />
      <ClockGrid now={now} onAddTimezone={() => openConfig.current?.()} />
    </main>
  );
}
