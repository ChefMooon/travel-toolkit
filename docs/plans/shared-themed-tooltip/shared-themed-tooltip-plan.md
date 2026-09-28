---
title: "Shared Themed Tooltip - Implementation Plan"
status: COMPLETED
current_phase: 3 / 3
created: 2026-09-28
last_updated: 2026-09-28
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 3 / 3
* **Summary of Outcome:** The shared themed tooltip is implemented, existing consumers are migrated, routed pages are audited, and final validation passed.

# Specification & Overview

### 1. Scope & Objective
- **Goal:** Provide a reusable tooltip that matches the site's light and dark themes, then replace existing simple/custom tooltip implementations and add tooltips to controls where they materially improve discoverability.
- **In-Scope:** A shared, typed, non-interactive tooltip component; theme-aware styling; pointer and keyboard behavior; migration of existing tooltip use in the listed components; a review of controls across the Trip Cost, Currency, Forecast, and Timezone pages; focused component and integration verification.
- **Out-of-Scope:** Replacing modal headings or interactive disclosures with tooltips; changing feature behavior or tooltip copy except where needed for clarity; adding a tooltip dependency; adding tooltips to controls that already have clear visible labels without an identified discoverability need.

### 2. Technical Constraints & Architecture
- The root layout synchronizes `data-theme` on the document element (`src/routes/__root.tsx`), and `src/index.css` already defines light/dark surface, text, border, and shadow tokens. Use those tokens rather than hard-coded theme-specific colors.
- Components are colocated under `src/components/<Name>/` with an `index.ts` entry point and nearby Vitest/Testing Library tests. The proposed foundation is `src/components/Tooltip/Tooltip.tsx`, `src/components/Tooltip/index.ts`, and `src/components/Tooltip/Tooltip.test.tsx`, with shared styling in `src/index.css`.
- React and Vitest with jsdom are already installed (`package.json`, `vitest.config.ts`). Do not add a dependency unless implementation discovery proves existing browser/CSS primitives cannot meet the accepted requirements.
- A repository tooltip inventory found no third-party tooltip wrapper. Existing native `title` attributes and custom tooltip markup must not remain alongside the shared tooltip on migrated targets, as that can produce duplicate browser and custom hints.
- Keep the shared tooltip non-interactive. The Forecast page's click-open source/disclaimer disclosures remain separate, as confirmed by the owner; one contains an external link and they need disclosure/popover interaction rather than tooltip semantics.
- On touch devices, tapping a tooltip trigger opens the tooltip and must not prevent or delay the trigger's normal action. Dismiss touch-opened tooltips by tapping outside; do not require a second tap to activate the control.
- Modal/dialog `title` props and headings are not tooltips and must remain unchanged.

### 3. Assumptions & Open Decisions
- **Confirmed behavior:** The shared tooltip is for concise, non-interactive supplemental text, is available on pointer hover and keyboard focus, and opens on touch tap while preserving the trigger's normal action.
- **Confirmed mobile behavior:** Dismiss a touch-opened tooltip when the user taps outside it. Tooltip placement must remain usable within the viewport, including narrow/mobile widths.
- **Confirmed boundary:** Keep the Forecast page's click-open informational disclosures separate from the shared tooltip.
- No material owner decisions remain open.

---

# Execution Plan & Handoffs

## Phase 1: Build the Shared Themed Tooltip
- **Status:** COMPLETED
- **Objective:** Establish the interaction, accessibility, and styling contract and implement a reusable tooltip foundation.

### Tasks
- [x] Implement touch tap-to-open behavior without preventing, delaying, or swallowing the trigger's normal action; dismiss an opened tooltip when the user taps outside it.
- [x] Implement `src/components/Tooltip/Tooltip.tsx` and export it from `src/components/Tooltip/index.ts`, following existing component conventions. Keep the API typed and limited to concise non-interactive content, a trigger, and any placement/configuration required by the inventory.
- [x] Add theme-aware tooltip styles to `src/index.css` using the existing theme variables; account for stacking, viewport edges, and responsive layouts.
- [x] Add `src/components/Tooltip/Tooltip.test.tsx` coverage for pointer hover, keyboard focus and Escape dismissal, touch tap-to-open, outside-tap dismissal, trigger action preservation, accessible description/role relationships, and both theme selectors where testable.
- [x] Record the agreed interaction contract and any positioning/visibility constraints in the phase handoff for migration work.

