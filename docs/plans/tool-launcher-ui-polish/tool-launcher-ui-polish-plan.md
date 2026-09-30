---
title: "Tool Launcher UI Polish - Implementation Plan"
status: COMPLETED
current_phase: 2 / 2
created: 2026-09-30
last_updated: 2026-09-30
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 2 / 2
* **Summary of Outcome:** Shared Lucide icons and consistent, accessible interaction polish are implemented across both tool launchers, documented, and validated. Final gate: 9 focused tests passed, the production build passed, and `git diff --check` passed; no remaining issues.

# Specification & Overview

### 1. Scope & Objective

- **Goal:** Improve the clarity, consistency, and interaction feedback of the four tool cards on the landing page while keeping the compact top-bar tool grid visually consistent.
- **In-Scope:**
  - Normalize the four tool icons and render the same icon set in the landing cards and top-bar tool grid.
  - Add subtle surface/icon treatment to improve card hierarchy without redesigning the page.
  - Make hover feedback apply to the whole linked card, with clear keyboard-focus and touch-active states.
  - Respect reduced-motion preferences and preserve light/dark theme behavior.
  - Update the existing site design specification and add focused route/icon coverage.
- **Out-of-Scope:**
  - Changing tool routes, labels, descriptions, or the behavior of the four tools.
  - Redesigning the top bar, unrelated cards, or other application iconography.
  - Creating, evaluating, modifying, or deleting custom SVG artwork or assets.
  - Adding an icon dependency or changing global icon-filter behavior in a way that affects unrelated controls.

### 2. Technical Constraints & Architecture

- The landing route in [src/routes/index.tsx](../../../src/routes/index.tsx) and the top-bar [GridPanel](../../../src/components/GridPanel/GridPanel.tsx) both render icons from shared [tool metadata](../../../src/lib/tools.ts). [src/lib/routeTitles.ts](../../../src/lib/routeTitles.ts) also consumes `TOOLS`, but only uses each tool's route and label; preserve that behavior.
- [lucide-react](../../../package.json) is already installed. Use Lucide React components for all four tool icons; do not add a dependency or investigate/create custom SVGs in this work.
- The shared [tool metadata](../../../src/lib/tools.ts) currently stores icon paths as strings. Replace that field with a typed Lucide icon component reference and render it from both launcher consumers.
- [src/index.css](../../../src/index.css) owns both launchers' styling. Its `--tool-icon-filter` token is also used by the save-panel icon, so any new launcher icon colors or transitions must not unintentionally change that unrelated control.
- [docs/SITE-DESIGN-SPEC.md](../../SITE-DESIGN-SPEC.md) defines the existing palette, launcher layout, theme behavior, focus token, WCAG 2.1 AA target, and 44px touch-target baseline. Reuse those conventions and update this source of truth with any new icon or interaction rules.
- No reduced-motion rule exists under `src/`; add a launcher-specific rule in [src/index.css](../../../src/index.css) to suppress or minimize launcher transforms and transitions.
- Keep icons decorative to assistive technology, preserve the existing full-card link targets, and keep motion subtle and non-blocking.

### 3. Assumptions, Risks, and Decisions

- **Confirmed scope:** The user requested that the top-bar tool grid receive the matching icon refresh as well as the landing cards.
- **Confirmed icon decision:** Use Lucide React icons only for the four tools. Do not create or investigate custom SVGs in this pass.
- **Implementation assumption:** Keep the four tool icons in one shared mapping/rendering path so the landing page and GridPanel cannot drift apart. Preserve route/title data and existing theme tokens.
- **Risk:** Replacing or globally retuning the shared icon filter could affect unrelated controls. Audit its consumers and scope changes to the two launcher surfaces.

# Execution Plan & Handoffs

## Phase 1: Implementing Shared Lucide Icons and Launcher Feedback

- **Status:** COMPLETED
- **Objective:** Replace the four tool image icons with shared Lucide components and apply the agreed visual and interaction polish to both launcher surfaces.

### Tasks

