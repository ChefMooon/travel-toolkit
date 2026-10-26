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
      <div className="currency-region-body">
        <Select
          aria-label="Currency region"
          className="shared-select-full currency-region-select"
          value={region}
          options={REGION_LIST}
          onChange={(value) => setRegion(value as Region)}
        />
      </div>
    </div>
  );
}
