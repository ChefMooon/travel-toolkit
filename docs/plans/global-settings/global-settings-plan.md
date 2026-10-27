---
title: "Global Travel Toolkit Settings Implementation Plan"
status: IMPLEMENTED
verification_status: AUTOMATED_CHECKS_PASSED_WITH_FULL_SUITE_LIMITATION
created: 2026-10-27
last_updated: 2026-10-27
---

# Global Settings

## Goal and scope

Provide a shared, responsive header settings menu for measurement units, clock format, preferred currency, and language metadata while retaining the existing theme control. Persist preferences in the existing site settings store. Defaults are metric, 12-hour, USD, and English. English is the only supported and selectable language in this implementation; the disabled English field communicates the current language without suggesting other locales exist.

Apply imperial presentation only to forecast display values: Celsius to Fahrenheit, millimetres/centimetres to inches, and km/h to mph. Keep fetched forecast values and all calculations metric. Apply the clock preference to digital and accessible timezone clock output and displayed forecast, currency, and trip rate retrieval timestamps. Preserve each timestamp's existing timezone/date semantics and include seconds where a timestamp includes a time. Analog clock hands remain unchanged.

Preferred currency supplies the target currency for a newly initialized trip and reset trip, and the base currency for a newly initialized converter with a distinct target currency and a region that supports the selected currency. Changing the global preference never changes an existing trip, converter selection, saved slot, imported/exported data, or user selection. Resetting converter inputs uses the preferred currency when supported in its selected region; otherwise it uses that region's default.

## Decisions

- Store settings together with theme and export/import preferences under `travel-toolkit-settings-data`; validate each new persisted field and fall back to defaults for missing or invalid legacy data.
- Keep the current persisted trip and converter stores authoritative. Global defaults are read only when creating a fresh trip/converter state.
- Install `i18next` and `react-i18next`, initialize an English resource catalog, and retain a single English-only runtime. Broader translation, localized formatting, selector choices, and RTL work remain in the separate internationalization plan.
- Put the theme selector first in the shared header settings menu. Use the shared select controls, keep them labeled and keyboard-operable, and constrain the menu to the viewport on small screens.

## Implementation record

- [x] Add validated persisted settings and defaults.
- [x] Add shared header menu and English-only i18next runtime.
- [x] Use preferred currency for fresh trip and initial converter defaults without changing hydrated selections.
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
- Full `npm run test -- --run`: 632 passed, 3 failed. Two failures were outdated expectations for the new persisted settings fields and 12-hour compact clock output; the expectations were updated and the affected test files passed afterward. The remaining shared-footer blog navigation test timed out at 5 seconds; it was not rerun in isolation.
- Follow-up: `npx vitest run src/integration.test.tsx` passed all 31 tests, including the previously timed-out footer navigation. Settings menu and navbar tests passed all 8 tests after adding Escape dismissal and focus return. The complete suite was not rerun after these changes.
- Final full `npm run test -- --run`: passed 638 tests across 66 files after the menu refinements.
- No live browser/responsive keyboard review was performed. Automated DOM checks do not establish visual layout or native app behavior.
