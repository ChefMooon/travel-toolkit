import { useEffect } from 'react';
import { useTripStore } from '@/store/tripStore';
import Topbar from '@/components/Topbar';
import GroupSetup from '@/components/GroupSetup';
import CostLedger from '@/components/CostLedger';
import CostSummary from '@/components/CostSummary';

export default function App() {
  const theme = useTripStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  return (
    <>
      <Topbar />
      <main className="main">
        <div className="left" style={{ display: 'flex', flexDirection: 'column' }}>
          <GroupSetup />
          <CostLedger />
        </div>
        <div className="right">
          <CostSummary />
        </div>
      </main>
    </>
  );
}
