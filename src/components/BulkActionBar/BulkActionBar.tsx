interface BulkActionBarProps {
  selectedCount: number;
  onApply: (currency: string) => void;
  onClear: () => void;
  bulkCurrency: string;
  onBulkCurrencyChange: (currency: string) => void;
  currencies: string[];
}

export default function BulkActionBar({
  selectedCount,
  onApply,
  onClear,
  bulkCurrency,
  onBulkCurrencyChange,
  currencies,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar">
      <span>{selectedCount} selected —</span>
      <span style={{ fontWeight: 500 }}>Bulk currency:</span>
      <select
        className="bulk-sel"
        value={bulkCurrency}
        onChange={(e) => onBulkCurrencyChange(e.target.value)}
      >
        {currencies.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button className="bulk-apply" onClick={() => onApply(bulkCurrency)}>
        Apply
      </button>
      <button className="bulk-clear" onClick={onClear}>✕ Clear</button>
    </div>
  );
}
