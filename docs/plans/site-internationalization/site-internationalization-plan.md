---
title: "Site Internationalization with i18next - Implementation Plan"
plan_profile: FULL
status: IN_PROGRESS
verification_status: PARTIAL
current_phase: 4 / 4
created: 2026-10-26
last_updated: 2026-10-27
---

# Overall Plan Completion Status

- **Total Phases Completed:** 0 / 4
- **Summary of Outcome:** The application now has a persisted English/French (Canada) language preference, explicit lazy-loaded French review preview, translated interface catalogs, locale-aware formatting, translated geocoding labels, a catalog parity check, and documented RTL boundaries. French is not advertised as a supported language: owner translation review and full browser-matrix evidence remain pending. Automated tests, typecheck, production build, catalog self-test, and diff checks are recorded in the implementation update below. Phase completion remains 0/4 until each phase's mandatory evidence is closed.

# Specification & Overview

### 1. Scope & Objective

**Goal:** Make Travel Toolkit's interface translatable using i18next and react-i18next, with consistent locale-aware formatting and foundations that reduce the cost of future RTL support.

**In scope:**

- English source catalogs grouped by shared UI and tool; typed message keys, interpolation, plurals, English fallback, and on-demand loading of additional languages.
- A persistent, accessible site language selector; document language synchronization; supported-language resolution.
- Shared navigation, launcher, trip workflow, currency, timezone, forecast, blog interface chrome, dialogs, settings, notifications, validation messages, tooltips, and accessible names.
- Locale-aware display formatting, localized application-owned category labels, and a defined boundary for third-party and user-authored content.
- Direction metadata, logical CSS in affected interfaces, mixed-direction text isolation, and a documented future RTL audit.
- One owner-selected additional LTR language for the first translated release, subject to translation review. Test-only pseudo-localization may be used before that selection.

**Out of scope:**

- Implementing anything during this planning task; changing other ongoing work; creating a worktree.
- Shipping or claiming full RTL support, advertising RTL languages in the production selector, or comprehensively mirroring navigation, charts, tables, icons, drag interactions, and popover positioning.
- Translating user-entered trip/group/cost names, saved labels, external event descriptions, provider names, or blog article bodies automatically.
- Multilingual route prefixes, translated slugs, hreflang, multilingual SEO, SSR/prerendering changes, a translation service subscription, or an automatic translation API.
- Localizing the spreadsheet interchange schema, changing persisted domain identifiers, changing calculation/rounding rules, or selecting currencies, units, timezones, or a new clock mode based on language.

### 2. Technical Constraints & Architecture

#### Repository evidence and implementation seams

Paths below are repository-relative and were inspected on 2026-10-26. They are discovery evidence, not a guarantee about the future checkout.

| Evidence | Implication |
| --- | --- |
| `package.json`: React 19, Vite, TanStack Router/Query, Zustand, Luxon, Vitest; no i18n dependency | Integrate with the existing client application; select compatible package versions when implementing. |
| `src/main.tsx`, `src/routes/__root.tsx` | Initialize before first application render; synchronize document language and localized route titles in the shared shell. |
| `src/store/settingsStore.ts`: persisted settings with validation and explicit `partialize`/`merge` | Extend the site's settings safely; do not store UI language in trip snapshots. |
| `src/components/Navbar/Navbar.tsx`, `src/components/Topbar/Topbar.tsx`, `src/features/timezone/TimezoneNavbar.tsx` | Inspect actual shell visibility before choosing selector placement; keep access consistent without duplicating state. |
| `src/lib/tools.ts`, `src/lib/routeTitles.ts`, `src/store/types.ts` | Separate display labels from stable route, category, and data identifiers; avoid module-scope translated strings that become stale. |
| Currency/forecast tools and `CostSummary.tsx` use explicit `en-US`; `timezoneFormat.ts` uses Luxon format strings; `SaveDataPanel.tsx` uses browser-default relative formatting | Consolidate display formatting around the resolved language; preserve date-only semantics and explicit clock preferences. |
| `src/features/forecast/forecastData.ts`: geocoding request has `language=en`; `useForecast.ts`: geocode query key omits language | Localized geocoding must include the effective API language in the request and query key; raw climate measurements remain language-independent. |
| `src/lib/blogPosts.ts`, `src/content/blog/*.md` | Translate blog navigation/chrome separately from article content; preserve English article language metadata. |
| `src/lib/xlsx/constants.ts`, `threeSheetParser.ts`, `singleSheetParser.ts` | Import/export uses stable English labels and sheet names; translating these would break the existing contract. |
| `src/index.css`, `CostRow.tsx`, `TimezoneSelect.tsx`, `Tooltip.tsx` | Physical side rules and viewport coordinates require deliberate RTL review; a global direction switch alone is insufficient. |
| `vitest.setup.ts`, colocated tests, `src/integration.test.tsx`, `src/responsive.test.tsx` | Use existing Vitest/Testing Library coverage and real browser layout checks. |

