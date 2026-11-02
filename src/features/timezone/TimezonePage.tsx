import { useRef } from 'react';
import ClockGrid from './ClockGrid';
import TimezoneNavbar from './TimezoneNavbar';
import { useClockTick } from './useClockTick';
import { useTranslation } from 'react-i18next';
import ToolPageHeading from '@/components/ToolPageHeading';

export default function TimezonePage() {
  const { t } = useTranslation();
  const now = useClockTick();
  const openConfig = useRef<(() => void) | null>(null);

  return (
    <main className="tool-page" data-page-entrance aria-label={t('toolTimezone')}>
      <ToolPageHeading route="/timezone">{t('toolTimezone')}</ToolPageHeading>
      <TimezoneNavbar manageRef={openConfig} />
      <ClockGrid now={now} onAddTimezone={() => openConfig.current?.()} />
    </main>
  );
}
