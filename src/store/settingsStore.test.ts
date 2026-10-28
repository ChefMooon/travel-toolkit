import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('global settings', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.persist.clearStorage();
    useSettingsStore.setState({ measurementSystem: 'metric', clockFormat: '12h', preferredCurrency: 'USD', preferredRegion: null, language: 'en' });
  });

  it('provides the requested defaults', () => {
    expect(useSettingsStore.getState()).toMatchObject({ measurementSystem: 'metric', clockFormat: '12h', preferredCurrency: 'USD', preferredRegion: null, language: 'en' });
  });

  it('persists valid preferences and safely falls back for missing or invalid values', async () => {
    useSettingsStore.getState().setMeasurementSystem('imperial');
    useSettingsStore.getState().setClockFormat('24h');
    useSettingsStore.getState().setPreferredCurrency('CAD');
    useSettingsStore.getState().setPreferredRegion('Asia');
    expect(JSON.parse(localStorage.getItem('travel-toolkit-settings-data') ?? '{}').state).toMatchObject({ measurementSystem: 'imperial', clockFormat: '24h', preferredCurrency: 'CAD', preferredRegion: 'Asia' });

    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { measurementSystem: 'invalid', clockFormat: 12, preferredCurrency: 'not-a-code', preferredRegion: 'Atlantis' }, version: 0 }));
    useSettingsStore.setState({ measurementSystem: 'metric', clockFormat: '12h', preferredCurrency: 'USD', preferredRegion: null, language: 'en' });
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState()).toMatchObject({ measurementSystem: 'metric', clockFormat: '12h', preferredCurrency: 'USD', preferredRegion: null, language: 'en' });
  });

  it('accepts only the explicitly available review preview language from persisted settings', async () => {
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { language: 'fr-CA' }, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('fr-CA');
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { language: 'ar' }, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('en');
  });
});
