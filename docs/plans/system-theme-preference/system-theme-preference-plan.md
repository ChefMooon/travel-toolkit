---
title: "System Theme Preference - Implementation Plan"
plan_profile: COMPACT
status: COMPLETED
verification_status: PASSED
current_phase: 1 / 1
created: 2026-10-19
last_updated: 2026-10-19
---

# Overall Plan Completion Status

- **Total Phases Completed:** 1 / 1
- **Summary of Outcome:** Phase 1 implementation is complete. The full Vitest
  suite, production build, migration/precedence browser checks, and diff
  guardrails passed. The owner explicitly waived the unavailable browser
  viewport, live OS color-scheme, first-paint, direct keyboard, and cross-route
  checks. Those checks remain unverified and are not represented as passing;
  all remaining mandatory criteria passed.

# Specification & Overview

### Scope & Objective

- **Goal:** Offer System, Light, and Dark as a site-wide preference. System follows
  the browser/OS color scheme, including changes while the site is open.
- **User requirement:** "theme should be site wide only. theme should not be saved
  with a trip, i think this is a bug."
- **In-Scope:** Both existing controls, settings persistence, pre-paint bootstrap,
  runtime synchronization, reactive palette consumers, and removing theme from
  trip state, snapshots, save slots, hydration, load/reset, and import/export.
  Preserve existing trips and saved-slot data; migrate a valid legacy current-trip
  theme once into the site-wide preference only when no site preference exists.
  Saved-slot themes never set the site preference.
- **Out-of-Scope:** New palettes, per-trip appearance, account/cloud preference
  synchronization, changes to workbook formats, unrelated UI redesign, new
  dependencies, and release/version updates.

### Constraints & Architecture

Verified against the clean checkout on 2026-10-19; recheck overlapping files before
implementation because this plan is not an application change.

| Evidence | Current behavior and planning implication |
| --- | --- |
| `src/store/settingsStore.ts`, `useSettingsStore` | Independently persists export/import preferences under `travel-toolkit-settings-data`; extend this site-wide boundary without resetting existing settings. |
| `src/store/tripStore.ts`, `setTheme`, `getSnapshot`, `loadSnapshot`, `resetTrip`, `partialize` | Theme belongs to trip state, marks trips dirty, mutates the DOM, enters snapshots and persistence, and is spread back on load. Removing the type alone will not remove legacy runtime fields. |
| `src/store/types.ts`, `TripSnapshot` | Requires a binary theme; remove it from the trip contract, not from palette helper inputs. |
| `src/store/saveSlotStore.ts`, normalization and snapshot comparisons | Requires `snapshot.theme`, retains the raw snapshot, and compares JSON. Normalize away legacy theme without discarding slots or causing false unsaved-change status. Existing persisted version is 1; unsupported slot schema versions are rejected. |
| `index.html`; `src/routes/__root.tsx`, `ThemeSync` | Bootstrap reads `travel-toolkit-trip-data`; runtime reads trip theme. Both must resolve the same settings preference without a hydration-time flash. |
| `src/components/Navbar/Navbar.tsx`; `src/components/Topbar/Topbar.tsx` | Separate binary buttons read and write trip theme. Both need the same three-option behavior and current preference indication. |
| `src/components/{CostRow,EditRow,SplitAssignmentModal,GroupSetup,CoupleCard}` | Read trip theme for group colors. Migrate to a reactive resolved light/dark value. |
| `src/components/ColorChoiceModal/ColorChoiceModal.tsx` | Memoizes the DOM theme once. Ensure an already-open modal updates when the resolved theme changes. |
| `src/lib/xlsx/{types,importWorkbook,exportWorkbook}.ts`; `src/components/SaveDataPanel/SaveDataPanel.tsx` | XLSX already excludes theme, but import reconstructs it through `toFullSnapshot(exportable, currentTheme)`. Remove this coupling without changing spreadsheet content or rate-import behavior. |
| `src/index.css` | Palettes use `data-theme="light"` / `"dark"`; `theme-preload` and `theme-switching` suppress transitions. Keep resolved DOM values binary and preserve palette/transition behavior. |
| `package.json`; `vitest.config.ts`; `vitest.setup.ts` | Existing TypeScript/Vite build and Vitest/jsdom tests; no lint or browser-test script is defined. Use current tooling, not a new dependency. |

**Implementation direction:** Persist only the selected preference
(`system`, `light`, or `dark`) in settings. Derive a reactive resolved binary
theme for DOM/CSS and color helpers; never persist the OS result as the user's
choice. Give runtime synchronization one owner and clean up media-query listeners
and animation frames on unmount. Keep the small inline pre-paint resolver
behaviorally aligned with the runtime resolver through tests.

**Assumptions and open decisions:**

