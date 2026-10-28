import { useEffect, useState } from 'react';
import GroupSetup from '@/components/GroupSetup';
import CostLedger from '@/components/CostLedger';
import CostSummary from '@/components/CostSummary';
import MobileNav from '@/components/MobileNav';
import { useTranslation } from 'react-i18next';

type MobileTab = 'party' | 'costs' | 'summary';
type ViewportSize = 'mobile' | 'tablet' | 'desktop';

const tabIds: Record<MobileTab, string> = {
  party: 'trip-tab-party',
  costs: 'trip-tab-costs',
  summary: 'trip-tab-summary',
};
const panelIds: Record<MobileTab, string> = {
  party: 'trip-panel-party',
  costs: 'trip-panel-costs',
  summary: 'trip-panel-summary',
};

function getViewportSize(width: number): ViewportSize {
  if (width <= 479) return 'mobile';
  if (width <= 767) return 'tablet';
  return 'desktop';
}

export default function App() {
  const { t } = useTranslation();
  const [mobileTab, setMobileTab] = useState<MobileTab>('costs');
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getViewportSize(window.innerWidth);
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewportSize(getViewportSize(window.innerWidth));
    };

    window.addEventListener('resize', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  const showMobileTabs = viewportSize !== 'desktop';

  return (
    <>
      <main className="main" data-mobile-tab={mobileTab} data-viewport={viewportSize}>
        <h1 className="sr-only">{t('srTripCost')}</h1>
        <section
          id={panelIds.party}
          data-section="party"
          role={showMobileTabs ? 'tabpanel' : undefined}
          aria-labelledby={showMobileTabs ? tabIds.party : 'party-heading'}
          tabIndex={showMobileTabs ? 0 : undefined}
        >
          <GroupSetup />
        </section>
        <section
          id={panelIds.costs}
          data-section="costs"
          role={showMobileTabs ? 'tabpanel' : undefined}
          aria-labelledby={showMobileTabs ? tabIds.costs : 'cost-ledger-heading'}
          tabIndex={showMobileTabs ? 0 : undefined}
        >
          <CostLedger />
        </section>
        <section
          id={panelIds.summary}
          data-section="summary"
          role={showMobileTabs ? 'tabpanel' : undefined}
          aria-labelledby={showMobileTabs ? tabIds.summary : 'cost-summary-heading'}
          tabIndex={showMobileTabs ? 0 : undefined}
        >
          <CostSummary />
        </section>
      </main>
      {showMobileTabs ? <MobileNav activeTab={mobileTab} onChange={setMobileTab} /> : null}
    </>
  );
}
