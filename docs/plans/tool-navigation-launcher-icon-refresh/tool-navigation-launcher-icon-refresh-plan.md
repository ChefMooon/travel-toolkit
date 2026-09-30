---
title: "Tool Navigation Launcher Icon Refresh - Implementation Plan"
status: COMPLETED
current_phase: 2 / 2
created: 2026-09-30
last_updated: 2026-09-30
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 2 / 2
* **Summary of Outcome:** Replaced the top-bar navigation image with an accessible decorative Lucide grid glyph, documented and tested the change, and verified theme states, navigation behavior, type safety, and production build without altering pre-existing user work.
* **Final Validation:** PASSED
  * `npm test -- --run src/components/Navbar/Navbar.test.tsx src/components/GridPanel/GridPanel.test.tsx src/routes/index.test.tsx` - 3 files and 10 tests passed.
  * `npm run typecheck` - passed.
  * `npm run build` - passed; TypeScript and Vite production build completed.
  * `git diff --check` - passed after plan updates.
  * Browser review confirmed light/dark rest, hover, and focus states, expected glyph styling, and unchanged 48×48 trigger geometry.

# Specification & Overview

### 1. Scope & Objective

- **Goal:** Refresh the “Open tool navigation” top-bar trigger icon so its visual language matches the recently refreshed Lucide tool icons on the landing cards and in GridPanel, while keeping it recognizable as the navigation launcher.
- **In-Scope:**
  - Replace the trigger’s current external SVG glyph with a dedicated Lucide grid/navigation glyph.
  - Give the inline glyph theme-aware `currentColor` styling and tune its rendered weight against the refreshed tool icons.
  - Add focused Navbar icon coverage and update the existing top-bar icon guidance in the site design specification.
- **Out-of-Scope:**
  - Changing menu open/close, tooltip, focus, accessible-name, or navigation behavior; tool routes or tool metadata; GridPanel contents; or unrelated top-bar controls.
  - Changing the 48×48 trigger hit area or redesigning its border, background, or layout.
  - Reusing one of the individual tool icons as the navigation symbol.
  - Adding dependencies, editing or deleting SVG artwork, or changing unrelated theme/icon styling.

### 2. Technical Constraints & Architecture

- **Verified trigger implementation:** [Navbar](../../../src/components/Navbar/Navbar.tsx) owns `.grid-nav-trigger`. It currently renders `<img src="/grid.svg">`; the button maintains `aria-label`, `aria-expanded`, `aria-controls`, and its toggle callback. [Navbar styles](../../../src/index.css) define a 48×48 button and a 24×24 image with theme-specific `--nav-icon-filter` / `--nav-icon-filter-hover` filters and a hover/focus scale.
- **Verified current glyph:** [public/grid.svg](../../../public/grid.svg) is a four-cell grid symbol with a 16×16 viewBox and 1px strokes. CSS scales it to 24×24 and filters its black stroke for the active theme. Styling alone cannot make this external SVG a Lucide glyph; the glyph source/markup needs to change.
- **Evidence-based icon direction:** Preserve the generic four-cell grid meaning as a dedicated navigation icon, separate from the four tool-specific icons. The existing symbol has that meaning, and [the earlier navigation plan](../nav-and-routing-plan.md) explicitly keeps the trigger icon separate from the tool icons. Use an equivalent export from the already-installed `lucide-react` package rather than changing the symbol to a tool icon.
- **Refreshed icon reference:** [shared tool metadata](../../../src/lib/tools.ts) maps the tool cards and [GridPanel](../../../src/components/GridPanel/GridPanel.tsx) to `Calculator`, `ArrowLeftRight`, `Clock`, and `CloudSun`. Their shared styling in [src/index.css](../../../src/index.css) uses 22px glyphs, 1.75 stroke, and theme-aware `currentColor` badges. These are comparison points, not automatic top-bar size/stroke requirements; choose the trigger glyph’s final size and stroke by comparing its visual weight while preserving the existing 48×48 control.
- **Design and test guidance:** [SITE-DESIGN-SPEC.md](../../../docs/SITE-DESIGN-SPEC.md) documents top-bar grid-button states, legacy filter tokens, and the refreshed launcher icons. [Navbar.test.tsx](../../../src/components/Navbar/Navbar.test.tsx) already covers trigger accessibility, tooltip, toggling, and close paths. `package.json` provides the Vitest `test` script, `typecheck`, and `build` commands.
- **Working-tree constraint:** The implementation-start baseline was captured before edits. `git status --short` showed modifications to `docs/SITE-DESIGN-SPEC.md`, `src/components/GridPanel/GridPanel.test.tsx`, `src/components/GridPanel/GridPanel.tsx`, `src/index.css`, `src/lib/tools.ts`, and `src/routes/index.tsx`; untracked `src/routes/index.test.tsx`, `docs/plans/tool-launcher-ui-polish/`, and this plan folder. At baseline, the existing diffs in `docs/SITE-DESIGN-SPEC.md` and `src/index.css` were 17 insertions/9 deletions and 57 insertions/23 deletions respectively; `src/components/Navbar/Navbar.tsx` and `src/components/Navbar/Navbar.test.tsx` had no pre-existing diff. Preserve that work and make only the scoped additions below. In particular, do not revert or rewrite adjacent launcher changes.
- **Implementation details to confirm:** Verify the suitable grid-icon export in the installed `lucide-react` version. Remove obsolete trigger image/filter selectors and filter tokens only after confirming they have no remaining source consumers; update their design-spec entry accordingly. Leave `public/grid.svg` untouched unless separate evidence establishes that changing the asset itself is required.
- **Open decisions:** None about icon identity or whether to replace the glyph: repository evidence supports a Lucide-style four-cell navigation glyph. Exact component export, rendered size/stroke, and theme color should be verified during Phase 1 rather than silently assuming the tool icons’ 22px/1.75 settings apply.