- **Resolved owner decision D1 - legacy preference migration:** One-time migrate
  the current persisted trip's valid light/dark theme into the new site-wide
  preference only when no site preference exists. Ignore per-save-slot themes.
  Existing valid site preferences always take precedence; missing or invalid
  legacy themes use the Light fallback.
- **Auto-resolved default:** New installations and users without a valid stored
  preference use Light unless migration finds a valid current-trip preference.
  The user requested a System option, not a changed default; retaining Light
  preserves the current `tripStore.ts` initial value and `index.html` fallback.
- **User-directed control:** Use a shared, compact three-position icon radio
  slider in both locations, ordered System, Light, Dark. Display the selected
  preference, not merely the resolved sun/moon state; System remains selected
  when the OS changes. Arrow keys move between options, with Home/End shortcuts.
  This supersedes the earlier auto-resolved native selector.
- Missing `matchMedia` resolves System to Light. Invalid/malformed/unavailable
  settings storage must not prevent rendering; apply the Light fallback before
  and after mount and report actual storage/parse failures without logging
  stored trip contents.
- No material owner decisions remain. The selected migration behavior must be
  implemented consistently in bootstrap and hydration before legacy trip theme
  cleanup.

**Risks and dependencies:** Zustand's default merge and snapshot spreads can
reintroduce removed legacy properties. Slot normalization must retain all trip
fields, labels, timestamps, and supported versions. Do not bump slot schema
versions merely to remove an optional legacy property and thereby invalidate old
saves. Mocked stores and integration fixtures still assume trip-owned theme.
jsdom cannot prove absence of a visible first-paint flash. No new dependency or
external service is expected. Migration must resolve before legacy trip cleanup
removes its source, agree with pre-paint initialization, preserve other settings
and never repeat after a site preference is saved.

### Decisions & Change Log

| Decision | Source and date | Supersedes | Affected scope or acceptance criteria |
| --- | --- | --- | --- |
| Theme is site-wide only, never trip data. | Explicit user clarification, relayed 2026-10-19 | Existing trip-owned theme behavior | Settings ownership, dirty state, snapshots, hydration, save/load/reset and workbook paths |
| D1 was reopened with migration-versus-ignore alternatives; migration was recommended and awaited owner choice. **Historical.** | Plan revision request, 2026-10-19 | Historical assumption to ignore legacy overrides and claim implementation readiness | Superseded by resolved D1 below |
| Preserve Light as the unconfigured fallback; make System an explicit choice. | Automatic decision, 2026-10-19; current `tripStore.ts` initial value and `index.html` fallback | Earlier assumption that fresh installations default to System | Settings initialization, bootstrap and default/upgrade acceptance tests |
| Replace the native selector with a three-position System/Light/Dark icon radio slider. | Explicit user request, 2026-10-19 | Auto-resolved native selector | Shared Navbar/Topbar control, selection feedback, keyboard interaction and motion |
| Migrate the current persisted trip theme once into the site-wide preference when no valid site preference exists; ignore saved-slot themes. | User selection, 2026-10-19 | Open D1 alternatives | Upgrade migration, precedence, sanitization and corresponding acceptance checks |

---

# Execution Plan & Handoffs

## Phase 1: Site-wide System Theme and Trip Theme Decoupling

- **Status:** COMPLETED
- **Objective:** Deliver one persistent site preference with reliable OS
  synchronization and fully theme-free trip serialization.

### Tasks

- [x] Extend `useSettingsStore` with a validated preference and setter; preserve
  existing settings on hydration. Implement reusable binary resolution and
  reactive access using existing React/Zustand patterns. Migrate the current
  persisted trip's valid light/dark theme once only when no site preference
  exists; never migrate from a slot or overwrite a valid site preference. Use
  Light when no valid preference or legacy theme exists, and do not persist the
  derived OS result.
- [x] Update the `index.html` bootstrap to read the settings envelope, resolve
  System with `prefers-color-scheme: dark`, and set `data-theme` and `colorScheme`
  before application startup. Update root `ThemeSync` to agree on initialization,
  including the approved D1 policy on the first upgraded visit,
  respond to media-query changes only in System, resolve immediately when
  returning to System, and clean up listeners. Preserve preload and rapid-switch
  transition suppression without trip-store DOM side effects.
- [x] Replace both binary controls with the shared System/Light/Dark selector.
  Retain surrounding navigation, save/reset actions, tooltip and focus behavior.
  Provide an accessible name, exposed selected option, keyboard and touch access.
  Update every verified group-color consumer and the open color-choice modal to
  consume the reactive resolved theme.
- [x] Remove theme and `setTheme` from `TripStore`, initial state, `TripSnapshot`,
  snapshots, persistence, reset and load paths. Sanitize legacy persisted trip
  state and loaded snapshots explicitly so spreading old objects cannot restore
  theme. Keep unrelated trip content and existing dirty-state semantics intact.
