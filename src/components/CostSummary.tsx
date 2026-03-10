import { useMemo } from 'react';
import { useTripStore } from '@/store/tripStore';
import { buildSummary } from '@/lib/calculations';
import CoupleCard from './CoupleCard';

export default function CostSummary() {
  const couples = useTripStore((s) => s.couples);
  const costs = useTripStore((s) => s.costs);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const exchangeRates = useTripStore((s) => s.exchangeRates);

  const summaries = useMemo(
    () => buildSummary(couples, costs, globalMarkup, exchangeRates),
    [couples, costs, globalMarkup, exchangeRates]
  );

  const currenciesUsed = useMemo(
    () => new Set(costs.map((c) => c.currency)).size,
    [costs]
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Cost Summary</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>
          {couples.length} {couples.length === 1 ? 'couple' : 'couples'}
          {currenciesUsed > 0 && ` · ${currenciesUsed} ${currenciesUsed === 1 ? 'currency' : 'currencies'}`}
        </span>
      </div>
      <div className="card-body" style={{ padding: '15px 16px' }}>
        {summaries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No summary yet</div>
            <div className="empty-state-sub">Add couples and costs to see the breakdown</div>
          </div>
        ) : (
          <div className="s-cards">
            {summaries.map((summary) => (
              <CoupleCard key={summary.coupleId} summary={summary} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
