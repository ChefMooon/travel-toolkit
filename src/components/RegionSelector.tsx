import { useTripStore } from '@/store/tripStore';
import { REGION_LIST } from '@/store/types';
import type { Region } from '@/store/types';

export default function RegionSelector() {
  const region = useTripStore((s) => s.region);
  const setRegion = useTripStore((s) => s.setRegion);

  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div className="card-header">
        <span className="card-title">Region</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as Region)}
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
        >
          {REGION_LIST.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
