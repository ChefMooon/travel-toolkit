---
title: "Global Travel Toolkit Settings Implementation Plan"
status: IMPLEMENTED
verification_status: AUTOMATED_CHECKS_PASSED_WITH_FULL_SUITE_LIMITATION
created: 2026-10-27
last_updated: 2026-10-27
---

# Global Settings

## Goal and scope

Provide a shared, responsive header settings menu for measurement units, clock format, preferred currency, optional preferred region, and language metadata while retaining the existing theme control. Persist preferences in the existing site settings store. Defaults are metric, 12-hour, USD, no preferred region, and English. English is the only supported and selectable language in this implementation; the disabled English field communicates the current language without suggesting other locales exist.

Apply imperial presentation only to forecast display values: Celsius to Fahrenheit, millimetres/centimetres to inches, and km/h to mph. Keep fetched forecast values and all calculations metric. Apply the clock preference to digital and accessible timezone clock output and displayed forecast, currency, and trip rate retrieval timestamps. Preserve each timestamp's existing timezone/date semantics and include seconds where a timestamp includes a time. Analog clock hands remain unchanged.

Preferred region and currency supply defaults for a newly initialized or reset trip. When a preferred region is selected, use the preferred currency if the region supports it, otherwise use the region's existing default currency. With no preferred region, derive the trip region from the preferred currency using the current currency-to-region lookup and use that currency. The ledger's default entry currency derives from the trip region for each new, reset, or loaded trip and when the region changes. Users can override it locally. Changing global preferences never changes an active trip, existing costs, saved slot, or imported/exported data. The ledger override is not persisted.

## Decisions

- Store settings together with theme and export/import preferences under `travel-toolkit-settings-data`; validate each new persisted field and fall back to defaults for missing or invalid legacy data.
- Represent no preferred region as `null` and expose it as “No preferred region”; region and currency defaults affect new/reset trip identities only.
- Keep the current persisted trip and converter stores authoritative. Global defaults are read only when creating a fresh trip/converter state.
- Install `i18next` and `react-i18next`, initialize an English resource catalog, and retain a single English-only runtime. Broader translation, localized formatting, selector choices, and RTL work remain in the separate internationalization plan.
- Put the theme selector first in the shared header settings menu. Use the shared select controls, keep them labeled and keyboard-operable, and constrain the menu to the viewport on small screens.

## Implementation record

- [x] Add validated persisted settings and defaults.
- [x] Add shared header menu and English-only i18next runtime.
- [x] Use preferred region and currency for fresh/reset trips, retain preferred currency for initial converter defaults, and initialize ledger entry currency from the trip region.
- [x] Apply clock format to digital/accessible timezone clocks and displayed time timestamps.
- [x] Convert every forecast temperature, precipitation, snowfall, and wind value at render time.
- [x] Add focused store, settings UI, climate conversion, and clock-format tests.
- [x] Complete focused tests, application suite, typecheck, production build, and diff check; record actual results below.
- [ ] Perform manual responsive/keyboard browser review if a live browser is available.

## Verification results

- `npm run test -- --run` focused settings, forecast, timezone, trip, currency and summary set: passed (94 tests); a subsequent focused regression set covering new currency reset behavior and updated clock/theme expectations passed (81 tests).
- `npm run typecheck`: passed.
- `npm run build`: passed. Vite reported the existing large-chunk warning for a 512.98 kB main bundle.
- `git diff --check`: passed.
- [x] Extend persistence, region-selector, trip default/fallback, identity reset, and ledger default/override tests; run focused tests and typecheck.
- Full `npm run test -- --run`: 632 passed, 3 failed. Two failures were outdated expectations for the new persisted settings fields and 12-hour compact clock output; the expectations were updated and the affected test files passed afterward. The remaining shared-footer blog navigation test timed out at 5 seconds; it was not rerun in isolation.
- Follow-up: `npx vitest run src/integration.test.tsx` passed all 31 tests, including the previously timed-out footer navigation. Settings menu and navbar tests passed all 8 tests after adding Escape dismissal and focus return. The complete suite was not rerun after these changes.
- Final full `npm run test -- --run`: passed 638 tests across 66 files after the menu refinements.
- Region-preference follow-up: `npm run typecheck` and `git diff --check` passed. The full suite passed 641 tests and failed one outdated settings-persistence expectation; after updating that expectation, the affected and related files passed 84 tests. The full suite was not rerun after that test-only correction, and the production build was not rerun.
- Ledger correction: all 16 focused ledger tests passed after changing its default to follow the trip region.
- No live browser/responsive keyboard review was performed. Automated DOM checks do not establish visual layout or native app behavior.
