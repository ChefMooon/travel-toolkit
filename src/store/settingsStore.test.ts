import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('global settings', () => {
  afterEach(() => vi.restoreAllMocks());
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

  it('detects the first supported browser language when no language is saved', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE', 'fr-ca', 'en-US']);
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: {}, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('fr-CA');

    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-CA', 'fr-CA']);
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: {}, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('en');
  });

  it('preserves a saved language and falls back to English for unsupported locales', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-CA']);
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { language: 'en' }, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('en');

    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR', 'de-DE']);
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: {}, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('en');
  });
});