### Verification & Acceptance Criteria
*All criteria must pass before advancing to the handoff report.*
- [x] **Automated Checks:** `npm run test -- --run src/components/Tooltip/Tooltip.test.tsx`; `npm run typecheck`.
- [x] **Functional Assertions:** The tooltip appears on pointer hover, keyboard focus, and touch tap; the first touch tap still performs the trigger's normal action; a tap outside dismisses the tooltip; keyboard dismissal and assistive-technology description work; and the site theme tokens are used in both light and dark modes.
- [x] **Functional Assertions:** Tooltip content is non-interactive; no native `title` duplicate is introduced; the trigger's existing accessible name and action remain intact.
- [x] **Manual/Browser Checks:** At a narrow mobile viewport, triggers near opposite viewport edges remained visible and readable, preserved a trigger click after touch-pointer opening, and closed after an outside tap.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
- [x] **Required Files:** `src/components/Tooltip/Tooltip.tsx`; `src/components/Tooltip/index.ts`; `src/components/Tooltip/Tooltip.test.tsx`; `src/index.css`.
- [x] **Boundaries:** No consumers were migrated; no tooltip package, global theme behavior change, trigger-action suppression, or interactive popover functionality was introduced.
- [x] **Legacy Code Removed:** None in this phase; existing tooltip implementations remain until Phase 2.
- [x] **Acceptance Checks:** Focused component test and typecheck passed; touch, keyboard, pointer, positioning, and theme behavior were verified against the implementation.

### Phase 1 Handoff & Verification Report
*Filled out by the executing agent upon phase completion.*
- **Compliance Check:** PASS
- **Verification Result:** PASS
- **Execution Proof / Logs:** `npm run test -- --run src/components/Tooltip/Tooltip.test.tsx` passed (8 tests); `npm run typecheck` passed; `git diff --check` passed. At 320×640 in the local browser, two opposite-edge triggers were inspected: tooltips stayed within viewport bounds, selected top/bottom placement appropriately, used the light/dark `--surface` and `--text` tokens, preserved a trigger click after touch-pointer opening, and closed on an outside touch-pointer event. A later 236px viewport check reproduced and fixed excess wrapping: "Open tool navigation" changed from 113×49.6px/two lines to 137.34×28.19px/one line and aligned with its trigger.
- **Artifacts Created/Modified:** `src/components/Tooltip/Tooltip.tsx`; `src/components/Tooltip/index.ts`; `src/components/Tooltip/Tooltip.test.tsx`; `src/index.css`.
- **Decisions & Deviations:** Touch pointer opening does not suppress the control action; outside pointer-down dismisses. The browser check used a temporary runtime mount and synthetic touch-pointer/click events; no app source was changed for the check.
- **Next Phase Context:** Use `<Tooltip content="…" placement="auto|top|bottom">` around a single trigger. It preserves the trigger's accessible name and existing description/action, adds an `aria-describedby` relationship, removes native `title`, supports pointer/focus/Escape and touch-pointer/outside dismissal, and positions fixed content with viewport-edge clamping. Styling uses `--surface`, `--text`, `--border`, and `--shadow`. Do not convert Forecast's interactive disclosures or modal headings.

---

## Phase 2: Migrate Existing Tooltip Consumers
- **Status:** COMPLETED
- **Objective:** Replace existing native/custom tooltip implementations with the shared component while preserving each control's behavior, accessible name, and message.

### Tasks
- [x] Migrate the native title and browser-timezone hint in `src/features/timezone/TimezoneNavbar.tsx`; remove `.affordance-tooltip` styling from `src/index.css` only after confirming no consumer remains.
- [x] Migrate title hints in `src/components/TripToolbar/TripToolbar.tsx` and `src/components/Topbar/Topbar.tsx`; verify both components' supported use/tests before leaving either implementation behind.
- [x] Migrate reset/swap hints in `src/features/currency/CurrencyTool.tsx` and the reorder hint in `src/features/timezone/ConfigModal/ZoneConfigRow.tsx`.
- [x] Migrate hints in `src/components/CostRow/CostRow.tsx` (cost name, markup controls/value, split/type controls, assigned-couple names, and invalid-cost message), retaining the validation error's existing state and accessible association.
- [x] Migrate name/swatch/icon/reorder hints in `src/components/EditRow/EditRow.tsx`, `src/components/ColorChoiceModal/ColorChoiceModal.tsx`, `src/components/IconChoiceModal/IconChoiceModal.tsx`, and `src/components/GroupSetup/GroupSetup.tsx`.
- [x] Update relevant colocated tests: `src/features/timezone/TimezoneNavbar.test.tsx`, `src/features/timezone/ConfigModal/ZoneConfigRow.test.tsx`, `src/features/currency/CurrencyTool.test.tsx`, `src/components/TripToolbar/TripToolbar.test.tsx`, `src/components/Topbar/Topbar.test.tsx`, `src/components/CostRow/CostRow.test.tsx`, `src/components/EditRow/EditRow.test.tsx`, `src/components/ColorChoiceModal/ColorChoiceModal.test.tsx`, `src/components/IconChoiceModal/IconChoiceModal.test.tsx`, and `src/components/GroupSetup/GroupSetup.test.tsx`.
- [x] Keep Forecast's click-open `ForecastAttribution` and `ForecastEventDisclaimer` disclosures separate. Keep confirmation/modal titles in `CostLedger`, `SaveDataPanel`, and other dialog components as headings, not tooltips.