#### Proposed implementation shape

The following are proposed new boundaries, not existing files: `src/i18n/` for initialization, supported-language metadata, formatting, and type augmentation; `src/i18n/locales/<language>/` for resource catalogs; a reusable language selector under `src/components/`. Final filenames may follow current repository conventions.

- Use semantic keys and namespaces such as `common`, `trip`, `currency`, `timezone`, `forecast`, and `blog`. Keep English resources available locally as a reliable fallback. Load only the selected additional language through explicit Vite-compatible import mappings; no public translation server is required.
- Use i18next's plural/interpolation support and react-i18next's rich-text translation mechanism. Translate complete messages; do not concatenate sentence fragments or inject translated HTML. Preserve React's escaping guarantees.
- Derive TypeScript keys from English resources using a representation compatible with the installed versions. Verify compatibility with the repository's TypeScript version rather than assuming the newest typing mode works unchanged.
- Use one language coordinator as the runtime authority. Persist the preference in settings; avoid independent competing store/i18next state. Resolve an explicit supported preference first, then a supported browser language, then English. Normalize regional tags against an explicit supported mapping; malformed/unsupported values fall back safely. No geolocation-based selection or navigation redirect.
- Initialize language and required resources before rendering localized UI. Additional-language loading failure returns usable English UI with matching `lang`; never persist or display a language as active before successful activation. Avoid infinite retries and unhandled import errors.
- Synchronize `html.lang` with the active language. Keep production `html.dir=ltr` for the initial supported LTR locales. Store direction in the locale registry so a later RTL release has an explicit integration point. Do not ship an unvalidated RTL selector option.
- Use shared `Intl` helpers and explicit Luxon locale arguments. Keep raw amounts numeric and ISO dates/codes stable. Preserve user timezone and 12/24-hour selections. Locale-aware display must not silently introduce unsupported comma-decimal input: retain existing numeric input semantics and separately test input/display round trips.
- Localize application-owned errors before display; retain technical API diagnostics for logs and map failures to safe localized UI messages. A queued toast may remain in its creation language; newly generated notifications must use the active language.
- Use `Intl.DisplayNames` where suitable and supported for currency/region names, with existing metadata as fallback. Preserve ISO identifiers and search by code as well as localized name. Keep IANA timezone identifiers stable and distinguish identifiers from translated labels.
- For geocoding, verify provider language support at implementation time and map supported UI languages deliberately. Include effective provider language in cache keys. Changing language must preserve the selected destination ID/coordinates and not relabel an existing selection as a different place. Existing saved/provider content can remain in its original language.
- Prefer CSS logical properties for semantic start/end alignment. Retain physical coordinates when they represent actual viewport geometry, recording them for the deferred RTL positioning audit. Use appropriate `bdi`/`dir=auto` for user text and deliberate LTR isolation for identifiers where necessary; do not mirror all icons or numeric content globally.

#### Compatibility, risks, and sequencing

- Other work is active. At implementation start, inspect instructions, Git status, current tests, and the owning code again. In particular, reconcile ledger markup, inline editing, popovers, CSS, settings, and shell changes before relying on these paths. Do not revert concurrent edits or assume concurrent implementation is safe.
- Language changes must preserve unsaved trip edits, save-slot data, calculations, selected currency, units, destination, timezone configuration, theme, and consent preferences. Generated default labels already saved as user data remain unchanged.
- Longer translations can overflow dense ledger controls and narrow navigation. Catalog completeness alone is insufficient; actual browser layout checks are mandatory.
- Blog articles and external content may remain English. Mark the English article subtree with its language and disclose unavailable article translations in localized chrome; do not imply the entire article was translated.
- Translation quality, correct plurals, localized accessibility labels, and string maintenance create ongoing work. Add a contributor workflow and a missing-key/catalog parity check without snapshotting every literal.

#### Open decisions and release gates

- **Owner decision before Phase 4:** choose the first additional LTR language/region, translation reviewer, and intended release scope. No language is selected by this plan. English plus test-only expansion is sufficient for Phases 1–3, but does not count as a multilingual production release.
- **Implementation integration decision:** choose the selector's exact shared-shell placement after inspecting the current responsive navigation. Prefer a compact native select labeled in the current language, with language names shown in their own language; use no country flags as language identifiers.
- Multilingual SEO and full RTL are explicitly deferred. Any later decision to include either requires updating scope, criteria, and verification status before execution.

