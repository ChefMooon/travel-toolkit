# Interface language and translations

## Current language status

English is the default interface language. French (Canada) is available only as an explicit review preview in Settings. It is a draft translation; it is not an approved or advertised supported language. The preview displays a review notice. The owner must review terminology, grammar, plurals, consent, destructive actions, and narrow layouts before the product can claim French support.

The application does not infer a language from browser settings. The selected language is validated and saved in the existing site settings store. English resources are bundled as the fallback; the French resource module is loaded only after the user selects the preview. If loading fails, the application returns to English and updates the saved preference and document metadata together.

## Editing messages

- English source messages live in `src/i18n.ts`; the French review draft lives in `src/i18n/locales/fr-CA.ts`.
- Use semantic keys and complete sentences. Keep interpolation values as `{{name}}`; use i18next plural suffixes such as `_one` and `_other` with a `count` value.
- Add each message to both catalogs. Keep wording and placeholders aligned. Run `npm run i18n:check` to verify catalog key and interpolation parity; `npm run i18n:check -- --self-test` also verifies that the checker catches an isolated missing-key fixture. Rich text should remain React content; do not build HTML strings.
- Use `useTranslation()` in React components so language changes update visible text. Do not cache translated strings at module scope.
- Format numbers, dates, currencies, and relative time with `src/i18n/format.ts`. Keep numeric input behavior and stored date-only values unchanged.
- Geocoding maps `fr-CA` to Open-Meteo's `fr` language parameter and includes that value in the query key; climate measurements remain language-independent. Open-Meteo documents translated names/country/admin values for available languages in its [Geocoding API](https://open-meteo.com/en/docs/geocoding-api).
- Do not translate user-entered names, provider/article content, currency codes, IANA timezone IDs, route paths, trip/category identifiers, or spreadsheet sheet names and headers.
- Blog article titles, summaries, and bodies remain in their source language. Their content container declares `lang="en"`; localized chrome identifies English-only article content while the French review preview is active.

## Adding a language

1. Obtain an owner decision on locale/region and a named language reviewer.
2. Add the locale to the validated settings type and explicit selector only after choosing its release status. Do not use browser auto-detection for an unreviewed language.
3. Add a separate lazily imported resource module and map it explicitly in `src/i18n.ts`. Keep English fallback available.
4. Translate every application-owned interface message and preserve interpolation, plural, and rich-text boundaries. Run the catalog parity check and focused locale tests.
5. Check currency/number/date/relative-time output, geocoding language mapping and query identity, source-language content boundaries, imports/exports, and responsive UI.
6. Remove preview wording and advertise a supported locale only after the designated reviewer approves the translation and release evidence is recorded in the implementation plan.

## Direction and deferred RTL work

The current interface locales use `dir="ltr"`. Locale metadata and document synchronization provide a future direction integration point; this does not constitute RTL support. Before adding an RTL locale, audit logical CSS and test:

- portalled Select, DatePicker, tooltip, and custom picker anchoring (`src/components/Select`, `src/components/DatePicker`, `src/components/Tooltip`, trip cost pickers);
- trip ledger/table column order, numeric alignment, row editing, drag and keyboard behavior (`src/components/CostRow`, trip layout styles);
- timezone and forecast charts/clocks, directional icons, and theme-control indicator movement;
- popover placement, focus order, mixed-script names/codes, and fonts across narrow and wide viewports.

Full RTL behavior, translated routes, multilingual SEO, and translated spreadsheet schemas remain out of scope.
