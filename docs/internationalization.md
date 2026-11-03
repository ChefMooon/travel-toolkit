# Interface language and translations

## Current language status

English is the default interface language. Supported translated locales are French (Canada) (`fr-CA`), French (France) (`fr-FR`), Spanish (Spain) (`es-ES`), and Spanish (Mexico) (`es-MX`). The French (Canada) translation has been reviewed for terminology, grammar, plurals, consent, and destructive-action wording. Users can also select any language explicitly in Settings.

On a first visit with no saved language, the application picks the first browser language (`navigator.languages`) that maps to a supported locale (`mapBrowserLanguage` in `src/store/settingsStore.ts`): `en` and `en-*` select English; `fr-CA` selects French (Canada) and any other `fr` tag selects French (France); Latin American Spanish tags (`es-MX`, `es-419`, `es-US`, `es-AR` and similar) select Spanish (Mexico) and any other `es` tag selects Spanish (Spain). Unsupported languages are skipped, and English is used if nothing matches. After that, the selected language is validated and saved in the existing site settings store. English resources are bundled as the fallback; the French resource module is loaded only after the user selects French. If loading fails, the application returns to English and updates the saved preference and document metadata together.

## Editing messages

- English source messages live in `src/i18n.ts`; the translated catalogs live in `src/i18n/locales/` (`fr-CA`, `fr-FR`, `es-ES`, `es-MX`). See “Adding a language” for the registration steps.
- Use semantic keys and complete sentences. Keep interpolation values as `{{name}}`; use i18next plural suffixes such as `_one` and `_other` with a `count` value.
- Add each message to both catalogs. Keep wording and placeholders aligned. Run `npm run i18n:check` to verify catalog key and interpolation parity; `npm run i18n:check -- --self-test` also verifies that the checker catches an isolated missing-key fixture. Rich text should remain React content; do not build HTML strings.
- Use `useTranslation()` in React components so language changes update visible text. Do not cache translated strings at module scope.
- Format numbers, dates, currencies, and relative time with `src/i18n/format.ts`. Keep numeric input behavior and stored date-only values unchanged.
- Geocoding maps `fr-CA` to Open-Meteo's `fr` language parameter and includes that value in the query key; climate measurements remain language-independent. Open-Meteo documents translated names/country/admin values for available languages in its [Geocoding API](https://open-meteo.com/en/docs/geocoding-api).
- Do not translate user-entered names, provider/article content, currency codes, IANA timezone IDs, route paths, trip/category identifiers, or spreadsheet sheet names and headers.
- Blog article titles, summaries, and bodies remain in their source language. Their content container declares `lang="en"`; localized chrome identifies English-only article content while French is active.

## Adding a language

`src/i18n/languages.ts` is the single registry of interface languages. It drives the saved-language validation, the Settings selector label, document direction, i18next `supportedLngs`, and browser-language detection (`mapBrowserLanguage`). To add a language:

1. Add an entry to `LANGUAGES` in `src/i18n/languages.ts` with its `label` (written in that language), `direction`, and `browser` detection rule. Use `regions` to claim specific region subtags and `fallback: true` on the entry that should receive the language's other tags, including a bare `fr` or `es`. An entry without either never matches a browser.
2. Create `src/i18n/locales/<code>.ts` with a full catalog ending in `export default <catalog>;`. Every key and `{{placeholder}}` in the English catalog must be present. The catalog check discovers the file from the registry; it fails if a registered language has no catalog file or a catalog file is not registered.
3. Add the lazy `import()` to `localeLoaders` in `src/i18n.ts`. TypeScript reports an error until every non-English registry entry has a loader.
4. Run `npm run i18n:check`, then add tests: wording checks in `src/i18n.test.ts` and detection cases in `src/store/settingsStore.test.ts`. The "activates every registered language" test exercises the new locale automatically.
5. Check currency/number/date/relative-time output, the geocoding language (the primary subtag is sent to Open-Meteo), source-language content boundaries, imports/exports, and responsive UI.
6. Obtain an owner decision on locale/region and a named reviewer before listing a language as supported. Label an unreviewed language as a preview in its `label` and a visible notice until it is approved.

## Direction and deferred RTL work

The current interface locales use `dir="ltr"`. Locale metadata and document synchronization provide a future direction integration point; this does not constitute RTL support. Before adding an RTL locale, audit logical CSS and test:

- portalled Select, DatePicker, tooltip, and custom picker anchoring (`src/components/Select`, `src/components/DatePicker`, `src/components/Tooltip`, trip cost pickers);
- trip ledger/table column order, numeric alignment, row editing, drag and keyboard behavior (`src/components/CostRow`, trip layout styles);
- timezone and forecast charts/clocks, directional icons, and theme-control indicator movement;
- popover placement, focus order, mixed-script names/codes, and fonts across narrow and wide viewports.

Full RTL behavior, translated routes, multilingual SEO, and translated spreadsheet schemas remain out of scope.