### 3. Roles & Delegation

| Role | Agent or session | Model | Responsibility |
| --- | --- | --- | --- |
| Planner | Current Codex chat | Not recorded | Repository assessment and this plan only. |
| Implementer | Not assigned | Not assigned | Execute later, reconcile checkout drift, and record phase evidence. |
| Validator | Not assigned | Not assigned | Check behavior, compatibility, and browser layouts against the ledgers. |

No implementation agents are assigned or launched by this plan. Phases are sequential; a later implementation workflow may assign roles.

### 4. Decisions & Change Log

| Decision | Source and date | Supersedes | Affected scope or acceptance criteria |
| --- | --- | --- | --- |
| Use i18next and react-i18next; prepare for RTL and defer full RTL support | User instruction, 2026-10-26 | Alternative library evaluation | All phases; no production RTL support claim. |
| Write and commit the plan only; implementation will happen later | User instruction, 2026-10-26 | None | No application/dependency changes in this task. |
| Keep existing URLs and spreadsheet contracts; translate interface first | Planning boundary based on accepted recommendation, 2026-10-26 | None | Routing, content, and compatibility scope; expand only through an explicit decision. |

# Execution Plan & Handoffs

## Phase 1: Language foundation and shared shell

- **Status:** IN_PROGRESS
- **Objective:** Establish a safe, typed translation runtime and a working language preference through the shared UI.
- **Dependencies:** Implementation must be explicitly started later and concurrent shell/settings changes reconciled first.
- **Exit Deliverable:** Initialized runtime, English common catalog, test-only second locale, language control, and test helpers ready for tool migration.

### Tasks

- [ ] Revalidate package versions, entry point, active shell composition, settings persistence, and working-tree ownership. Record material differences from this plan; do not modify unrelated work.
- [ ] Add compatible `i18next` and `react-i18next` packages and lockfile changes. Implement the proposed `src/i18n/` boundaries, explicit supported locale registry, English fallback, namespace loading, initialization, and typed keys.
- [ ] Add validated language preference persistence to `settingsStore.ts`, preserving existing settings and legacy hydration behavior. Implement detection/resolution without a second persistence mechanism.
- [ ] Add the accessible selector in the current shared shell and synchronize document language/direction and route titles. Migrate shared navigation, launcher/tool metadata, theme control, footer, consent, and shared dialog/control defaults to common messages.
- [ ] Add an isolated i18n test instance/helper with deterministic English defaults and cleanup between tests. Keep a pseudo/fixture locale available only to tests or development preview, excluded from the production selector/build resources where practical.

### Outcome & Evidence Ledger

| Outcome / acceptance criterion | Check | Verification method | Result / evidence |
| --- | --- | --- | --- |
| Supported explicit preference wins; browser language and English fallback resolve predictably | Mandatory | Vitest cases for valid, regional, missing, malformed, unsupported, unavailable-storage, and resource-load-failure inputs; reload/hydration assertions | PARTIAL — persisted locale validation and load-failure fallback tests pass; browser-language auto-detection is intentionally disabled; startup persistence/reload needs browser evidence. |
| Language activation and accessible shared UI stay synchronized | Mandatory | Component/integration assertions for selection, persisted preference, `html.lang`/`dir`, route-title update, keyboard access, and preserved settings | PARTIAL — selector, explicit selection, persistence, document metadata, route-title code and activation race are tested; keyboard and reload browser matrix pending. |
| Typed keys, namespace fallback, interpolation/plurals, and deterministic test state work | Mandatory | Type checking via `npm run typecheck`; focused Vitest tests using isolated instances and consecutive languages | PASS — `npm run typecheck`; `src/i18n.test.ts` covers isolated instances, interpolated plural message, fallback and last-request-wins. |

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900 CSS pixels.
- **Interactions/states:** Selector by keyboard, shared navigation open/closed, English and expanded fixture labels, light/dark themes, loading failure.
- **Requested measurements:** No new horizontal page overflow, clipped selector labels, inaccessible focus targets, or overlap with existing navigation actions.
- **Preview limitations/fallbacks:** jsdom cannot establish geometry. Use a local browser preview during implementation; if unavailable, leave geometry evidence pending and name the validation owner.

### Phase Record

- **Artifacts created/modified:** Shared runtime in `src/i18n.ts`, typed catalogs, persisted settings, startup activation, selector/notice, route-title synchronization, and focused tests.
- **Decisions/deviations:** The selector lives in the shared Settings menu. French is explicit preview only; browser language is not auto-detected. Automated activation, fallback, persistence, and metadata tests pass. Responsive browser checks remain open.
- **Next-phase context:** Tool migrations and locale formatting are implemented; preserve all domain values and complete manual UI evidence before phase closure.