- [x] Remove the theme requirement from save-slot normalization; strip legacy
  theme on hydration and save/load boundaries before comparison and persistence.
  Accept supported old slots with theme and new slots without it, preserving
  metadata and contents. Theme-only differences must not produce save warnings
  or related-older-slot status.
- [x] Remove the current-theme read and `toFullSnapshot` theme augmentation from
  XLSX import and `SaveDataPanel`; simplify/remove the now-redundant adapter and
  `Omit<TripSnapshot, 'theme'>` contract as appropriate. Preserve both workbook
  schemas, export field selection and exchange-rate import modes.
- [x] Update existing affected tests, mocks and fixtures, including trip/save-slot,
  Navbar/Topbar, TripToolbar/SaveDataPanel, XLSX, responsive and integration tests,
  plus resolved-color consumer tests. Add focused settings, synchronization and
  bootstrap coverage in the owning areas. Update the existing README theming
  description; do not create a second source of truth.
- [x] Run the mandatory checks below, review the actual diff against guardrails,
  and record evidence here. Do not mark acceptance passed based on planning.

### Outcome & Evidence Ledger

| Outcome / acceptance criterion | Check | Verification method | Result / evidence |
| --- | --- | --- | --- |
| Unconfigured installations use Light; upgrades migrate the current legacy theme once only when no valid site preference exists; explicit choices persist independently of trips and preserve other settings. | Mandatory | Vitest settings cases: absent, each valid value, invalid value, malformed JSON, storage access failure, rehydration and unchanged import/export preferences. Test legacy light/dark migration once, existing System/Light/Dark site preference precedence, missing/invalid legacy values falling back to Light, ignored slot themes, and no reapplication after reload. Assert only the selected preference is persisted, not the OS result. | PASS — `src/store/theme.test.tsx` verifies defaults, validation, persistence, migration precedence, ignored slot themes, and one-time behavior; all cases passed in the full suite (56 files / 571 tests). |
| System tracks light-to-dark and dark-to-light changes; explicit choices ignore them; switching back resolves immediately. | Mandatory | Mock `matchMedia` and dispatch change events in runtime integration tests. Assert root `data-theme`, `style.colorScheme`, displayed selection and reactive group/modal colors; verify listener cleanup/remount and rapid-switch class cleanup. | PASS — runtime hook and integration tests exercised both media-query directions, explicit overrides, re-resolution, reactive color consumers, and theme-switch cleanup. |
| Bootstrap agrees with runtime before React mounts, including one-time migration of the current legacy trip theme. | Mandatory | Execute the actual inline `index.html` script in Vitest with controlled storage/media mocks: absent/invalid preference, System with both OS values, each override with opposite OS value, malformed/unavailable storage, missing media API and conflicting legacy trip/slot themes. Assert current-trip migration only when no valid site preference exists, saved-slot themes are ignored, binary DOM theme/colorScheme before mount and identical values after mount and subsequent reload. | PASS — the actual inline bootstrap script is executed in `src/store/theme.test.tsx`; cases cover migration, valid preference precedence, System/override resolution, malformed/unavailable storage, and missing media support. |
| Both controls expose all three options and stay synchronized across navigation. | Mandatory | Navbar/Topbar tests select each value, assert accessible label/selected option and keyboard interaction, and confirm settings setter rather than trip mutation; integration coverage mounts actual stores and both surfaces. | PASS — Navbar/Topbar tests cover accessible labels, selected state, settings-store updates, synchronization, and arrow/Home/End keyboard behavior. The user waived direct browser keyboard and cross-route viewport evidence; those remain unverified. |
| Theme never changes trip dirty/save status or enters current/persisted snapshots. | Mandatory | Trip/save-slot tests compare trip content, dirty state, snapshot keys and related-slot status before/after all preference/OS changes; cover clean and already-dirty trips, legacy hydration, legacy snapshot load, save/load/reset, and rehydration. Assert no runtime or persisted trip/slot `theme` property; retain trip data and slot metadata. | PASS — trip and slot tests cover legacy sanitization, snapshots, persistence, comparisons, and slot metadata; preference is asserted unchanged through snapshot load/reset. Browser fixture checks confirmed current-trip and slot theme removal while preserving trip names and slot label. |
| Legacy and new saves remain usable; imports/exports are appearance-independent. | Mandatory | Save-slot fixtures with and without legacy theme load under supported schema versions; retain existing unsupported-version behavior. XLSX tests round-trip both schemas; SaveDataPanel/TripToolbar tests confirm import, load and New Trip leave site preference/resolved theme unchanged, with existing rate policies intact. | PASS — save-slot, XLSX, SaveDataPanel, and TripToolbar tests passed; preference is asserted unchanged on trip load/import/reset. Browser slot-load check kept the site preference Light while loading legacy slot data and removed its theme. |
| Existing behavior and affected fixtures remain valid. | Mandatory | Run `npm run test -- --run` (includes new tests and existing store, component, responsive, integration and XLSX coverage); every failure introduced by this change must be fixed. | PASS — `npm run test -- --run --maxWorkers=1 --fileParallelism=false`: 56 test files and 571 tests passed. An initial parallel run hit two blog-test timeouts; both tests passed in isolation and in the serialized full run. |
| Type-safe production build succeeds without added packages. | Mandatory | Run `npm run build` (TypeScript build plus Vite production bundle). | PASS — `npm run build` completed (`tsc -b` and Vite production bundle). No dependency manifests changed. |
| Visible first paint, responsive controls and palette behavior match the UI validation block. | WAIVED BY USER | Browser preview using `npm run dev`: collect reload/slow-start evidence with persisted overrides opposite the emulated OS, and exercise the viewport/state matrix below; record screenshots or a short capture and observed root attributes. Test existing and fresh storage using fixtures, not destructive changes to personal saves. | WAIVED — on 2026-10-19 the user directed us to mark the work complete and continue despite the remaining browser evidence gap. The preview was available only at 1280×720; the required 360×800 / 768×1024 / 1440×900 matrix, live OS-change behavior in-browser, and first-paint/slow-start capture remain unverified and are not claimed as passed. Earlier browser storage was restored to its original values. |
| Diff removes trip-theme coupling without unrelated changes. | Mandatory | Review `git --no-pager diff --stat` and `git --no-pager diff`; search `src` and `index.html` for `setTheme`, `.theme`, snapshot spreads and old theme-omission adapters. Classify remaining references as site preference, resolved palette, legacy sanitation or test fixtures; verify no production trip owner remains and no dependency/palette/workbook-schema changes occurred. | PASS — `git diff --check` is clean; reviewed the change summary and affected ownership/bootstrap/XLSX/CSS paths. Remaining trip-theme references are migration/sanitization or fixtures; no dependency manifests, palette values, or workbook schema/contents changed. The build-generated `tsconfig.tsbuildinfo` change was restored. |

