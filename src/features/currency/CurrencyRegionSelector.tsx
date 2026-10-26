import { useCurrencyStore } from '@/store/currencyStore';
import { REGION_LIST } from '@/store/types';
import type { Region } from '@/store/types';
import Select from '@/components/Select/Select';

export default function CurrencyRegionSelector() {
  const region = useCurrencyStore((s) => s.region);
  const setRegion = useCurrencyStore((s) => s.setRegion);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Region</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <Select
          aria-label="Currency region"
          className="shared-select-full"
          value={region}
          options={REGION_LIST}
          onChange={(value) => setRegion(value as Region)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-2)',
            color: 'var(--text)',
            fontSize: '14px',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}