## Phase 2: Tool messages, formatting, and content boundaries

- **Status:** IN_PROGRESS
- **Objective:** Make every tool's application-owned interface language-aware without changing stored data or calculations.
- **Dependencies:** Phase 1 runtime and test support.
- **Exit Deliverable:** Complete English interface catalogs and locale-aware formatting across tools, with stable import/export behavior.

### Tasks

- [ ] Migrate trip components, save slots, import/export settings, dialogs, toasts, validation, accessible names, and category display labels. Keep canonical IDs, persisted names/default labels, spreadsheet names/headers/metadata, and parser matching stable.
- [ ] Migrate currency, timezone, and forecast messages, including loading/error/empty states, counts and plurals, titles, search placeholders, units labels, and accessible summaries. Keep dates/units/currency/clock preferences semantically unchanged.
- [ ] Add shared date/number/currency/percent/relative-time helpers; replace display-level `en-US`, browser-default formatting, and fixed currency concatenation where appropriate. Pass locale explicitly into Luxon clock formatting, preserving date-only and timezone semantics. Audit numeric input separately from display.
- [ ] Localize derived metadata at render/use time, not once at module initialization. Refresh locale-dependent timezone/currency search labels and caches when necessary while keeping codes and IDs stable.
- [ ] Update geocoding language mapping/request/cache identity after checking provider support. Test stale responses and language switches without changing the selected destination or refetching language-independent measurements unnecessarily.
- [ ] Translate blog listing/article chrome, date display and application-owned tag labels where mapped. Keep article content/title/summary in its source language, mark the content language, and provide a clear localized fallback notice. Do not duplicate posts or change slug parsing.
- [ ] Audit remaining production English strings and classify each as translated UI, stable interchange/identifier, external/source content, developer diagnostic, or persisted user data. Resolve accidental gaps.

### Outcome & Evidence Ledger

| Outcome / acceptance criterion | Check | Verification method | Result / evidence |
| --- | --- | --- | --- |
| Tools use complete messages, plural rules and localized accessible names | Mandatory | Focused component tests for each tool in English and a second fixture; catalog parity/interpolation checks; documented remaining-string audit | PARTIAL — catalogs have 594-key parity, numeric stepper accessible names are locale-aware, and the full suite passes; complete French browser walk/remaining-string audit pending. |
| Display formats follow locale without changing math, date meaning, or input values | Mandatory | Formatter tests covering decimal/group separators, currencies, percentages, date-only boundaries, relative times, explicit timezone and 12/24-hour modes; calculation regression suite | PASS — `src/i18n/format.test.ts` covers localized number/currency/relative/date output, UTC date-only boundaries, explicit timezone and 12/24-hour options; countdown/calculation regression tests pass. |
| Language switch preserves unsaved edits and persisted domain data | Mandatory | Integration test changes language with an edited trip, active currency/forecast/timezone settings and saved slots; compare domain snapshots before/after | PASS — `src/i18n.test.ts` compares edited trip/date/cost snapshot, global preference values and saved slot before/after explicit French activation. |
| Spreadsheets remain round-trip compatible across languages | Mandatory | Existing `src/lib/xlsx/__tests__` import/export tests plus round-trip test under a non-English locale with unchanged sheet names/metadata | PASS — `src/lib/xlsx/__tests__/importWorkbook.test.ts` builds and parses both schemas under French, asserting stable sheet/header names and unchanged trip/date/cost data. |
| Localized data requests/cache results cannot leak across locales | Mandatory | Geocoding request/query tests for effective-language keys, supported fallback, switch during request and stable selected location | PASS — `src/features/forecast/useForecast.test.tsx` switches from English to French, verifies separate provider language requests and cache keys, and confirms the provider ID remains stable. |
| Untranslated articles and external content are represented honestly | Mandatory | Blog tests assert source `lang`, localized chrome/fallback notice, unchanged slugs/content; external-content audit | PARTIAL — English content `lang`, localized date/chrome/source notice are implemented; French browser verification pending. |

### Scope & Diff Guardrails

- Do not translate parser tokens, enum values, currency/IANA codes, stable event/category IDs, or user-authored text. Do not add translated routes or article variants.

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900; dense ledger both inline-editing and read states.
- **Interactions/states:** All tools, save/import/export panels, empty/loading/error states, long names, multi-digit amounts, expanded fixture labels and plural counts.
- **Requested measurements:** No clipped critical text, lost actions or horizontal page overflow; preserve ledger alignment and readable numeric fields.
- **Preview limitations/fallbacks:** Browser checks required for layout; fixture locale checks expansion only and cannot establish real translation quality.

