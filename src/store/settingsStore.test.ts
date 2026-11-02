import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mapBrowserLanguage, useSettingsStore } from './settingsStore';

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

  it('accepts only the explicitly available French language from persisted settings', async () => {
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { language: 'fr-CA' }, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('fr-CA');
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { language: 'ar' }, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('en');
  });

  it('accepts persisted French (France) and Spanish selections', async () => {
    for (const language of ['fr-FR', 'es-ES', 'es-MX']) {
      localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { language }, version: 0 }));
      await useSettingsStore.persist.rehydrate();
      expect(useSettingsStore.getState().language).toBe(language);
    }
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

  it('maps browser language tags to the closest supported locale', () => {
    const expected: Record<string, string | null> = {
      en: 'en', 'en-GB': 'en', 'EN-us': 'en',
      fr: 'fr-FR', 'fr-FR': 'fr-FR', 'fr-BE': 'fr-FR', 'fr-CH': 'fr-FR', 'fr-CA': 'fr-CA', 'fr-ca': 'fr-CA', 'fr-Latn-CA': 'fr-CA',
      es: 'es-ES', 'es-ES': 'es-ES', 'es-AD': 'es-ES', 'es-MX': 'es-MX', 'es-419': 'es-MX', 'es-US': 'es-MX', 'es-AR': 'es-MX', 'es-CO': 'es-MX', 'es-Latn-MX': 'es-MX',
      de: null, 'de-DE': null, pt: null, '': null,
    };
    for (const [tag, language] of Object.entries(expected)) expect(mapBrowserLanguage(tag), tag).toBe(language);
    expect(mapBrowserLanguage(undefined)).toBeNull();
  });

  it('detects French and Spanish variants from the browser when no language is saved', async () => {
    for (const [languages, language] of [[['fr-BE'], 'fr-FR'], [['es-AR', 'en'], 'es-MX'], [['es'], 'es-ES'], [['de', 'es-CL'], 'es-MX']] as const) {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue([...languages]);
      localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: {}, version: 0 }));
      await useSettingsStore.persist.rehydrate();
      expect(useSettingsStore.getState().language, languages.join()).toBe(language);
    }
  });

  it('preserves a saved language and falls back to English for unsupported locales', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-CA']);
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: { language: 'en' }, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('en');

    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE', 'pt-BR']);
    localStorage.setItem('travel-toolkit-settings-data', JSON.stringify({ state: {}, version: 0 }));
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().language).toBe('en');
  });
});
