import { useEffect, useMemo, useState } from 'react';
import { getAvailableCurrencies, getDefaultCurrency } from '@/store/types';
import { useCurrencyStore } from '@/store/currencyStore';
import { useCurrencySnapshot } from './useCurrencySnapshot';
import { useCurrencyMetadata } from './useCurrencyMetadata';
import { useCurrencyProviders } from './useCurrencyProviders';
import CurrencyRegionSelector from './CurrencyRegionSelector';

function formatRateDate(dateStr: string) {
  // API date is YYYY-MM-DD (UTC); parse as UTC to avoid day-offset in negative-offset timezones
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatFetchTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function parseAmount(input: string) {
  const value = Number.parseFloat(input);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export default function CurrencyTool() {
  const region = useCurrencyStore((s) => s.region);
  const amountInput = useCurrencyStore((s) => s.amount);
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const targetCurrency = useCurrencyStore((s) => s.targetCurrency);
  const setAmountInput = useCurrencyStore((s) => s.setAmount);
  const setBaseCurrency = useCurrencyStore((s) => s.setBaseCurrency);
  const setTargetCurrency = useCurrencyStore((s) => s.setTargetCurrency);
  const availableCurrencies = useMemo(() => getAvailableCurrencies(region), [region]);

  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const prevBase = useCurrencyStore.getState().baseCurrency;
    const prevTarget = useCurrencyStore.getState().targetCurrency;
    const newBase = availableCurrencies.includes(prevBase)
      ? prevBase
      : getDefaultCurrency(region);
    const newTarget =
      !availableCurrencies.includes(prevTarget) || prevTarget === newBase
        ? (availableCurrencies.find((c) => c !== newBase) ?? availableCurrencies[0] ?? 'USD')
        : prevTarget;
    if (newBase !== prevBase) setBaseCurrency(newBase);
    if (newTarget !== prevTarget) setTargetCurrency(newTarget);
  }, [availableCurrencies, setBaseCurrency, setTargetCurrency]);

  const amount = parseAmount(amountInput);
  const snapshotQuery = useCurrencySnapshot(baseCurrency, region);
  const metaQuery = useCurrencyMetadata();
  const providersQuery = useCurrencyProviders();

  const converted = useMemo(() => {
    if (!snapshotQuery.data) return 0;
    const rate = snapshotQuery.data.rates[targetCurrency] ?? 0;
    return amount * rate;
  }, [amount, snapshotQuery.data, targetCurrency]);

  const relevantProviders = useMemo(() => {
    if (!providersQuery.data) return [];
    return providersQuery.data.filter(
      (p) => p.currencies.includes(baseCurrency) && p.currencies.includes(targetCurrency),
    );
  }, [providersQuery.data, baseCurrency, targetCurrency]);

  function getCurrencyLabel(code: string) {
    const meta = metaQuery.data?.[code];
    return meta ? `${code} — ${meta.name}` : code;
  }

  function handleSwapCurrencies() {
    setBaseCurrency(targetCurrency);
    setTargetCurrency(baseCurrency);
  }

  function handleReset() {
    const defaultBase = getDefaultCurrency(region);
    const defaultTarget = availableCurrencies.includes('USD') && 'USD' !== defaultBase
      ? 'USD'
      : (availableCurrencies.find((c) => c !== defaultBase) ?? availableCurrencies[0] ?? 'USD');
    setAmountInput('100');
    setBaseCurrency(defaultBase);
    setTargetCurrency(defaultTarget);
  }

  return (
    <main className="tool-page" aria-label="Currency converter">
      <h1>Currency Converter</h1>

      <CurrencyRegionSelector />

      <div className="card">
        <div className="card-header">
          <p className="card-title">Conversion Inputs</p>
          <button
            type="button"
            className="currency-reset-button"
            onClick={handleReset}
            aria-label="Reset conversion inputs"
            title="Reset to defaults"
          >
            Reset
          </button>
        </div>
        <div className="card-body currency-controls">
          <label className="tool-field">
            <span className="tool-label">Amount</span>
            <input
              className="tool-input mono"
              type="number"
              min="0"
              step="0.01"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
            />
          </label>

          <label className="tool-field">
            <span className="tool-label">From</span>
            <select
              className="tool-input"
              value={baseCurrency}
              onChange={(event) => {
                const newBase = event.target.value;
                setBaseCurrency(newBase);
                if (targetCurrency === newBase) {
                  setTargetCurrency(availableCurrencies.find((c) => c !== newBase) ?? newBase);
                }
              }}
            >
              {availableCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {getCurrencyLabel(currency)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="currency-swap-button"
            onClick={handleSwapCurrencies}
            aria-label="Swap from and to currencies"
            title="Swap currencies"
          >
            ↔
          </button>

          <label className="tool-field">
            <span className="tool-label">To</span>
            <select
              className="tool-input"
              value={targetCurrency}
              onChange={(event) => setTargetCurrency(event.target.value)}
            >
              {availableCurrencies
                .filter((c) => c !== baseCurrency)
                .map((currency) => (
                  <option key={currency} value={currency}>
                    {getCurrencyLabel(currency)}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

      {snapshotQuery.isPending ? <p className="tool-status">Loading rates...</p> : null}
      {snapshotQuery.isError ? (
        <div className="card">
          <div className="card-body">
            <p className="tool-status tool-status-error">Unable to load rates right now.</p>
            <button type="button" className="tool-button" onClick={() => snapshotQuery.refetch()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {snapshotQuery.data ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Rate Snapshot</p>
            <p className="tool-meta">
              Rates from {formatRateDate(snapshotQuery.data.updatedAt)} · Retrieved {formatFetchTime(snapshotQuery.data.fetchedAt)}
            </p>
          </div>
          <div className="card-body currency-result">
            <div className="currency-rate">
              <span>1 {baseCurrency}</span>
              <span>=</span>
              <span>
                {(snapshotQuery.data.rates[targetCurrency] ?? 0).toFixed(4)} {targetCurrency}
              </span>
            </div>
            <div className="currency-total">
              <span className="currency-total-from">{formatMoney(amount, baseCurrency)}</span>
              <span className="currency-total-arrow">→</span>
              <span className="currency-total-to">{formatMoney(converted, targetCurrency)}</span>
            </div>
          </div>
          <div style={{ borderTop: '1.5px solid var(--border)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  padding: '0 0 0',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-2)',
                }}
              >
                <span style={{ fontSize: '10px' }}>{detailsOpen ? '▾' : '▸'}</span>
                Rates are sourced from{' '}
                <a
                  href="https://frankfurter.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                >
                  Frankfurter
                </a>
              </button>
              {detailsOpen && (
                <p style={{ color: 'var(--text-2)', fontSize: '13px', margin: '8px 0 0 15px' }}>
                  Frankfurter aggregates data from central banks and official institutions. Rates
                  update on business days — the ECB (European Central Bank) publishes reference 
                  rates around 16:00 CET. Weekends and public holidays use the most recent prior
                  business day's rates.
                </p>
              )}
            </div>
            {relevantProviders.length > 0 ? (
              <div>
                <button
                  type="button"
                  onClick={() => setSourcesOpen((o) => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: 'none',
                    padding: '0 0 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-2)',
                  }}
                >
                  <span style={{ fontSize: '10px' }}>{sourcesOpen ? '▾' : '▸'}</span>
                  Sources for {baseCurrency} → {targetCurrency}
                </button>
                {sourcesOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {relevantProviders.map((p) => {
                      const chips = p.currencies.filter((c) =>
                        (availableCurrencies as string[]).includes(c),
                      );
                      return (
                        <a
                          key={p.key}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-2)',
                            color: 'var(--text)',
                            textDecoration: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>↗</span>
                          </div>
                          {chips.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {chips.map((c) => {
                                const active = c === baseCurrency || c === targetCurrency;
                                return (
                                  <span
                                    key={c}
                                    style={{
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      border: '1px solid var(--border)',
                                      fontWeight: active ? 600 : 400,
                                      backgroundColor: active ? 'var(--bg-3)' : 'transparent',
                                      color: active ? 'var(--text)' : 'var(--text-2)',
                                    }}
                                  >
                                    {c}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
