import { useTripStore } from '@/store/tripStore';
import { REGION_LIST } from '@/store/types';
import type { Region } from '@/store/types';
import Select from '@/components/Select/Select';

export default function RegionSelector() {
  const region = useTripStore((s) => s.region);
  const setRegion = useTripStore((s) => s.setRegion);

  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div className="card-header">
        <h2 id="region-heading" className="card-title">Region</h2>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <label htmlFor="trip-region-select" className="sr-only">Region</label>
        <Select
          id="trip-region-select"
          value={region}
          options={REGION_LIST}
          onChange={(value) => setRegion(value as Region)}
          className="shared-select-full"
          aria-label="Region"
        />
      </div>
    </div>
  );
}
