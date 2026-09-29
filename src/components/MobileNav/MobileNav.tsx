import { Users, Receipt, BarChart2 } from 'lucide-react';
import { useRef } from 'react';

type MobileTab = 'party' | 'costs' | 'summary';

const tabs: MobileTab[] = ['party', 'costs', 'summary'];
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

interface MobileNavProps {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}

export default function MobileNav({ activeTab, onChange }: MobileNavProps) {
  const tabRefs = useRef<Record<MobileTab, HTMLButtonElement | null>>({
    party: null,
    costs: null,
    summary: null,
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = tabs.findIndex((tab) => tabIds[tab] === event.currentTarget.id);
    if (currentIndex === -1) return;
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex]!;
    onChange(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      <div className="mobile-nav-tabs" role="tablist" aria-label="Trip sections" aria-orientation="horizontal">
        <button
          ref={(node) => { tabRefs.current.party = node; }}
          id={tabIds.party}
          type="button"
          role="tab"
          className={`mobile-nav-tab${activeTab === 'party' ? ' active' : ''}`}
          onClick={() => onChange('party')}
          onKeyDown={handleKeyDown}
          aria-selected={activeTab === 'party'}
          aria-controls={panelIds.party}
          tabIndex={activeTab === 'party' ? 0 : -1}
        >
          <Users size={20} aria-hidden="true" />
          <span>Party</span>
        </button>
        <button
          ref={(node) => { tabRefs.current.costs = node; }}
          id={tabIds.costs}
          type="button"
          role="tab"
          className={`mobile-nav-tab${activeTab === 'costs' ? ' active' : ''}`}
          onClick={() => onChange('costs')}
          onKeyDown={handleKeyDown}
          aria-selected={activeTab === 'costs'}
          aria-controls={panelIds.costs}
          tabIndex={activeTab === 'costs' ? 0 : -1}
        >
          <Receipt size={20} aria-hidden="true" />
          <span>Costs</span>
        </button>
        <button
          ref={(node) => { tabRefs.current.summary = node; }}
          id={tabIds.summary}
          type="button"
          role="tab"
          className={`mobile-nav-tab${activeTab === 'summary' ? ' active' : ''}`}
          onClick={() => onChange('summary')}
          onKeyDown={handleKeyDown}
          aria-selected={activeTab === 'summary'}
          aria-controls={panelIds.summary}
          tabIndex={activeTab === 'summary' ? 0 : -1}
        >
          <BarChart2 size={20} aria-hidden="true" />
          <span>Summary</span>
        </button>
      </div>
    </nav>
  );
}
