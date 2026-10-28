import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Thermometer, Ruler, Weight, Droplets } from 'lucide-react';
import Select from '@/components/Select/Select';
import NumericInput from '@/components/NumericInput/NumericInput';
import { categories, convert } from './conversions';
import { formatNumber } from '@/i18n/format';
import type { TranslationKey } from '@/i18n';

const measurements = [
  { label: 'Temperature', icon: Thermometer },
  { label: 'Distance', icon: Ruler },
  { label: 'Weight', icon: Weight },
  { label: 'Volume', icon: Droplets },
] as const;
const categoryTranslationKeys = { Temperature: 'unitTemperature', Distance: 'unitDistance', Weight: 'unitWeight', Volume: 'unitVolume' } as const satisfies Record<string, TranslationKey>;
const unitTranslationKeys = {
  'Celsius (°C)': 'unitCelsius', 'Fahrenheit (°F)': 'unitFahrenheit', 'Kilometers (km)': 'unitKilometers', 'Miles (mi)': 'unitMiles',
  'Meters (m)': 'unitMeters', 'Feet (ft)': 'unitFeet', 'Kilograms (kg)': 'unitKilograms', 'Pounds (lb)': 'unitPounds',
  'Grams (g)': 'unitGrams', 'Ounces (oz)': 'unitOunces', 'Liters (L)': 'unitLiters', 'US gallons (gal)': 'unitUSGallons',
  'Milliliters (mL)': 'unitMilliliters', 'US fluid ounces (fl oz)': 'unitUSFluidOunces', 'Imperial gallons (gal)': 'unitImperialGallons',
  'Imperial fluid ounces (fl oz)': 'unitImperialFluidOunces',
} as const satisfies Record<string, TranslationKey>;

export default function UnitConverter() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('Temperature');
  const [from, setFrom] = useState(categories.Temperature![0]!.label);
  const [to, setTo] = useState(categories.Temperature![1]!.label);
  const [amount, setAmount] = useState('1');
  const units = categories[category]!;
  const fromUnit = units.find((unit) => unit.label === from)!;
  const toUnit = units.find((unit) => unit.label === to)!;
  const value = amount.trim() === '' ? NaN : Number(amount);
  const result = convert(value, fromUnit, toUnit);
  const formatted = Number.isFinite(result) ? formatNumber(result, { maximumSignificantDigits: 10 }) : null;

  const categoryLabel = (label: string) => {
    const key = categoryTranslationKeys[label as keyof typeof categoryTranslationKeys];
    return key ? t(key) : label;
  };
  const unitLabel = (label: string) => {
    const key = unitTranslationKeys[label as keyof typeof unitTranslationKeys];
    return key ? t(key) : label;
  };

  function changeCategory(next: string) {
    const nextUnits = categories[next]!;
    setCategory(next);
    setFrom(nextUnits[0]!.label);
    setTo(nextUnits[1]!.label);
  }

  return (
    <main className="tool-page" data-page-entrance aria-label={t('toolUnits')}>
      <h1>{t('toolUnits')}</h1>
      <p className="unit-intro">{t('unitIntro')}</p>
      <div className="card">
        <div className="card-header"><h2 className="card-title">{t('conversionInputs')}</h2></div>
        <div className="card-body unit-controls">
          <fieldset className="unit-measurement">
            <legend className="tool-label">{t('measurement')}</legend>
            <div className="unit-measurement-options">
              {measurements.map(({ label, icon: Icon }) => (
                <label className="unit-measurement-option" key={label}>
                  <input type="radio" name="measurement" value={label} checked={category === label} onChange={() => changeCategory(label)} />
                  <span><Icon size={18} aria-hidden="true" />{categoryLabel(label)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="tool-field"><span className="tool-label">{t('amount')}</span>
            <NumericInput className="tool-input mono" aria-label={t('amount')} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="tool-field"><span className="tool-label">{t('fromUnit')}</span>
            <Select className="tool-input" aria-label={t('fromUnitAccessible')} value={from} options={units.map((unit) => unit.label)} getOptionLabel={unitLabel} onChange={setFrom} />
          </div>
          <button type="button" className="currency-swap-button unit-swap" aria-label={t('swapUnits')} onClick={() => { setFrom(to); setTo(from); }}><ArrowLeftRight size={18} aria-hidden="true" /></button>
          <div className="tool-field"><span className="tool-label">{t('toUnit')}</span>
            <Select className="tool-input" aria-label={t('toUnitAccessible')} value={to} options={units.map((unit) => unit.label)} getOptionLabel={unitLabel} onChange={setTo} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">{t('result')}</h2></div>
        <div className="card-body unit-result" aria-live="polite" aria-atomic="true">
          {formatted === null ? t('invalidAmount') : <><span>{amount} {unitLabel(from)}</span><strong>= {formatted} {unitLabel(to)}</strong></>}
        </div>
      </div>
    </main>
  );
}