### Verification & Acceptance Criteria

- [x] **Automated Checks:** `npm run test -- --run src/features/timezone/TimezoneNavbar.test.tsx src/features/timezone/ConfigModal/ZoneConfigRow.test.tsx src/features/currency/CurrencyTool.test.tsx src/components/TripToolbar/TripToolbar.test.tsx src/components/Topbar/Topbar.test.tsx src/components/CostRow/CostRow.test.tsx src/components/EditRow/EditRow.test.tsx src/components/ColorChoiceModal/ColorChoiceModal.test.tsx src/components/IconChoiceModal/IconChoiceModal.test.tsx src/components/GroupSetup/GroupSetup.test.tsx`.
- [x] **Functional Assertions:** Every listed tooltip consumer uses the shared component; duplicate native `title` hints are removed; action triggers, labels, validation feedback, and reorder behavior are unchanged.
- [x] **Functional Assertions:** Forecast click-open disclosures and modal/dialog headings retain their existing separate interaction and semantics.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
- [x] **Required Files:** The Phase 1 tooltip foundation; the listed component sources and their colocated tests; `src/index.css` only for obsolete shared-tooltip styles.
- [x] **Boundaries:** Forecast disclosures and dialog headings were not converted; unrelated tooltip copy was not rewritten; legacy styles were removed only after checking for remaining consumers.
- [x] **Legacy Code Removed:** Replaced the listed `title`-only/custom tooltip implementations and removed `.affordance-tooltip` after confirming no consumer remained. CostRow validation feedback retains its state and message.
- [x] **Acceptance Checks:** The focused migration tests passed; every listed consumer is migrated and excluded disclosures/headings retain their existing semantics.

### Phase 2 Handoff & Verification Report
*Filled out by the executing agent upon phase completion.*
- **Compliance Check:** PASS
- **Verification Result:** PASS
- **Execution Proof / Logs:** The Phase 2 focused test command passed (10 files, 123 tests); `npm run typecheck` passed; `git diff --check` passed. The orchestrator independently reran the same focused suite and typecheck. A source search found no remaining `.affordance-tooltip` uses. Remaining Forecast `role="tooltip"` disclosure popovers and modal `title` props were retained as specified.
- **Artifacts Created/Modified:** The Phase 1 tooltip foundation; the 10 planned component sources and their 10 tests; `src/index.css`.
- **Decisions & Deviations:** No deviations. Dialog/modal `title` props in TripToolbar, Topbar, and GroupSetup are dialog headings, not tooltip attributes, and remain unchanged.
- **Next Phase Context:** Audit each routed page for remaining discoverability gaps. Explicit candidates from the plan: icon-only `grid-nav-trigger` and stateful `theme-toggle` in `Navbar`; preserve their accessible names if adopting. Do not convert Forecast click-open disclosure popovers or dialog headings. The Phase 2 native titles in source are limited to dialog `title` props; forecast `role="tooltip"` elements remain separate disclosures.

---

## Phase 3: Review Pages for Additional Tooltip Needs and Validate

* **Status:** COMPLETED
* **Objective:** Complete a page-by-page review for genuinely helpful, missing tooltips, implement approved additions, and validate the integrated result.

### Tasks

* [x] Review the Trip Cost, Currency, Forecast, and Timezone route/page surfaces (`src/routes/index.tsx`, `src/routes/trip.tsx`, `src/routes/currency.tsx`, `src/routes/forecast.tsx`, and `src/routes/timezone.tsx`) plus their rendered controls. Record each candidate and the reason for adding or declining a tooltip in the handoff.
* [x] Evaluate the icon-only `grid-nav-trigger` and `theme-toggle` controls in `src/components/Navbar/Navbar.tsx` as visual-tooltip candidates; if adopted, preserve their stateful accessible names and update `src/components/Navbar/Navbar.test.tsx`.
* [x] Add shared tooltips only to approved controls with a discoverability gap (for example, icon-only or otherwise ambiguous controls); do not add them to ordinary controls with clear visible labels. Keep Forecast's interactive disclosures separate.
* [x] Run the complete test suite, typecheck, and production build after the final consumer audit.
* [x] Verify the agreed touch behavior in a mobile-sized browser viewport on representative action and informational triggers, including a trigger near each viewport edge.

