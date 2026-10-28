import { useCurrencyStore } from '@/store/currencyStore';
import { REGION_LIST } from '@/store/types';
import type { Region } from '@/store/types';
import Select from '@/components/Select/Select';
import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@/i18n';

const regionKeys: Record<Region, TranslationKey> = {
  'North America': 'currencyRegionNorthAmerica', Europe: 'currencyRegionEurope', Asia: 'currencyRegionAsia',
  Oceania: 'currencyRegionOceania', Americas: 'currencyRegionAmericas', Africa: 'currencyRegionAfrica',
};

export default function CurrencyRegionSelector() {
  const { t } = useTranslation();
  const region = useCurrencyStore((s) => s.region);
  const setRegion = useCurrencyStore((s) => s.setRegion);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{t('currencyRegion')}</span>
      </div>
      <div className="currency-region-body">
        <Select
          aria-label={t('currencyRegion')}
          className="shared-select-full currency-region-select"
          value={region}
          options={REGION_LIST}
          getOptionLabel={(value) => regionKeys[value as Region] ? t(regionKeys[value as Region]) : value}
          onChange={(value) => setRegion(value as Region)}
        />
      </div>
    </div>
  );
}
