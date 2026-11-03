/**
 * Single registry of interface languages. Adding a language starts here; see docs/internationalization.md.
 * Keep this file free of imports so the settings store, i18n setup, and UI can all depend on it.
 */
interface LanguageDefinition {
  /** Name shown in the Settings language selector, written in that language. */
  label: string;
  direction: 'ltr' | 'rtl';
  /**
   * Browser-language detection. `language` is the primary subtag (`fr`). A tag whose region is in `regions` selects
   * this entry; the entry with `fallback: true` receives the language's other tags (including a bare `fr`).
   */
  browser: { language: string; regions?: readonly string[]; fallback?: boolean };
}

export const LANGUAGES = {
  en: { label: 'English', direction: 'ltr', browser: { language: 'en', fallback: true } },
  'fr-CA': { label: 'Français (Canada)', direction: 'ltr', browser: { language: 'fr', regions: ['CA'] } },
  'fr-FR': { label: 'Français (France)', direction: 'ltr', browser: { language: 'fr', fallback: true } },
  'es-ES': { label: 'Español (España)', direction: 'ltr', browser: { language: 'es', fallback: true } },
  // Latin American regions use Mexican-style wording.
  'es-MX': {
    label: 'Español (México)',
    direction: 'ltr',
    browser: { language: 'es', regions: ['419', 'MX', 'US', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'] },
  },
} as const satisfies Record<string, LanguageDefinition>;

export type AppLanguage = keyof typeof LANGUAGES;
export const APP_LANGUAGES = Object.keys(LANGUAGES) as AppLanguage[];

/** Maps one BCP 47 browser language tag to a supported app language, or null when unsupported. */
export function mapBrowserLanguage(tag: string | undefined): AppLanguage | null {
  const [language, ...allSubtags] = (tag ?? '').trim().toLowerCase().split(/[-_]/);
  // Extensions (`-u-ca-gregory`) start at a single-character subtag and never carry the region.
  const extensionStart = allSubtags.findIndex((subtag) => subtag.length === 1);
  const subtags = extensionStart === -1 ? allSubtags : allSubtags.slice(0, extensionStart);
  const region = subtags.find((subtag) => /^([a-z]{2}|\d{3})$/.test(subtag))?.toUpperCase();
  const candidates = (Object.entries(LANGUAGES) as [AppLanguage, LanguageDefinition][]).filter(([, definition]) => definition.browser.language === language);
  const regional = region ? candidates.find(([, definition]) => definition.browser.regions?.includes(region)) : undefined;
  return (regional ?? candidates.find(([, definition]) => definition.browser.fallback))?.[0] ?? null;
}
