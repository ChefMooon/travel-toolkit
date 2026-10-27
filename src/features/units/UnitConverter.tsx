import { useState } from 'react';
import { ArrowLeftRight, Thermometer, Ruler, Weight, Droplets } from 'lucide-react';
import Select from '@/components/Select/Select';
import NumericInput from '@/components/NumericInput/NumericInput';
import { categories, convert } from './conversions';

const measurements = [
  { label: 'Temperature', icon: Thermometer },
  { label: 'Distance', icon: Ruler },
  { label: 'Weight', icon: Weight },
  { label: 'Volume', icon: Droplets },
] as const;

export default function UnitConverter() {
  const [category, setCategory] = useState('Temperature');
  const [from, setFrom] = useState(categories.Temperature![0]!.label);
  const [to, setTo] = useState(categories.Temperature![1]!.label);
  const [amount, setAmount] = useState('1');
  const units = categories[category]!;
  const fromUnit = units.find((unit) => unit.label === from)!;
  const toUnit = units.find((unit) => unit.label === to)!;
  const value = amount.trim() === '' ? NaN : Number(amount);
  const result = convert(value, fromUnit, toUnit);
  const formatted = Number.isFinite(result) ? new Intl.NumberFormat(undefined, { maximumSignificantDigits: 10 }).format(result) : null;

  function changeCategory(next: string) {
    const nextUnits = categories[next]!;
    setCategory(next);
    setFrom(nextUnits[0]!.label);
    setTo(nextUnits[1]!.label);
  }

  return (
    <main className="tool-page" data-page-entrance aria-label="Unit converter">
      <h1>Unit Converter</h1>
      <p className="unit-intro">Convert everyday measurements for your travels.</p>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Conversion Inputs</h2></div>
        <div className="card-body unit-controls">
          <fieldset className="unit-measurement">
            <legend className="tool-label">Measurement</legend>
            <div className="unit-measurement-options">
              {measurements.map(({ label, icon: Icon }) => (
                <label className="unit-measurement-option" key={label}>
                  <input type="radio" name="measurement" value={label} checked={category === label} onChange={() => changeCategory(label)} />
                  <span><Icon size={18} aria-hidden="true" />{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="tool-field"><span className="tool-label">Amount</span>
            <NumericInput className="tool-input mono" aria-label="Amount" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="tool-field"><span className="tool-label">From</span>
            <Select className="tool-input" aria-label="From unit" value={from} options={units.map((unit) => unit.label)} onChange={setFrom} />
          </div>
          <button type="button" className="currency-swap-button unit-swap" aria-label="Swap from and to units" onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight size={18} aria-hidden="true" /></button>
          <div className="tool-field"><span className="tool-label">To</span>
            <Select className="tool-input" aria-label="To unit" value={to} options={units.map((unit) => unit.label)} onChange={setTo} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Result</h2></div>
        <div className="card-body unit-result" aria-live="polite" aria-atomic="true">
          {formatted === null ? 'Enter a valid amount to convert.' : <><span>{amount} {from}</span><strong>= {formatted} {to}</strong></>}
        </div>
      </div>
    </main>
  );
}
