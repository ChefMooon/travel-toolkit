import { useEffect, useState } from 'react';
import { useTripStore } from '@/store/tripStore';
import Topbar from '@/components/Topbar';
import GroupSetup from '@/components/GroupSetup';
import CostLedger from '@/components/CostLedger';
import CostSummary from '@/components/CostSummary';
import MobileNav from '@/components/MobileNav';

type MobileTab = 'party' | 'costs' | 'summary';

export default function App() {
  const theme = useTripStore((s) => s.theme);
  const [mobileTab, setMobileTab] = useState<MobileTab>('costs');

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  return (
    <>
      <Topbar />
      <main className="main" data-mobile-tab={mobileTab}>
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
      <MobileNav activeTab={mobileTab} onChange={setMobileTab} />
    </>
  );
}
