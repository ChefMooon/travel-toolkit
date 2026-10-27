import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const resources = {
  en: { translation: { settings: 'Settings', measurement: 'Measurements', metric: 'Metric', imperial: 'Imperial', clock: 'Clock format', preferredCurrency: 'Preferred currency', language: 'Language', english: 'English' } },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