- [x] Replace the string-valued `icon` field in [src/lib/tools.ts](../../../src/lib/tools.ts) with a typed Lucide icon component reference and map each tool to an appropriate Lucide icon. Preserve routes, labels, descriptions, and route-title behavior.
- [x] Update [src/routes/index.tsx](../../../src/routes/index.tsx) and [src/components/GridPanel/GridPanel.tsx](../../../src/components/GridPanel/GridPanel.tsx) to render the shared Lucide component instead of an `<img>` path.
- [x] Use consistent icon stroke weight and theme-aware `currentColor` styling at sizes appropriate to each launcher. Keep icons decorative to assistive technology.
- [x] Refine the landing cards' resting appearance with restrained surface separation and a consistent, subtle icon treatment. Keep card sizing, centered layout, and text wrapping stable.
- [x] Add a whole-card hover treatment to the landing cards and adapt the GridPanel hover state for consistency. Use a small lift and clearer elevation/border feedback so the icon and text move together; do not animate the text independently.
- [x] Add a visible card-level `:focus-visible` treatment using the existing focus token and a touch-friendly `:active` state. Add a launcher-specific reduced-motion rule that suppresses launcher transforms. Preserve navigation and panel behavior.
- [x] Remove launcher-specific image-filter styling that is no longer needed, while keeping `--tool-icon-filter` behavior for unrelated controls unchanged. Remove the unused hover-filter token after confirming it had no other consumers.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** TypeScript/build validation passes with `npm run build`.
- [x] **Functional Assertions:** All four landing cards and GridPanel links still navigate to their existing routes, with unchanged labels and descriptions.
- [x] **Visual Assertions:** Both surfaces use the same Lucide icon mapping and theme-aware color. Hover feedback is applied to the full launcher item; the landing card's icon, title, and description move as one unit. The resting state remains calm and readable.
- [x] **Accessibility Assertions:** Keyboard focus is visible around the full link, touch activation has feedback, reduced-motion users are not required to see movement, and icons remain decorative to screen readers.
- [x] **Regression Assertions:** Save-panel icons and unrelated app surfaces retain their prior appearance and behavior.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Updated [src/lib/tools.ts](../../../src/lib/tools.ts), [src/routes/index.tsx](../../../src/routes/index.tsx), [src/components/GridPanel/GridPanel.tsx](../../../src/components/GridPanel/GridPanel.tsx), and [src/index.css](../../../src/index.css). No files under `public/` were modified.
- [x] **Boundaries:** Tool routes, title generation, descriptions, page content, tool functionality, and unrelated uses of `--tool-icon-filter` are unchanged. No dependency was added and no custom SVGs were investigated or created.
- [x] **Legacy Code Removed:** Replaced icon-path fields and `<img src={tool.icon}>` usage from both launcher consumers. Existing public SVG assets remain untouched.
- [x] **Acceptance Checks:** Shared icon treatment appears in both launchers; build passed and existing route/label/description outputs were confirmed in the browser.

### Phase 1 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
```text
  $ npm run build -> TypeScript and Vite production build passed (2,105 modules transformed).
  $ rg "<img src=\{tool\.icon\}|tool-icon-filter-hover|trip-cost\.svg|currency\.svg|timezone\.svg|forecast\.svg" src -g "*.{ts,tsx,css}" -> No matches found.
  $ git diff --check -> Passed.
  Browser at http://127.0.0.1:5173/ -> Four launcher links retained their names and routes; the GridPanel displayed the same four icons and destinations.
```

* **Artifacts Created/Modified:**
* `src/lib/tools.ts` - Replaced string icon paths with typed Lucide icon components.
* `src/routes/index.tsx` - Rendered shared decorative Lucide icons in landing links.
* `src/components/GridPanel/GridPanel.tsx` - Rendered the same shared icons in the tool grid.
* `src/index.css` - Added shared icon styling, full-link interactions, focus/active states, and reduced-motion support; retained the save-panel filter.
* **Decisions & Deviations:** User approved adding a new launcher-specific reduced-motion rule because no existing `prefers-reduced-motion` rule existed under `src/`.
* **Next Phase Context:** Phase 2 adds route/GridPanel tests, updates the existing design specification, then runs focused tests, build, and browser checks across themes, viewports, input modes, and reduced-motion settings.

## Phase 2: Documenting and Validating the Launcher Experience