### Verification & Acceptance Criteria

* [x] **Automated Checks:** `npm run test -- --run` passed (49 files, 453 tests); `npm run typecheck` passed; `npm run build` passed.
* [x] **Functional Assertions:** Every routed page was reviewed with explicit add/decline rationale; approved additions use the shared component and retain accessible names and actions.
* [x] **Functional Assertions:** Theme-token use was verified in light and dark modes. Browser checks at 320px, 768px, and 1280px confirmed viewport-safe, non-overlapping placement. On touch-pointer events the tooltip opened, the trigger action ran on the same click, and an outside tap dismissed it.
* [x] **Manual/Browser Checks:** At a mobile-sized viewport, action and informational triggers were exercised; right- and left-edge placements remained readable and in-bounds, and outside-tap dismissal was verified.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
* [x] **Required Files:** Phase 3 modified only the approved Navbar source and colocated test identified in the audit.
* [x] **Boundaries:** Tooltips were not added indiscriminately; unrelated behavior was unchanged; Forecast disclosures and modal headings remain separate.
* [x] **Legacy Code Removed:** No remaining simple title/custom hints in the audited consumers bypass the shared component; remaining dialog titles and Forecast disclosure semantics are intentional.
* [x] **Acceptance Checks:** The complete suite, typecheck, production build, browser checks, and page-by-page add/decline audit are recorded below.

### Phase 3 Handoff & Verification Report

* **Compliance Check:** PASS
* **Verification Result:** PASS
* **Execution Proof / Logs:** `npm run test -- --run` passed (49 files, 453 tests); `npm run typecheck` passed; `npm run build` passed. At 320x640, 768x800, and 1280x800, the Timezone "Manage tracked timezones" hint remained inside the viewport and did not overlap its trigger. A temporary left-edge component trigger at 320x640 also remained in bounds and did not overlap. Outside touch-pointer events dismissed both. On the home page at 320x640, touch-pointer opening of grid navigation and theme tooltips followed by click events opened the grid and changed the theme while preserving accessible names; an outside touch-pointer event dismissed the tooltip. Theme state and browser route were restored. Light/dark computed colors matched `--surface` and `--text`. After a 236px-wide screenshot reproduction, the shared tooltip now renders "Open tool navigation" on one line, centered, at 137.34×28.19px rather than 113×49.6px over two lines. The Timezone "Manage tracked timezones" hint also rendered on one line at 170.72×28.19px at 320px wide and dismissed outside. The focused tooltip/Navbar/CostRow tests, full suite, typecheck, and production build passed after this refinement.
* **Artifacts Created/Modified:** `src/components/Navbar/Navbar.tsx`; `src/components/Navbar/Navbar.test.tsx`; preceding phase artifacts listed in their handoffs; this implementation report.
* **Decisions & Deviations:** Added state-aware tooltip content to the icon-only grid and theme controls, retaining their accessible names and actions. Browser touch checks used synthetic touch-pointer and click events in the local browser rather than a physical touch device.
* **Page-by-Page Audit:** Landing: declined tooltips for tool cards because each card already has a visible name and description. Trip Cost: declined new hints; controls are labeled, mobile tabs have visible labels, and New Trip/Save Slots hints are already shared. Currency: declined new hints; fields and Reset are labeled and Swap already has a shared tooltip. Forecast: declined new hints for labeled inputs/view modes and contextual day arrows; attribution and disclaimer click-open disclosures remain separate. Timezone: no further discoverability gap; Detect and Manage hints already use the shared component. Navbar: adopted tooltips for icon-only grid navigation and theme controls; labels and actions are unchanged.
* **Next Phase Context:** No follow-up implementation phase remains. Remaining `title` props are dialog headings, and Forecast `role="tooltip"` elements are separate interactive disclosures by design.

### Post-implementation Spacing Refinement

The shared tooltip's auto width was shrink-to-fit against the remaining viewport
space to one side of its fixed-position anchor, while positioning used a wider
fallback estimate before the tooltip element existed. The component now mounts
the tooltip invisibly for layout measurement before positioning it, and the
shared CSS uses `max-content` width with tighter padding, line height, and
trigger gap. This reduces unnecessary wrapping and makes the same spacing
improvement apply to all shared-tooltip consumers.

---
