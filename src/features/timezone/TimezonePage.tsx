import { useRef } from 'react';
import ClockGrid from './ClockGrid';
import TimezoneNavbar from './TimezoneNavbar';
import { useClockTick } from './useClockTick';
import { useTranslation } from 'react-i18next';

export default function TimezonePage() {
  const { t } = useTranslation();
  const now = useClockTick();
  const openConfig = useRef<(() => void) | null>(null);

  return (
    <main className="tool-page" data-page-entrance aria-label={t('toolTimezone')}>
      <h1>{t('toolTimezone')}</h1>
      <TimezoneNavbar manageRef={openConfig} />
      <ClockGrid now={now} onAddTimezone={() => openConfig.current?.()} />
    </main>
  );
}
