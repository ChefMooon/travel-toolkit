import { useEffect, useMemo, useState } from 'react';
import { useTripStore } from '@/store/tripStore';
import { buildSummary, formatCurrency } from '@/lib/calculations';
import { getAvailableCurrencies } from '@/store/types';
import { useTripRates } from '@/features/currency/useTripRates';
import CoupleCard from '../CoupleCard';

function formatRateDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatFetchTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function CostSummary() {
  const couples = useTripStore((s) => s.couples);
  const costs = useTripStore((s) => s.costs);
  const globalMarkup = useTripStore((s) => s.globalMarkup);
  const exchangeRates = useTripStore((s) => s.exchangeRates);
  const region = useTripStore((s) => s.region);
  const targetCurrency = useTripStore((s) => s.targetCurrency);
  const hydrateExchangeRates = useTripStore((s) => s.hydrateExchangeRates);
  const setTargetCurrency = useTripStore((s) => s.setTargetCurrency);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const tripRatesQuery = useTripRates(region);

  useEffect(() => {
    if (tripRatesQuery.data) {
      hydrateExchangeRates(tripRatesQuery.data.rates);
    }
  }, [tripRatesQuery.data, hydrateExchangeRates]);

  const availableCurrencies = useMemo(() => getAvailableCurrencies(region), [region]);

  const summaries = useMemo(
    () => buildSummary(couples, costs, globalMarkup, exchangeRates, targetCurrency),
    [couples, costs, globalMarkup, exchangeRates, targetCurrency]
  );

  const tripTotal = summaries.length > 0 && summaries.every((summary) => summary.grandTotal !== null)
    ? summaries.reduce((total, summary) => total + (summary.grandTotal ?? 0), 0)
    : null;

  const currenciesUsed = useMemo(
    () => new Set(costs.map((c) => c.currency)).size,
    [costs]
  );

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h2 id="cost-summary-heading" className="card-title">Cost Summary</h2>
          <span aria-hidden="true" style={{ color: 'var(--text-3)', fontWeight: 700 }}>
            ·
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>
            {couples.length} {couples.length === 1 ? 'group' : 'groups'}
            {currenciesUsed > 0 && ` · ${currenciesUsed} ${currenciesUsed === 1 ? 'currency' : 'currencies'}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <label
            htmlFor="target-currency-select"
            style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}
          >
            Convert to
          </label>
          <select
            id="target-currency-select"
            data-testid="target-currency-select"
            className="tool-input"
            style={{ width: 'auto', fontSize: 12, padding: '2px 8px', lineHeight: 1.1, minHeight: 28 }}
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value)}
          >
            {availableCurrencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="card-body" style={{ padding: '15px 16px' }}>
        {summaries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No summary yet</div>
            <div className="empty-state-sub">Add groups and costs to see the breakdown</div>
          </div>
        ) : (
          <div className="s-cards">
            {summaries.map((summary) => (
              <CoupleCard
                key={summary.coupleId}
                summary={summary}
                share={tripTotal !== null && tripTotal !== 0 && summary.grandTotal !== null
                  ? summary.grandTotal / tripTotal
                  : undefined}
              />
            ))}
          </div>
        )}

        {tripTotal !== null && (
          <div
            data-testid="trip-total"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border)',
              marginTop: 12,
              paddingTop: 10,
            }}
          >
            <span>Trip total</span>
            <strong>{formatCurrency(tripTotal, targetCurrency)}</strong>
          </div>
        )}

        {tripRatesQuery.isPending && (
          <div
            data-testid="rates-loading"
            style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}
          >
            Loading exchange rates…
          </div>
        )}

        {tripRatesQuery.isError && (
          <div
            data-testid="rates-error"
            style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>Unable to load live rates.</span>
            <button type="button" style={{ fontSize: 12 }} onClick={() => tripRatesQuery.refetch()}>
              Retry
            </button>
          </div>
        )}

        {tripRatesQuery.data && (
          <div
            data-testid="rates-disclaimer"
            style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <button
                type="button"
                aria-expanded={detailsOpen}
                aria-controls="rates-details"
                onClick={() => setDetailsOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--text-2)',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 10 }}>{detailsOpen ? '▾' : '▸'}</span>
                Rates sourced from
              </button>
              <a
                href="https://frankfurter.dev"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 12,
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                Frankfurter
              </a>
            </div>
            <div id="rates-details" hidden={!detailsOpen}>
              <p style={{ color: 'var(--text-2)', fontSize: 12, margin: '6px 0 0 14px' }}>
                Frankfurter aggregates data from central banks and official institutions. Rates
                update on business days — the ECB publishes reference rates around 16:00 CET.
                Weekends and public holidays use the most recent prior business day's rates.{' '}
                Rate date: {formatRateDate(tripRatesQuery.data.updatedAt)} · Retrieved{' '}
                {formatFetchTime(tripRatesQuery.data.fetchedAt)}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