### Phase Record

- **Artifacts created/modified:** Shared English/French review-preview catalogs, locale formatters, translated application UI, localized geocoding query identity, source-language blog notice, and focused regression tests.
- **Decisions/deviations:** User/provider values, routes, IDs, date-only inputs, spreadsheet schemas, and English blog content remain unchanged. Automated suite passes; a dedicated full French interaction/browser matrix and cross-locale spreadsheet round trip remain open.
- **Next-phase context:** RTL preparation is scoped to logical properties, text isolation, and a deferred audit; full RTL remains out of scope.

## Phase 3: RTL preparation and layout resilience

- **Status:** IN_PROGRESS
- **Objective:** Reduce future RTL retrofit work while keeping production support limited to validated LTR languages.
- **Dependencies:** Phase 2 translated interfaces and formatting boundaries.
- **Exit Deliverable:** Logical layout improvements, bidirectional content safeguards, and a concrete deferred RTL audit.

### Tasks

- [ ] Convert semantic left/right spacing, borders, anchoring and text alignment in affected shared/tool CSS to logical start/end equivalents when behavior is equivalent. Review physical viewport coordinates individually; avoid mechanical replacement or broad global mirroring.
- [ ] Isolate user/provider text and fixed-direction codes/amounts where mixed-script content is ambiguous; test Arabic/Hebrew sample names inside the LTR UI without advertising an RTL locale.
- [ ] Verify direction metadata can support a future RTL locale through a test-only fixture; retain LTR production behavior and no production RTL language option.
- [ ] Document remaining RTL-specific work in the feature documentation: custom portaled popovers/tooltips, ledger/table order and numeric alignment, keyboard/drag semantics, moving theme indicators, directional icons, charts/clock orientation, fonts and native-language review. Record actual owners/paths discovered during implementation.
- [ ] Exercise expanded labels and responsive layouts after logical CSS changes. Preserve existing geometry and behavior for English.

### Outcome & Evidence Ledger

| Outcome / acceptance criterion | Check | Verification method | Result / evidence |
| --- | --- | --- | --- |
| Logical CSS preserves current LTR layout and leaves intentional geometry explicit | Mandatory | Diff review of changed directional rules and browser comparison across specified viewports; record retained physical positioning in the deferred audit | PARTIAL — scoped logical CSS diff reviewed and `git diff --check` passes; viewport comparison unavailable in this subagent session. |
| Mixed-script names and codes remain readable with correct accessible text | Mandatory | Component assertions for isolation markup plus browser checks using Arabic/Hebrew names alongside currency amounts and timezone IDs | PARTIAL — `bdi` isolation is present; Arabic/Hebrew visual interaction check pending. |
| Future direction integration exists without shipping RTL support | Mandatory | Locale-registry/document synchronization test using a test-only RTL fixture; production selector/resource audit excludes unsupported RTL entries | PASS — direction fixture test passes; supported locale registry contains English and LTR French preview only. |
| Full RTL gaps are actionable and support boundaries explicit | Mandatory | Review deferred RTL audit against actual CSS, popover, ledger, drag, icon and font code; no claim of RTL completion | PARTIAL — deferred work is documented in `docs/internationalization.md`; browser audit remains pending. |

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900, English plus expanded fixture text.
- **Interactions/states:** Navigation, ledger editing/popovers, timezone search, mixed-script user names, dialogs, and theme selector.
- **Requested measurements:** No LTR geometry regressions, overlap or overflow; mixed-direction punctuation and codes remain readable. A forced RTL smoke view is diagnostic only.
- **Preview limitations/fallbacks:** Forced RTL cannot establish full RTL support. Record failures as deferred items rather than expanding implementation into a full RTL release.

### Phase Record

- **Artifacts created/modified:** Scoped logical CSS, mixed-direction isolation, locale direction synchronization fixture, and deferred RTL audit in `docs/internationalization.md`.
- **Decisions/deviations:** Full RTL remains deferred. Direction fixture and catalog/production-locale checks pass; visual mixed-script/browser evidence remains pending.
- **Next-phase context:** Use the completed coverage and layout evidence to validate the owner-selected real language.

## Phase 4: First translated language and release handoff

- **Status:** IN_PROGRESS
- **Objective:** Release a reviewed additional LTR language and establish maintainable translation checks/documentation.
- **Dependencies:** Phases 1–3; owner choice of language/region and translation reviewer. If unresolved, this phase remains NOT_STARTED and production remains English-only.

### Tasks