---

# Execution Plan & Handoffs

## Phase 1: Replacing the Trigger Glyph and Updating Its Contract

- **Status:** COMPLETED
- **Objective:** Render a dedicated Lucide grid/navigation icon in the existing trigger and document/test the icon change without changing navigation behavior.

### Tasks

- [x] Record the implementation-start working-tree/diff baseline. Confirm the installed `lucide-react` export for a four-cell grid glyph, then replace only the trigger’s `<img src="/grid.svg">` with that decorative inline icon; keep it separate from the `TOOLS` mapping and preserve the button’s existing props and behavior.
- [x] Update `.grid-nav-trigger` icon styling in `src/index.css` to use theme-aware `currentColor` and a size/stroke that visually matches the refreshed Lucide tool glyphs. Keep the 48×48 trigger, existing surface/border, alignment, hover/focus affordances, and touch behavior. Remove obsolete image-filter rules/tokens only after confirming they have no other consumers.
- [x] Extend `src/components/Navbar/Navbar.test.tsx` to assert that the trigger renders a decorative, non-focusable inline SVG; retain and pass the existing accessible-name, tooltip, open/close, and dismissal assertions.
- [x] Update the top-bar icon guidance and relevant token/version-history entries in `docs/SITE-DESIGN-SPEC.md`. Describe the dedicated Lucide grid glyph and its theme-aware treatment without imposing the tool-icon measurements as requirements; do not revise historical plans.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** `npm test -- --run src/components/Navbar/Navbar.test.tsx`
- [x] **Functional Assertions:** The trigger contains a Lucide-rendered SVG marked decorative and non-focusable, not the external image. Its accessible name, expanded state, tooltip, toggle, and existing close/dismiss behavior remain unchanged.
- [x] **Visual Assertions:** The icon remains centered in the unchanged 48×48 trigger, reads as a generic four-cell navigation grid, uses theme-aware `currentColor`, and has visual weight consistent with the refreshed tool icons. Existing button hover and focus treatments remain intact.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Make scoped edits only to `src/components/Navbar/Navbar.tsx`, `src/components/Navbar/Navbar.test.tsx`, `src/index.css`, and the top-bar/icon guidance in `docs/SITE-DESIGN-SPEC.md`. Preserve unrelated pre-existing changes in any of those files.
- [x] **Boundaries:** Do not change `src/lib/tools.ts`, `src/components/GridPanel/GridPanel.tsx`, `src/routes/index.tsx`, tool routes, the theme toggle, package manifests, or `public/grid.svg`. Do not alter trigger behavior, button dimensions, or other icon consumers.
- [x] **Legacy Code Removed:** Remove the Navbar’s runtime `/grid.svg` image usage and obsolete `.grid-nav-trigger img`/navigation-filter code only when a consumer search confirms it is unused; leave the SVG asset itself untouched.
- [x] **Acceptance Checks:** Run the focused Navbar test and verify the functional and visual assertions above; do not infer styling success from DOM tests alone.

### Phase 1 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
```text
  $ npm test -- --run src/components/Navbar/Navbar.test.tsx -> 1 test file passed; 6 tests passed
  $ consumer search for nav-icon-filter, grid-nav-trigger img, and /grid.svg in src and SITE-DESIGN-SPEC.md -> no matches
  $ browser visual inspection -> light and dark themes; 48x48 trigger; 22x22/1.75 SVG; currentColor from --c3; hover border/scale and keyboard focus ring retained
```

