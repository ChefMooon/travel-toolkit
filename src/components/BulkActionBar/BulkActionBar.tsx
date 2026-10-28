import { Trash2 } from 'lucide-react';
import Select from '@/components/Select/Select';
import { useTranslation } from 'react-i18next';
import '@/i18n';

interface BulkActionBarProps {
  selectedCount: number;
  onApply: (currency: string) => void;
  onDeleteSelected: () => void;
  onClear: () => void;
  bulkCurrency: string;
  onBulkCurrencyChange: (currency: string) => void;
  currencies: string[];
}

export default function BulkActionBar({
  selectedCount,
  onApply,
  onDeleteSelected,
  onClear,
  bulkCurrency,
  onBulkCurrencyChange,
  currencies,
}: BulkActionBarProps) {
  const { t } = useTranslation();
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar">
      <span className="bulk-count">{t('selectedCount', { count: selectedCount })}</span>
      <label className="bulk-label" htmlFor="bulk-currency-select">{t('bulkCurrency')}</label>
      <Select
        id="bulk-currency-select"
        className="bulk-sel"
        value={bulkCurrency}
        onChange={onBulkCurrencyChange}
        options={currencies}
      />
      <button type="button" className="bulk-apply" onClick={() => onApply(bulkCurrency)}>
        {t('apply')}
      </button>
      <div className="bulk-bar-actions">
        <button type="button" className="bulk-delete" onClick={onDeleteSelected}>
          <Trash2 size={13} aria-hidden="true" />
          <span>{t('deleteSelected')}</span>
        </button>
        <button type="button" className="bulk-clear" onClick={onClear}>✕ {t('clear')}</button>
      </div>
    </div>
  );
}