- [ ] Record the selected language, regional fallback mapping and reviewer. Populate all required catalogs, retaining placeholders, rich-text boundaries, plurals and terminology; drafts may use machine assistance but must be reviewed before being presented as supported.
- [ ] Add repeatable catalog completeness/placeholder validation using current repository tooling and document the command. Keep fallback runtime tests while requiring complete catalogs for an advertised release language.
- [ ] Update relevant architecture/contributor documentation with key conventions, namespace loading, adding a language, test helpers, formatting rules, content fallback, spreadsheet stability and deferred RTL/SEO boundaries.
- [ ] Run `npm run test -- --run`, `npm run typecheck`, `npm run build`, and `git diff --check`; inspect actual build output for unintended inclusion of all locales or test fixtures. Record failures and existing unrelated issues honestly.
- [ ] Complete the browser matrix, including reload persistence, language switch during editing, all tools, source-language articles and error states. Record evidence in the ledgers and update lifecycle/verification fields according to actual results.

### Outcome & Evidence Ledger

| Outcome / acceptance criterion | Check | Verification method | Result / evidence |
| --- | --- | --- | --- |
| Advertised second language has complete, reviewed translations | Mandatory | Catalog validation command recorded during implementation; **Manual Validation:** owner/designated language reviewer attests terminology, grammar, plurals, destructive dialogs and consent messages | PENDING — French review preview remains unapproved; user review gate is open. |
| App remains functional and production build excludes test locales | Mandatory | `npm run test -- --run`; `npm run typecheck`; `npm run build`; `git diff --check`; inspect Vite output and resource imports | PARTIAL — constrained run passes 77 files / 695 tests, typecheck, build and diff check pass; French is lazy loaded. The unconstrained run had two intermittent failures; see implementation update. |
| Real-language responsive interactions and persistence work | Mandatory | Implementer browser evidence for matrix below, including reload and switching during unsaved edits; no console errors, clipped required actions, or unexpected state changes | PARTIAL — local browser smoke: selected French in Settings, inspected home, trip, units and countdown, and confirmed French persisted after reload on trip. Full viewport and interaction matrix remains pending. |
| Contributors can add/maintain translations without changing domain formats | Mandatory | Documentation review and execute documented catalog check against a deliberately missing key in an isolated test fixture, without committing the defect | PASS — `docs/internationalization.md`; `npm run i18n:check -- --self-test` detects the deliberate missing-key fixture and reports parity for 594 keys. |

### Scope & Diff Guardrails

- No multilingual routes, translated spreadsheet schema, or production RTL locale. Do not mark this plan COMPLETED or verification PASSED based solely on pseudo-localization or English tests.

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900; English and selected language; light/dark themes.
- **Interactions/states:** Every route; keyboard selector and focus; menus/dialogs/tooltips; error/loading/empty states; trip editing, saving/import/export, currencies, timezone clocks/search, forecasts, and English blog fallback.
- **Requested measurements:** No new horizontal page overflow, overlapping controls, clipped critical labels or unreadable values. Confirm stable ledger alignment and reachable actions at narrow widths; record viewport/screenshots or equivalent browser evidence.
- **Preview limitations/fallbacks:** If browser access or a real-language reviewer is unavailable, retain pending mandatory evidence and report the limitation; do not infer a pass from jsdom, builds, or machine-generated translations.

### Phase Record

- **Artifacts created/modified:** `src/i18n/locales/fr-CA.ts`, `scripts/check-i18n-catalogs.mjs`, `docs/internationalization.md`, and the shared settings/runtime/UI/tool changes listed in the implementation update below.
- **Decisions/deviations:** French (Canada) is an explicit review preview with an on-screen notice. Browser language is not used for auto-detection. The user is the translation reviewer; approval is pending. Phase 4 is not complete, and French must not be described as supported until the user review and remaining browser evidence are recorded.

## Implementation Update — 2026-10-27