* **Artifacts Created/Modified:**
* `src/components/Navbar/Navbar.tsx` - Render decorative `Grid2X2` instead of external image
* `src/components/Navbar/Navbar.test.tsx` - Assert decorative, non-focusable inline SVG and absence of external image
* `src/index.css` - Apply currentColor, tuned SVG dimensions/stroke, preserve hover/focus, remove unused navigation filters
* `docs/SITE-DESIGN-SPEC.md` - Document dedicated Lucide glyph and remove obsolete filter-token guidance


* **Decisions & Deviations:** Used the verified installed `Grid2X2` export with a 22px size and 1.75 stroke after visual comparison; no plan deviations. Kept `public/grid.svg` untouched and retained the independent save-panel `--tool-icon-filter`.
* **Next Phase Context:** Phase 2 must run all specified regression tests, typecheck, build, and `git diff --check`; repeat visual inspection of light/dark rest, hover, and keyboard focus, and compare all changes against the captured pre-existing working-tree baseline.

---

## Phase 2: Verifying the Refresh and Preserving Navigation Behavior

- **Status:** COMPLETED
- **Objective:** Validate the new glyph against the launcher reference across supported themes and confirm the focused change has not altered navigation or expanded into unrelated work.

### Tasks

- [x] Run the focused launcher regression tests, typecheck, production build, and whitespace/diff check listed below; correct any failures only in the scoped Phase 1 files.
- [x] Inspect the trigger in light and dark themes at rest, hover, and keyboard focus. Compare its perceived glyph weight with the landing-card/GridPanel Lucide icons; confirm the button remains centered and 48×48 and that no unrelated top-bar control changes.
- [x] Audit the implementation against the captured pre-change baseline. Confirm the landing cards, GridPanel tool icons, routes, tool metadata, theme toggle, and existing user changes are preserved; confirm no dependency or artwork changes were introduced.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** Run `npm test -- --run src/components/Navbar/Navbar.test.tsx src/components/GridPanel/GridPanel.test.tsx src/routes/index.test.tsx`, `npm run typecheck`, `npm run build`, and `git diff --check`.
- [x] **Functional Assertions:** Navbar tests retain open/close, accessible-name, tooltip, and dismissal behavior; GridPanel and landing-route tests retain the four existing tool links and destinations. The implementation changes only the trigger glyph and its directly related styling/documentation/tests.
- [x] **Visual Assertions:** Light and dark theme checks confirm the glyph inherits the intended theme color, remains legible at rest/hover/focus, and visually aligns with the refreshed Lucide tool-icon style without changing trigger geometry or neighboring controls.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** No additional files are expected beyond the Phase 1 files. Any narrowly scoped fix must stay within those files and preserve pre-existing user changes.
- [x] **Boundaries:** Confirm against the captured baseline that no tool route, GridPanel content, landing-card behavior, dependency, `public/grid.svg` artwork, theme toggle, or unrelated top-bar control was changed.
- [x] **Legacy Code Removed:** Confirm the trigger no longer renders the external image and no obsolete trigger image-filter rules remain in use; do not delete the SVG asset.
- [x] **Acceptance Checks:** All four exact commands above pass, and the stated light/dark visual and functional assertions are actually checked.

### Phase 2 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
```text
  $ npm test -- --run src/components/Navbar/Navbar.test.tsx src/components/GridPanel/GridPanel.test.tsx src/routes/index.test.tsx -> 3 test files passed; 10 tests passed
  $ npm run typecheck -> passed
  $ npm run build -> passed; TypeScript and Vite production build completed
  $ git diff --check -> passed
  $ browser inspection -> light/dark rest, hover, and keyboard-focus states checked; button remains 48x48; glyph is centered and visually consistent with launcher tool icons
  $ baseline audit -> pre-existing changed paths remain changed; no package, tool-route, tool-metadata, theme-toggle, or public/grid.svg changes; generated tsconfig.tsbuildinfo change from validation was removed
```

* **Artifacts Created/Modified:**
* `src/components/Navbar/Navbar.tsx` - Replace launcher image with decorative Lucide grid icon
* `src/components/Navbar/Navbar.test.tsx` - Cover icon accessibility and source
* `src/index.css` - Style the inline icon and remove obsolete navigation filters
* `docs/SITE-DESIGN-SPEC.md` - Document the refreshed top-bar glyph and currentColor treatment
* `docs/plans/tool-navigation-launcher-icon-refresh/tool-navigation-launcher-icon-refresh-plan.md` - Record completed phase handoffs and verification


* **Decisions & Deviations:** No plan deviations. The build-generated `tsconfig.tsbuildinfo` change was restored because it was absent from the implementation-start baseline.
* **Next Phase Context:** None; all planned phases and acceptance criteria are complete.

---