- **Status:** COMPLETED
- **Objective:** Capture the updated launcher rules in the existing design specification and verify the complete interaction across themes, input modes, and viewport sizes.
- **Dependencies:** Phase 1 implementation.

### Tasks

- [x] Add a focused landing-route test at [src/routes/index.test.tsx](../../../src/routes/index.test.tsx) for the four accessible links, existing destinations, and decorative icon semantics.
- [x] Extend [src/components/GridPanel/GridPanel.test.tsx](../../../src/components/GridPanel/GridPanel.test.tsx) to verify the updated tool icon rendering while retaining its existing route and close behavior checks.
- [x] Update [docs/SITE-DESIGN-SPEC.md](../../SITE-DESIGN-SPEC.md) with the Lucide launcher icon approach, sizing/weight guidance, and hover, focus, active, and reduced-motion behavior. Replace the obsolete SVG filename mapping and update the design-spec version history.
- [x] Run the focused tests with `npm test -- --run src/routes/index.test.tsx src/components/GridPanel/GridPanel.test.tsx src/lib/routeTitles.test.ts` and run `npm run build`.
- [x] Verify in a browser at desktop and narrow/mobile widths, in light and dark themes, using mouse hover, keyboard Tab focus, touch/active interaction, and reduced-motion settings.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** The focused landing-route, GridPanel, and route-title tests pass and `npm run build` exits successfully.
- [x] **Functional Assertions:** Each tool link retains its correct route and accessible name; GridPanel open, close, and selection behavior is unchanged.
- [x] **Visual Assertions:** Icons have consistent apparent size and weight; cards remain aligned without clipping or layout shifts; hover feedback is clear but restrained in both themes.
- [x] **Accessibility Assertions:** Full-card keyboard focus is plainly visible, color is not the only interaction cue, touch targets remain at least 44px, and reduced-motion mode removes or minimizes movement.
- [x] **Documentation Assertions:** The site design specification describes the Lucide launcher icons and interaction behavior and no longer presents the old SVG filename mapping.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Added [src/routes/index.test.tsx](../../../src/routes/index.test.tsx); updated [src/components/GridPanel/GridPanel.test.tsx](../../../src/components/GridPanel/GridPanel.test.tsx) and [docs/SITE-DESIGN-SPEC.md](../../SITE-DESIGN-SPEC.md).
- [x] **Boundaries:** Documentation changes are limited to the existing design specification; no second design guide or unrelated documentation was added or changed.
- [x] **Legacy Code Removed:** Obsolete launcher SVG mappings were removed from the design specification; existing SVG asset files remain untouched.
- [x] **Acceptance Checks:** Both listed automated commands passed, and the stated manual checks were completed.

### Phase 2 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
```text
  $ npm test -- --run src/routes/index.test.tsx src/components/GridPanel/GridPanel.test.tsx src/lib/routeTitles.test.ts -> 3 files passed, 9 tests passed.
  $ npm run build -> TypeScript and Vite production build passed (2,105 modules transformed).
  $ git diff --check -> Passed.
  $ rg "trip-cost\.svg|currency\.svg|timezone\.svg|forecast\.svg|--tool-icon-filter-hover" docs/SITE-DESIGN-SPEC.md -> No matches found.
  Browser checks -> Desktop and 375px-wide layouts rendered all four links without horizontal overflow in light and dark themes. Hover applied to whole links; Tab focus showed the 2px --focus outline; pressed cards scaled to 0.99 with reduced shadow; reduced-motion mode reported transform none and transition-duration 0s. GridPanel tiles remained at least 106px high, used matching icons, and opened/closed; route-selection close behavior passed its test.
```
* **Artifacts Created/Modified:**
* `src/routes/index.test.tsx` - Added accessible landing-link, destination, and decorative-icon coverage.
* `src/components/GridPanel/GridPanel.test.tsx` - Added shared decorative icon rendering coverage.
* `docs/SITE-DESIGN-SPEC.md` - Documented shared Lucide icons, launcher interactions, and version 1.3.
* **Decisions & Deviations:** User approved adding a new launcher-specific reduced-motion rule because the plan referenced a rule that did not exist. Browser testing also exposed and corrected active-state cascade ordering so a pressed card overrides hover transform and shadow.
* **Next Phase Context:** None; all planned phases and acceptance checks are complete.