- **Language behavior:** English remains the default. `fr-CA` is explicitly selectable as “Français (Canada) — aperçu”, lazy loaded, validated in settings persistence, and recoverably falls back to English. Startup awaits the saved language before rendering. Activation is last-request-wins. `html.lang`, `html.dir`, route titles, and visible labels follow the active language.
- **Coverage:** Shared shell, settings, trip workflow/save and toast UI, currency, timezone, forecast, units, countdown, DatePicker, blog chrome, date validation messages, import/export settings, mobile trip tabs, and RegionSelector labels use the catalogs. Domain IDs, names entered by users, number/date inputs, spreadsheet schema, route paths, currency codes, and IANA IDs remain stable. Blog article body/title/summary remain English and are identified as source-language content in preview mode.
- **RTL preparation:** Current locales remain LTR. Mixed-direction values use isolation where needed; scoped logical CSS and a test-only direction synchronization fixture are present. No RTL locale or production RTL claim was added. The browser-based mixed-script/layout inspection remains pending.
- **Automated evidence:** `npm run test -- --run --maxWorkers=3` — PASS, 77 files / 695 tests. The unconstrained parallel run had two load-sensitive failures (empty transient route shell and the existing 5-second large-timezone-list timeout); both affected files pass alone and in the constrained full run. `npm run typecheck` — PASS. `npm run build` — PASS; Vite emitted the French catalog as a separate lazy chunk (`fr-CA-*.js`). `npm run i18n:check -- --self-test` — PASS, 594 message keys and the deliberate missing-key fixture was detected. `git diff --check` — PASS. The build retains the >500 kB main-chunk advisory.
- **Additional accessibility coverage:** Shared `NumericInput` now translates increment/decrement button names and step-help tooltip; `src/components/NumericInput/NumericInput.test.tsx` verifies French accessible names while preserving numeric input behavior.
- **Focused regression corrections:** Preserved original English CoupleCard tooltip/accessibility wording, target currency symbol, privacy button casing, and “Page Not Found” document title. Blog date tests now verify locale-formatted visible copy while retaining the original `datetime` value. A region-selection guard handles an absent current selection safely. An active invalid date draft re-renders in French after language selection without changing stored trip dates.
- **Browser smoke:** In the local in-app browser, selected French in Settings, observed the preview notice and translated home/trip/units/countdown controls, confirmed a French-formatted conversion result and French persistence after a trip-page reload. A stepper accessibility-label gap found during this check was fixed and covered by a focused test. This is not the full responsive matrix.
- **Still pending:** Owner French translation review; browser matrix at 375×812, 768×1024, and 1440×900; visual checks for switching during edits, all responsive interactions and mixed-script content. Do not close any phase or mark verification PASSED until these mandatory manual items have evidence.

## Responsive Browser Follow-up — 2026-10-28

- **Conditional tooltip completion:** In an isolated production-preview copy, seeded a disposable trip containing an unassigned individual cost, an unassigned subset cost, and a shared CAD cost without an exchange rate; Frankfurter responses were deterministically failed. In English and French, light and dark themes, and 375×812, 768×1024, and 1440×900 viewports, all 36 keyboard-triggered tooltip checks showed the expected localized individual/subset validation or add-rate message, fit within the viewport, and closed on Escape. The earlier conditional-tooltip gap is closed. The French language review and any other plan acceptance criteria remain separate from this browser evidence.

- **Tooltip inventory pass:** In a production preview on an isolated origin, measured keyboard-triggered tooltip bounds in English and French, light and dark themes, at 375×812, 768×1024, and 1440×900. Covered shared navigation and theme controls; trip dates, group and child controls, ledger name/markup/split/type/actions and exchange-rate edit; currency reset/swap and numeric-stepper help; timezone detect/manage and tracked-zone reorder; editor numeric help, selected type, assigned groups and discard; undo/redo; and every one of the ten icon and ten color choice tooltips. Measured boxes stayed within the viewport. The current pass did not synthesize invalid stored cost assignments or a missing exchange-rate state, so their conditional tooltip variants remain unverified; it does not constitute French translation approval.

- **Save and bulk follow-up:** In an isolated preview, tested save-slot overwrite, clear, swap, load-with-unsaved-changes, and import-with-unsaved-changes confirmations in English/French, light/dark, at 375×812, 768×1024, and 1440×900. Each fit the viewport, focused Cancel, closed on Escape, and restored focus to its opening action. Import used a disposable local fixture and was cancelled before parsing. A two-item bulk-delete confirmation and the keyboard-triggered cost-edit tooltip were checked in the same 12 combinations. No document-level horizontal overflow was detected in these states.
- **Corrections from this follow-up:** Responsive ledger cards hid the selection checkbox at container widths of 1,000 px and below, making bulk operations inaccessible. The checkbox remains visible beside the cost name in the card layout. Shared confirmation dialogs now return focus to the opener on dismissal, including nested save-slot confirmations.

