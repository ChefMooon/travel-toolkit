---
title: "Site Internationalization with i18next - Implementation Plan"
plan_profile: FULL
status: IN_PROGRESS
verification_status: PARTIAL
current_phase: 1 / 4
created: 2026-10-26
last_updated: 2026-10-27
---

# Overall Plan Completion Status

- **Total Phases Completed:** 0 / 4
- **Summary of Outcome:** A scoped global-settings implementation has installed i18next/react-i18next, added an English resource catalog and initialized the shared English runtime. The product remains English-only, with no additional selectable locale. This establishes runtime groundwork but does not complete Phase 1's language selector/metadata contract or any later internationalization phase. See `docs/plans/global-settings/global-settings-plan.md` for scope and verification. Translation coverage, localized formatting, catalog parity, RTL preparation, and additional-language review remain pending.

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

- **Status:** NOT_STARTED
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
| Supported explicit preference wins; browser language and English fallback resolve predictably | Mandatory | Vitest cases for valid, regional, missing, malformed, unsupported, unavailable-storage, and resource-load-failure inputs; reload/hydration assertions | PENDING |
| Language activation and accessible shared UI stay synchronized | Mandatory | Component/integration assertions for selection, persisted preference, `html.lang`/`dir`, route-title update, keyboard access, and preserved settings | PENDING |
| Typed keys, namespace fallback, interpolation/plurals, and deterministic test state work | Mandatory | Type checking via `npm run typecheck`; focused Vitest tests using isolated instances and consecutive languages | PENDING |

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900 CSS pixels.
- **Interactions/states:** Selector by keyboard, shared navigation open/closed, English and expanded fixture labels, light/dark themes, loading failure.
- **Requested measurements:** No new horizontal page overflow, clipped selector labels, inaccessible focus targets, or overlap with existing navigation actions.
- **Preview limitations/fallbacks:** jsdom cannot establish geometry. Use a local browser preview during implementation; if unavailable, leave geometry evidence pending and name the validation owner.

### Phase Record

- **Artifacts created/modified:** None yet; expected runtime/resources, entry/shell/settings integration, selector, and focused tests.
- **Decisions/deviations:** Pending implementation-time selector placement.
- **Next-phase context:** Use the shared instance/helpers and semantic keys for tool migration; preserve all domain values.

## Phase 2: Tool messages, formatting, and content boundaries

- **Status:** NOT_STARTED
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
| Tools use complete messages, plural rules and localized accessible names | Mandatory | Focused component tests for each tool in English and a second fixture; catalog parity/interpolation checks; documented remaining-string audit | PENDING |
| Display formats follow locale without changing math, date meaning, or input values | Mandatory | Formatter tests covering decimal/group separators, currencies, percentages, date-only boundaries, relative times, explicit timezone and 12/24-hour modes; calculation regression suite | PENDING |
| Language switch preserves unsaved edits and persisted domain data | Mandatory | Integration test changes language with an edited trip, active currency/forecast/timezone settings and saved slots; compare domain snapshots before/after | PENDING |
| Spreadsheets remain round-trip compatible across languages | Mandatory | Existing `src/lib/xlsx/__tests__` import/export tests plus round-trip test under a non-English locale with unchanged sheet names/metadata | PENDING |
| Localized data requests/cache results cannot leak across locales | Mandatory | Geocoding request/query tests for effective-language keys, supported fallback, switch during request and stable selected location | PENDING |
| Untranslated articles and external content are represented honestly | Mandatory | Blog tests assert source `lang`, localized chrome/fallback notice, unchanged slugs/content; external-content audit | PENDING |

### Scope & Diff Guardrails

- Do not translate parser tokens, enum values, currency/IANA codes, stable event/category IDs, or user-authored text. Do not add translated routes or article variants.

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900; dense ledger both inline-editing and read states.
- **Interactions/states:** All tools, save/import/export panels, empty/loading/error states, long names, multi-digit amounts, expanded fixture labels and plural counts.
- **Requested measurements:** No clipped critical text, lost actions or horizontal page overflow; preserve ledger alignment and readable numeric fields.
- **Preview limitations/fallbacks:** Browser checks required for layout; fixture locale checks expansion only and cannot establish real translation quality.

