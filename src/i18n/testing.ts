import i18next, { type i18n as I18nInstance } from 'i18next';
import { resources } from '@/i18n';

/** Creates a fresh English-only instance so component tests cannot leak locale state. */
export async function createEnglishTestI18n(): Promise<I18nInstance> {
  const instance = i18next.createInstance();
  await instance.init({
    resources: { en: resources.en },
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: ['en'],
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
