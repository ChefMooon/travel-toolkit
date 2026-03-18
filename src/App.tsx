import { useEffect, useState } from 'react';
import { useTripStore } from '@/store/tripStore';
import Topbar from '@/components/Topbar';
import GroupSetup from '@/components/GroupSetup';
import CostLedger from '@/components/CostLedger';
import CostSummary from '@/components/CostSummary';
import MobileNav from '@/components/MobileNav';
import ToastViewport from '@/components/ToastViewport';

type MobileTab = 'party' | 'costs' | 'summary';
type ViewportSize = 'mobile' | 'tablet' | 'desktop';

function getViewportSize(width: number): ViewportSize {
  if (width <= 479) return 'mobile';
  if (width <= 767) return 'tablet';
  return 'desktop';
}

export default function App() {
  const theme = useTripStore((s) => s.theme);
  const [mobileTab, setMobileTab] = useState<MobileTab>('costs');
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getViewportSize(window.innerWidth);
  });

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  useEffect(() => {
    const updateViewport = () => {
      setViewportSize(getViewportSize(window.innerWidth));
    };

    window.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  return (
    <>
      <Topbar />
      <ToastViewport />
      <main className="main" data-mobile-tab={mobileTab} data-viewport={viewportSize}>
        <div data-section="party">
          <GroupSetup />
        </div>
        <div data-section="costs">
          <CostLedger />
        </div>
        <div data-section="summary">
          <CostSummary />
        </div>
      </main>
      {viewportSize !== 'desktop' ? <MobileNav activeTab={mobileTab} onChange={setMobileTab} /> : null}
    </>
  );
}
