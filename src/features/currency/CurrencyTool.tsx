import { useMemo, useState } from 'react';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from './currencyData';
import { useCurrencySnapshot } from './useCurrencySnapshot';

function parseAmount(input: string) {
  const value = Number.parseFloat(input);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

function formatMoney(value: number, currency: SupportedCurrency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function CurrencyTool() {
  const [amountInput, setAmountInput] = useState('100');
  const [baseCurrency, setBaseCurrency] = useState<SupportedCurrency>('USD');
  const [targetCurrency, setTargetCurrency] = useState<SupportedCurrency>('EUR');

  const amount = parseAmount(amountInput);
  const query = useCurrencySnapshot(baseCurrency);

  const converted = useMemo(() => {
    if (!query.data) {
      return 0;
    }
    const rate = query.data.rates[targetCurrency] ?? 0;
    return amount * rate;
  }, [amount, query.data, targetCurrency]);

  return (
    <section className="tool-page" aria-label="Currency converter">
      <h1>Currency Converter</h1>

      <div className="card">
        <div className="card-header">
          <p className="card-title">Conversion Inputs</p>
        </div>
        <div className="card-body tool-controls">
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
              onChange={(event) => setBaseCurrency(event.target.value as SupportedCurrency)}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>

          <label className="tool-field">
            <span className="tool-label">To</span>
            <select
              className="tool-input"
              value={targetCurrency}
              onChange={(event) => setTargetCurrency(event.target.value as SupportedCurrency)}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {query.isPending ? <p className="tool-status">Loading rates...</p> : null}
      {query.isError ? (
        <div className="card">
          <div className="card-body">
            <p className="tool-status tool-status-error">Unable to load rates right now.</p>
            <button type="button" className="tool-button" onClick={() => query.refetch()}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {query.data ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Rate Snapshot</p>
            <p className="tool-meta">{query.data.updatedAt}</p>
          </div>
          <div className="card-body tool-results">
            <p>
              {formatMoney(amount, baseCurrency)} = {formatMoney(converted, targetCurrency)}
            </p>
            <p>
              1 {baseCurrency} = {query.data.rates[targetCurrency].toFixed(4)} {targetCurrency}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
