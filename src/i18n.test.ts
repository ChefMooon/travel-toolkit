import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n, { activateLanguage, resources, syncDocumentLocale } from './i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { createEnglishTestI18n } from './i18n/testing';
import { useTripStore } from '@/store/tripStore';
import { useSaveSlotStore } from '@/store/saveSlotStore';

describe('site language activation', () => {
  afterEach(async () => {
    await activateLanguage('en');
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    vi.restoreAllMocks();
  });

  it('starts from the English fallback resource', () => {
    expect(i18n.t('settings')).toBe('Settings');
    expect(resources.en.translation.language).toBe('Language');
  });

  it('provides a fresh English-only i18n instance for isolated component tests', async () => {
    const first = await createEnglishTestI18n();
    const second = await createEnglishTestI18n();
    await first.changeLanguage('fr-CA');
    expect(first.resolvedLanguage).toBe('en');
    expect(second.resolvedLanguage).toBe('en');
  });

  it('synchronizes a diagnostic RTL fixture without registering it as an application language', () => {
    syncDocumentLocale('ar', 'rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(resources).not.toHaveProperty('ar');
  });

  it('loads the French review preview on explicit selection and synchronizes persisted and document state', async () => {
    const activated = await activateLanguage('fr-CA');
    expect(activated).toBe(true);
    expect(i18n.resolvedLanguage).toBe('fr-CA');
    expect(i18n.t('settings')).toBe('Paramètres');
    expect(useSettingsStore.getState().language).toBe('fr-CA');
    expect(document.documentElement.lang).toBe('fr-CA');
    expect(document.documentElement.dir).toBe('ltr');
    expect(i18n.t('daysUntilTrip', { count: 2 })).toBe('jours avant votre voyage');
  });

  it('keeps the latest language selection when a French resource load is still pending', async () => {
    let finishLoad!: (value: { default: Record<string, string> }) => void;
    const frenchPending = activateLanguage('fr-CA', () => new Promise((resolve) => { finishLoad = resolve; }));

    await expect(activateLanguage('en')).resolves.toBe(true);
    finishLoad({ default: { settings: 'Paramètres' } });

    await expect(frenchPending).resolves.toBe(false);
    expect(i18n.resolvedLanguage).toBe('en');
    expect(useSettingsStore.getState().language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('preserves edited trip data, global preferences, and a saved slot when the language changes', async () => {
    const priorSettings = useSettingsStore.getState();
    const priorTrip = useTripStore.getState();
    const priorSlots = useSaveSlotStore.getState();
    try {
      useSaveSlotStore.getState().clearSlot(0);
      useSettingsStore.getState().setMeasurementSystem('imperial');
      useSettingsStore.getState().setClockFormat('24h');
      useSettingsStore.getState().setPreferredCurrency('CAD');
      useSettingsStore.getState().setPreferredRegion('Asia');

      const trip = useTripStore.getState();
      trip.setTripId('i18n-preview-123');
      trip.setTripName('Québec review trip');
      trip.setGlobalMarkup(47.5);
      trip.setTripDates('2027-02-28', '2027-03-01');
      const groupId = trip.addCouple('Équipe Montréal');
      trip.addCost({
        name: 'Train', currency: 'CAD', value: 1234.5, markupOverride: null,
        splitType: 'shared', assignedCoupleIds: [groupId], type: 'trains',
      });
      const editedSnapshot = useTripStore.getState().getSnapshot();
      expect(useSaveSlotStore.getState().saveToSlot(0, editedSnapshot)).toBe(true);
      const savedSlotBefore = structuredClone(useSaveSlotStore.getState().slots[0]);
      const settingsBefore = {
        measurementSystem: useSettingsStore.getState().measurementSystem,
        clockFormat: useSettingsStore.getState().clockFormat,
        preferredCurrency: useSettingsStore.getState().preferredCurrency,
        preferredRegion: useSettingsStore.getState().preferredRegion,
      };

      await activateLanguage('fr-CA');

      expect(useTripStore.getState().getSnapshot()).toEqual(editedSnapshot);
      expect(useSaveSlotStore.getState().slots[0]).toEqual(savedSlotBefore);
      expect(useSettingsStore.getState()).toMatchObject({ ...settingsBefore, language: 'fr-CA' });
      expect(useTripStore.getState().tripStartDate).toBe('2027-02-28');
      expect(useTripStore.getState().costs[0]?.value).toBe(1234.5);
    } finally {
      await activateLanguage('en');
      useTripStore.setState(priorTrip);
      useSaveSlotStore.setState(priorSlots);
      useSettingsStore.setState(priorSettings);
    }
  });

  it('falls back to English and persists matching metadata when the preview resource fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const activated = await activateLanguage('fr-CA', () => Promise.reject(new Error('resource unavailable')));
    expect(activated).toBe(false);
    expect(i18n.resolvedLanguage).toBe('en');
    expect(useSettingsStore.getState().language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
