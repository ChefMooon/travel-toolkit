import { useEffect, useMemo, useState } from 'react';
import { getAvailableCurrencies, getDefaultCurrency } from '@/store/types';
import { useCurrencyStore } from '@/store/currencyStore';
import { useCurrencySnapshot } from './useCurrencySnapshot';
import { useCurrencyMetadata } from './useCurrencyMetadata';
import { useCurrencyProviders } from './useCurrencyProviders';
import CurrencyRegionSelector from './CurrencyRegionSelector';
import Tooltip from '@/components/Tooltip';
import Select from '@/components/Select/Select';
import NumericInput from '@/components/NumericInput/NumericInput';
import { ArrowLeftRight, ArrowRight, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

function formatRateDate(dateStr: string) {
  // API date is YYYY-MM-DD (UTC); parse as UTC to avoid day-offset in negative-offset timezones
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function formatFetchTime(isoStr: string, hour12: boolean) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12 });
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
  const preferredCurrency = useSettingsStore((s) => s.preferredCurrency);
  const clockFormat = useSettingsStore((s) => s.clockFormat);

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
    if (!snapshotQuery.data || snapshotQuery.data.base !== baseCurrency) return null;
    const rate = snapshotQuery.data.rates[targetCurrency];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
    return amount * rate;
  }, [amount, baseCurrency, snapshotQuery.data, targetCurrency]);

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
    const defaultBase = availableCurrencies.includes(preferredCurrency) ? preferredCurrency : getDefaultCurrency(region);
    const defaultTarget = availableCurrencies.includes('USD') && 'USD' !== defaultBase
      ? 'USD'
      : (availableCurrencies.find((c) => c !== defaultBase) ?? availableCurrencies[0] ?? 'USD');
    setAmountInput('100');
    setBaseCurrency(defaultBase);
    setTargetCurrency(defaultTarget);
  }

  return (
    <main className="tool-page" data-page-entrance aria-label="Currency converter">
      <h1>Currency Converter</h1>

      <CurrencyRegionSelector />

      <div className="card">
        <div className="card-header">
          <p className="card-title">Conversion Inputs</p>
          <Tooltip content="Reset to defaults">
            <button
              type="button"
              className="currency-reset-button"
              onClick={handleReset}
              aria-label="Reset conversion inputs"
            >
              Reset
            </button>
          </Tooltip>
        </div>
        <div className="card-body currency-controls">
          <div className="tool-field">
            <span className="tool-label">Amount</span>
            <NumericInput
              className="tool-input mono"
              aria-label="Amount"
              min="0"
              step="0.01"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
            />
          </div>

          <div className="tool-field">
            <span className="tool-label">From</span>
            <Select
              className="tool-input currency-select"
              aria-label="From currency"
              value={baseCurrency}
              options={availableCurrencies}
              getOptionLabel={getCurrencyLabel}
              onChange={(newBase) => {
                setBaseCurrency(newBase);
                if (targetCurrency === newBase) {
                  setTargetCurrency(availableCurrencies.find((c) => c !== newBase) ?? newBase);
                }
              }}
            />
          </div>

          <Tooltip content="Swap currencies">
            <button
              type="button"
              className="currency-swap-button"
              onClick={handleSwapCurrencies}
              aria-label="Swap from and to currencies"
            >
              <ArrowLeftRight size={18} aria-hidden="true" />
            </button>
          </Tooltip>

          <div className="tool-field">
            <span className="tool-label">To</span>
            <Select
              className="tool-input currency-select"
              aria-label="To currency"
              value={targetCurrency}
              options={availableCurrencies.filter((c) => c !== baseCurrency)}
              getOptionLabel={getCurrencyLabel}
              onChange={setTargetCurrency}
            />
          </div>
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

      {snapshotQuery.data && snapshotQuery.data.base === baseCurrency ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Rate Snapshot</p>
            <p className="tool-meta">
              Rates from {formatRateDate(snapshotQuery.data.updatedAt)} · Retrieved {formatFetchTime(snapshotQuery.data.fetchedAt, clockFormat === '12h')}
            </p>
          </div>
          <div className="card-body currency-result">
            <div className="currency-rate">
              <span>1 {baseCurrency}</span>
              <span>=</span>
              <span>
                {typeof snapshotQuery.data.rates[targetCurrency] === 'number' && Number.isFinite(snapshotQuery.data.rates[targetCurrency]) && snapshotQuery.data.rates[targetCurrency] > 0
                  ? `${snapshotQuery.data.rates[targetCurrency].toFixed(4)} ${targetCurrency}`
                  : 'Rate unavailable'}
              </span>
            </div>
            <div className="currency-total">
              <span className="currency-total-from">{formatMoney(amount, baseCurrency)}</span>
              <span className="currency-total-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
              <span className="currency-total-to">{converted === null ? 'Conversion unavailable' : formatMoney(converted, targetCurrency)}</span>
            </div>
          </div>
          <div className="currency-disclosures">
            <section className="currency-disclosure">
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                className="currency-disclosure-toggle"
                aria-expanded={detailsOpen}
                aria-controls="currency-rate-details"
              >
                {detailsOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                <span>Rates are sourced from</span>
              </button>
              <a className="currency-provider-link" href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer">
                Frankfurter <ExternalLink size={12} aria-hidden="true" />
              </a>
              <p id="currency-rate-details" className="currency-disclosure-copy" hidden={!detailsOpen}>
                  Frankfurter aggregates data from central banks and official institutions. Rates
                  update on business days — the ECB (European Central Bank) publishes reference 
                  rates around 16:00 CET. Weekends and public holidays use the most recent prior
                  business day's rates.
              </p>
            </section>
            {relevantProviders.length > 0 ? (
              <div>
                <button
                  type="button"
                  onClick={() => setSourcesOpen((o) => !o)}
                  className="currency-disclosure-toggle currency-sources-toggle"
                  aria-expanded={sourcesOpen}
                  aria-controls="currency-provider-list"
                >
                  {sourcesOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                  Sources for {baseCurrency} <ArrowRight size={12} aria-hidden="true" /> {targetCurrency}
                </button>
                <div id="currency-provider-list" className="currency-provider-list" hidden={!sourcesOpen}>
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
                          className="currency-provider-card"
                        >
                          <div className="currency-provider-heading">
                            <span>{p.name}</span>
                            <ExternalLink size={13} aria-hidden="true" />
                          </div>
                          {chips.length > 0 && (
                            <div className="currency-provider-chips">
                              {chips.map((c) => {
                                const active = c === baseCurrency || c === targetCurrency;
                                return (
                                  <span
                                    key={c}
                                    className={`currency-provider-chip${active ? ' is-active' : ''}`}
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
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
