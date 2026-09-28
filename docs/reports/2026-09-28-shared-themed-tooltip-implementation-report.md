# Shared Themed Tooltip - Implementation Report

**Date:** 2026-09-28
**Final status:** COMPLETED

## Goal and Scope

Provide a reusable, typed tooltip that follows the site's light and dark themes,
supports pointer and keyboard access, and opens on touch without suppressing the
trigger action. Migrate the planned existing hints, review the Trip Cost,
Currency, Forecast, and Timezone pages for further discoverability needs, and
validate the integrated result.

Forecast's click-open attribution/disclaimer disclosures and modal/dialog
headings remain outside tooltip scope. No tooltip dependency was added.

## Plan and Execution

The phases ran sequentially. Each phase was implemented and validated before
the next began:

1. Build the shared tooltip foundation.
2. Migrate the planned existing tooltip consumers.
3. Audit routed pages, add approved Navbar tooltips, and run final validation.

The primary session orchestrated and independently validated each phase.
`tooltip-phase-1`, `tooltip-phase-2`, and `tooltip-phase-3` implemented the
corresponding phases in separate sequential assignments. No phases ran in
parallel. The subagent tool did not expose model IDs, so exact same-model
identity could not be independently verified; no model override was supplied.

## Changes by Phase

### Phase 1: Shared Tooltip Foundation

- Added `src/components/Tooltip/Tooltip.tsx` and its `index.ts` export.
- Added a typed API for concise content, a single trigger, and `auto`, `top`,
  or `bottom` placement.
- Implemented pointer hover, keyboard focus, Escape dismissal, touch-pointer
  opening, and outside-pointer dismissal.
- Preserved trigger actions, accessible names, and existing descriptions;
  removed native `title` attributes from wrapped triggers.
- Added viewport-clamped positioning and styles using the existing `--surface`,
  `--text`, `--border`, and `--shadow` theme tokens.
- Added eight focused tests for interactions, accessible relationships,
  non-interactive content, positioning, and theme context.
- A narrow-width browser check exposed excess wrapping and off-center placement.
  The tooltip now uses `max-content` width and is measured invisibly before
  positioning. Shared padding, line height, and trigger gap were tightened.

### Phase 2: Existing Consumer Migration

- Migrated the planned Timezone, Currency, TripToolbar, Topbar, CostRow,
  EditRow, ColorChoiceModal, IconChoiceModal, and GroupSetup hints.
- Retained each trigger's action and accessible name, preserved CostRow
  validation feedback and its association, and retained reorder behavior.
- Removed the obsolete `.affordance-tooltip` rules after confirming there
  were no remaining consumers.
- Updated the ten colocated test files to cover shared tooltip descriptions
  and retained behavior.
- Kept Forecast disclosures and dialog/modal titles unchanged.

### Phase 3: Page Audit and Navbar

- Added state-aware shared tooltips to the icon-only grid navigation and theme
  controls in `src/components/Navbar/Navbar.tsx`; their accessible names and
  actions remain unchanged.
- Audited each routed page:
  - **Landing:** Declined tooltips for tool cards because each card already has
    a visible name and description.
  - **Trip Cost:** Declined additional hints because controls are labeled,
    mobile tabs have visible labels, and New Trip/Save Slots hints are already
    shared.
  - **Currency:** Declined additional hints because fields and Reset are
    labeled and Swap already uses the shared tooltip.
  - **Forecast:** Declined additional hints for labeled inputs/view modes and
    contextual day arrows. Kept click-open attribution and disclaimer
    disclosures separate.
  - **Timezone:** Found no remaining gap; Detect and Manage hints already use
    the shared component.
  - **Navbar:** Adopted tooltips for the icon-only grid and theme controls.

## Validation

- Phase 1: `npm run test -- --run src/components/Tooltip/Tooltip.test.tsx`
  passed (8 tests); `npm run typecheck` passed; `git diff --check` passed.
- Phase 1 browser check: At 320x640, opposite-edge triggers stayed within the
  viewport, did not overlap their controls, and used the theme tokens in both
  light and dark modes. Touch-pointer opening preserved a trigger click, and
  an outside touch-pointer event dismissed the tooltip.
- Phase 2: The focused migration command passed (10 files, 123 tests);
  `npm run typecheck` and `git diff --check` passed. The orchestrator
  independently reran the focused suite and typecheck.
- Phase 3: `npm run test -- --run src/components/Navbar/Navbar.test.tsx`
  passed (4 tests); `npm run typecheck` and `git diff --check` passed.
- Spacing regression: Focused Tooltip, Navbar, and CostRow tests passed
  (3 files, 32 tests); `npm run typecheck` and `npm run build` passed.
- Final: `npm run test -- --run` passed after the spacing refinement
  (49 files, 453 tests); `npm run typecheck` passed; `npm run build` passed.
- At 236px viewport width, the tooltip changed from 113x49.6px over two lines
  to 137.34x28.19px on one line and centered on its trigger.
- At 320px width, the Timezone "Manage tracked timezones" tooltip rendered on
  one line at 170.72x28.19px, stayed in bounds, and dismissed on an outside
  touch-pointer event.
- Final browser checks: At 320x640, 768x800, and 1280x800, the Timezone
  "Manage tracked timezones" tooltip remained in bounds and did not overlap
  its trigger. A temporary left-edge component trigger at 320x640 also stayed
  in bounds and did not overlap. Outside touch-pointer events dismissed both.
  At 320x640, the grid navigation action opened and the theme action changed
  theme on the same click following touch-pointer opening; accessible names
  remained intact. Theme state and browser route were restored afterward.

Browser touch checks used synthetic touch-pointer and click events in the
integrated local browser rather than a physical touch device.

## Residuals and Decisions

- No product or architecture decision remains open.
- Remaining dialog `title` props are headings, not tooltip hints. Forecast's
  `role="tooltip"` elements remain part of the separately scoped interactive
  disclosures.
- The subagent tool did not expose model identifiers, so same-model identity
  could not be independently confirmed.

## Final Result

All three planned phases are complete. The shared tooltip foundation,
migrations, Navbar additions, routed-page audit, focused and full tests,
typecheck, production build, and browser checks passed. No dependencies were
added, and there are no follow-up steps.
