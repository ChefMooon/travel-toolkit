import { useRef } from 'react';
import ClockGrid from './ClockGrid';
import TimezoneNavbar from './TimezoneNavbar';
import { useClockTick } from './useClockTick';
import { useTranslation } from 'react-i18next';
import ToolPage from '@/components/ToolPage';

export default function TimezonePage() {
  const { t } = useTranslation();
  const now = useClockTick();
  const openConfig = useRef<(() => void) | null>(null);

  return (
    <ToolPage route="/timezone" title={t('toolTimezone')}>
      <TimezoneNavbar manageRef={openConfig} />
      <ClockGrid now={now} onAddTimezone={() => openConfig.current?.()} />
    </ToolPage>
  );
}