### Phase Record

- **Artifacts created/modified:** None yet; expected feature catalogs, tool/components, formatting utilities, localized query integration, and regression tests.
- **Decisions/deviations:** Record retained English external/source content explicitly.
- **Next-phase context:** Catalog coverage establishes the affected UI surface for logical-layout and mixed-direction preparation.

## Phase 3: RTL preparation and layout resilience

- **Status:** NOT_STARTED
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
| Logical CSS preserves current LTR layout and leaves intentional geometry explicit | Mandatory | Diff review of changed directional rules and browser comparison across specified viewports; record retained physical positioning in the deferred audit | PENDING |
| Mixed-script names and codes remain readable with correct accessible text | Mandatory | Component assertions for isolation markup plus browser checks using Arabic/Hebrew names alongside currency amounts and timezone IDs | PENDING |
| Future direction integration exists without shipping RTL support | Mandatory | Locale-registry/document synchronization test using a test-only RTL fixture; production selector/resource audit excludes unsupported RTL entries | PENDING |
| Full RTL gaps are actionable and support boundaries explicit | Mandatory | Review deferred RTL audit against actual CSS, popover, ledger, drag, icon and font code; no claim of RTL completion | PENDING |

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900, English plus expanded fixture text.
- **Interactions/states:** Navigation, ledger editing/popovers, timezone search, mixed-script user names, dialogs, and theme selector.
- **Requested measurements:** No LTR geometry regressions, overlap or overflow; mixed-direction punctuation and codes remain readable. A forced RTL smoke view is diagnostic only.
- **Preview limitations/fallbacks:** Forced RTL cannot establish full RTL support. Record failures as deferred items rather than expanding implementation into a full RTL release.

### Phase Record

- **Artifacts created/modified:** None yet; expected scoped CSS/markup changes, direction tests, and RTL preparation documentation.
- **Decisions/deviations:** Full RTL remains deferred.
- **Next-phase context:** Use the completed coverage and layout evidence to validate the owner-selected real language.

## Phase 4: First translated language and release handoff

- **Status:** NOT_STARTED
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
| Advertised second language has complete, reviewed translations | Mandatory | Catalog validation command recorded during implementation; **Manual Validation:** owner/designated language reviewer attests terminology, grammar, plurals, destructive dialogs and consent messages | PENDING; reviewer not assigned |
| App remains functional and production build excludes test locales | Mandatory | `npm run test -- --run`; `npm run typecheck`; `npm run build`; `git diff --check`; inspect Vite output and resource imports | PENDING |
| Real-language responsive interactions and persistence work | Mandatory | Implementer browser evidence for matrix below, including reload and switching during unsaved edits; no console errors, clipped required actions, or unexpected state changes | PENDING |
| Contributors can add/maintain translations without changing domain formats | Mandatory | Documentation review and execute documented catalog check against a deliberately missing key in an isolated test fixture, without committing the defect | PENDING |

### Scope & Diff Guardrails

- No multilingual routes, translated spreadsheet schema, or production RTL locale. Do not mark this plan COMPLETED or verification PASSED based solely on pseudo-localization or English tests.

### UI Validation

- **Viewport(s):** 375×812, 768×1024, 1440×900; English and selected language; light/dark themes.
- **Interactions/states:** Every route; keyboard selector and focus; menus/dialogs/tooltips; error/loading/empty states; trip editing, saving/import/export, currencies, timezone clocks/search, forecasts, and English blog fallback.
- **Requested measurements:** No new horizontal page overflow, overlapping controls, clipped critical labels or unreadable values. Confirm stable ledger alignment and reachable actions at narrow widths; record viewport/screenshots or equivalent browser evidence.
- **Preview limitations/fallbacks:** If browser access or a real-language reviewer is unavailable, retain pending mandatory evidence and report the limitation; do not infer a pass from jsdom, builds, or machine-generated translations.

### Phase Record

- **Artifacts created/modified:** None yet; expected selected-language catalogs, catalog validation, contributor/architecture documentation and phase evidence.
- **Decisions/deviations:** Record selected locale and reviewer, any changed scope, and all remaining verification limits here and in the decision log.
