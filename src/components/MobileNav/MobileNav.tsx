import { Users, Receipt, BarChart2 } from 'lucide-react';

type MobileTab = 'party' | 'costs' | 'summary';

interface MobileNavProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}

export default function MobileNav({ activeTab, onChange }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      <button
        className={`mobile-nav-tab${activeTab === 'party' ? ' active' : ''}`}
        onClick={() => onChange('party')}
        aria-label="Party"
      >
        <Users size={20} />
        <span>Party</span>
      </button>
      <button
        className={`mobile-nav-tab${activeTab === 'costs' ? ' active' : ''}`}
        onClick={() => onChange('costs')}
        aria-label="Costs"
      >
        <Receipt size={20} />
        <span>Costs</span>
      </button>
      <button
        className={`mobile-nav-tab${activeTab === 'summary' ? ' active' : ''}`}
        onClick={() => onChange('summary')}
        aria-label="Summary"
      >
        <BarChart2 size={20} />
        <span>Summary</span>
      </button>
    </nav>
  );
}