- **Additional provider and interaction checks:** An isolated Vite preview injected deterministic HTTP 503 responses for Frankfurter, geocoding, and climate requests (with a fixed geocoding result for the climate case). Currency-rate, destination-search, and climate-error messages were rendered and measured in English and French, light and dark themes, at all three specified sizes; no document-level horizontal overflow appeared. The climate Retry action is below the initial mobile viewport, but was reachable by scrolling and re-triggered the fixture failure. Group icon/color pickers, group removal, single-cost deletion, subset assignment, timezone settings, and the start-date-format tooltip were also opened in all 12 combinations; their measured bounds stayed within the viewport, initial dialog focus was checked, and Escape dismissed them. First icon/color choice tooltips were triggered with keyboard Tab. These are browser checks in one engine, not translation approval or proof that every remaining tooltip and dialog state was exercised.
- **Keyboard correction:** Group icon/color pickers previously left focus behind the overlay and lacked dialog semantics. They now expose named modal dialogs, move focus inside, wrap Tab navigation, and restore focus to the opener. Focused icon/color tests cover these behaviors.

- **Additional isolated-preview checks:** In English and French, with light and dark themes at 375×812, 768×1024, and 1440×900, measured the global settings panel and the unsaved-trip new-trip confirmation. Both stayed within the viewport and the document had no horizontal overflow in these states. The confirmation opened with focus on its localized Cancel action in all 12 combinations. Test data and preferences were confined to a separate `127.0.0.1` preview origin. This evidence covers these two states only; the full interaction matrix and owner translation review remain open.

- **Further matrix pass (2026-10-28):** At each of 375×812, 768×1024 and 1440×900, in English and French and in light and dark themes, exercised the tool-navigation grid, currency/from-unit/local-timezone dropdowns, countdown calendar, trip cost editor, save and nested import/export-settings dialogs, currency attribution disclosure, and loaded forecast table/day switches. Measured menu/dialog bounds and page widths; tested Escape on the navigation, dropdowns, calendar and nested dialog. No document-level horizontal overflow was found in those states. Forecast no-results, date-validation and malformed-import feedback were also checked in all 12 combinations; the invalid date and trip ID remained unchanged during language/error changes.
- **Live workflow and fixes:** Exported and re-imported a test workbook, then discovered arbitrary text renamed `.xlsx` could be accepted as an empty trip. Import now requires recognizable single-sheet layout markers before parsing; valid markerless-version workbooks remain supported. Verified the error in English and French and added focused parser coverage. The nested settings dialog now receives/traps focus and restores it to the trigger; Escape closes only the nested dialog. Removed launcher title clamping after French mobile labels were visibly truncated. Browser checks and focused tests verify these corrections.
- **Remaining verification limit:** The live browser showed normal loading, loaded and no-results forecast states and import failures; deliberately forced currency/forecast provider failures were not reproduced visually. Existing component tests simulate provider failure, but do not establish responsive browser layout of those failure states. Other less-common dialogs and tooltip variants were not exhaustively checked at every combination. Consequently, retain PARTIAL for the full browser matrix and keep the French reviewer gate open.
- **Checks for this pass:** Full suite passed 77 files / 699 tests before the final focus-handler refinement; focused SaveDataPanel, workbook import, and GridPanel tests passed 24 tests afterward. Production build passed, catalog self-test passed with 596 keys, and the existing >500 kB build advisory remains.

- Additional interaction check: the French import/export settings dialog was measured within 375×812, 768×1024, and 1440×900 viewport bounds. Escape initially closed both nested dialogs; the save panel now stays open when the nested settings dialog closes. Verified in the browser and by the focused SaveDataPanel test suite. This does not complete the broader interaction matrix.

- In an isolated local preview, measured all nine routes (home, trip, currency, timezone, units, forecast, countdown, blog list, and one article) in English and French at 375×812, 768×1024, and 1440×900 after the shell rendered. None had document-level horizontal overflow. These measurements do not establish that every interaction and text element fits.
- Verified French selection with Space/arrow/Enter and Escape focus return; inspected the mobile settings and save panels, mobile trip editor, tablet trip read/edit views, desktop populated trip summary, French date picker, and a mixed Arabic/Latin cost name. Switching to English with an unsaved cost preserved the cost. The isolated test trip was saved to a slot.
- Checked a live Montréal forecast and timezone search/add flow in French dark mode, English-only article notice, and French persistence on reload. Browser console showed no errors in the checked trip state. Fixed untranslated forecast summary labels/per-day units and tablet forecast table heading overlap and timezone wrapping; verified the loaded forecast visually at 375, 768, and 1440 widths.
- Validation after those fixes: `npm run test -- --run --maxWorkers=3` passed 77 files / 696 tests; `npm run typecheck`, `npm run build`, `npm run i18n:check`, and `git diff --check` passed. The build retains the existing large-chunk advisory.
- **Still pending:** Full state-by-state matrix across both themes and languages, all tool menus/dialogs, loading and error states, import/export, and keyboard interactions at each viewport. The checks above are representative and do not close the responsive matrix. Owner review of French remains pending.
