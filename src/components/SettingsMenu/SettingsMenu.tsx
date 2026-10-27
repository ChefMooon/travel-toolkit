import { useEffect, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { CURRENCIES, REGION_LIST } from '@/store/types';
import { useSettingsStore } from '@/store/settingsStore';
import Select from '@/components/Select/Select';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';

export default function SettingsMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const listbox = (event.target as Element).closest?.('[role="listbox"]');
      if (listbox?.id && containerRef.current?.querySelector(`[aria-controls="${CSS.escape(listbox.id)}"]`)) return;
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);
  const measurement = useSettingsStore((s) => s.measurementSystem);
  const setMeasurement = useSettingsStore((s) => s.setMeasurementSystem);
  const clock = useSettingsStore((s) => s.clockFormat);
  const setClock = useSettingsStore((s) => s.setClockFormat);
  const currency = useSettingsStore((s) => s.preferredCurrency);
  const setCurrency = useSettingsStore((s) => s.setPreferredCurrency);
  const region = useSettingsStore((s) => s.preferredRegion);
  const setRegion = useSettingsStore((s) => s.setPreferredRegion);
  return <div className="settings-menu" ref={containerRef}>
    <button ref={triggerRef} type="button" className="grid-nav-trigger" aria-label={t('settings')} aria-expanded={open} aria-controls="global-settings-panel" onClick={() => setOpen((value) => !value)}><Settings2 aria-hidden="true" /></button>
    {open && <section id="global-settings-panel" className="global-settings-panel" aria-label={t('settings')}>
      <div className="global-settings-theme"><span>Theme</span><ThemeSelector /></div>
      <label htmlFor="settings-measurement">{t('measurement')}<Select id="settings-measurement" className="shared-select-full" value={measurement} options={['metric', 'imperial']} getOptionLabel={(value) => t(value)} onChange={(value) => setMeasurement(value as 'metric' | 'imperial')} /></label>
      <label htmlFor="settings-clock">{t('clock')}<Select id="settings-clock" className="shared-select-full" value={clock} options={['12h', '24h']} getOptionLabel={(value) => value === '12h' ? '12 hour' : '24 hour'} onChange={(value) => setClock(value as '12h' | '24h')} /></label>
      <label htmlFor="settings-currency">{t('preferredCurrency')}<Select id="settings-currency" className="shared-select-full" value={currency} options={CURRENCIES} onChange={setCurrency} /></label>
      <label htmlFor="settings-region">Preferred region<Select id="settings-region" className="shared-select-full" value={region ?? ''} options={['', ...REGION_LIST]} getOptionLabel={(value) => value || 'No preferred region'} onChange={(value) => setRegion((value || null) as typeof region)} /></label>
      <p className="global-settings-hint">New trips use your preferred currency when it is available in the selected region; otherwise they use that region’s default.</p>
      <label htmlFor="settings-language">{t('language')}<Select id="settings-language" className="shared-select-full" value="en" options={['en']} getOptionLabel={() => t('english')} onChange={() => {}} disabled /></label>
    </section>}
  </div>;
}