### Scope & Diff Guardrails

- Implementation may touch only the evidenced ownership/consumer/test boundaries
  and directly related README text; preserve unrelated working changes.
- No trip field may carry the preference or resolved theme. Legacy compatibility
  means discard appearance only, never discard a valid trip or slot.
- Keep existing CSS light/dark palette values, calculations, trip CRUD,
  import/export schemas, save metadata and unrelated settings unchanged.
- No new dependency, configuration expansion, commit, push or branch/worktree
  action is authorized by this plan.

### UI Validation

- **Viewport(s):** 360 x 800 mobile, 768 x 1024 tablet and 1440 x 900 desktop.
  Exercise Navbar across routes and Topbar in its trip view/test harness; do not
  introduce a new route solely to expose a legacy control.
- **Interactions/states:** Select all options with mouse, keyboard and touch;
  verify one-time migration on a first upgraded visit with legacy light/dark
  opposite the OS and confirm existing site preferences take precedence and
  later slot loads cannot change the site choice;
  navigate away/back; reload with System and each override; change emulated OS
  while System and while explicit; open the color picker before an OS change;
  load/save/import/reset trips and observe unchanged preference and save status.
- **Requested measurements:** All three options and selected state are legible,
  focus is visible, no new header overlap/clipping or horizontal overflow at the
  specified widths, and no opposite-palette frame appears during reload/startup.
  No new performance threshold or palette/contrast redesign is requested.
- **Preview limitations/fallbacks:** jsdom tests prove resolution and cleanup, not
  first-paint appearance or native platform selector presentation. Use a real
  browser with color-scheme emulation and startup capture. If preview is
  unavailable, retain that row as PENDING and verification as PARTIAL unless
  the owner explicitly waives the browser evidence; record any waiver without
  claiming unperformed browser checks passed.

### Phase Record

- **Artifacts created/modified:** `src/store/{settingsStore,themePreference,theme,tripStore,saveSlotStore,types}` and related store tests; shared `src/components/ThemeSelector/ThemeSelector.tsx`, Navbar/Topbar, reactive palette consumers, and affected component/integration tests; `index.html`, `src/routes/__root.tsx`, `src/index.css`, XLSX import/export types and tests, `README.md`, and this plan.
- **Decisions/deviations:** Site-wide ownership, D1 migration, the follow-up three-position System/Light/Dark icon slider, and waiver of remaining browser-only evidence are user-directed. The slider supersedes the earlier auto-resolved native selector. Light fallback remains unchanged. No dependency/palette/workbook-schema change. Browser preview limitations are recorded in the UI ledger; those checks remain unverified. The earlier ignore-legacy assumption and implementation-ready handoff are historical and superseded.
