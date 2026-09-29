# Trip Cost Accessibility and Tooltip Improvements

**Date:** 2026-09-28
**Final status:** IMPLEMENTED WITH SCREEN-READER VALIDATION LIMITATION

## Goal and Scope

Improve keyboard and assistive-technology access to the Trip Cost page, clarify
icon-only actions with the existing shared Tooltip, and preserve calculations,
trip persistence, routing, and other routes. The implementation followed the
[Trip Cost accessibility and tooltips plan](../plans/trip-cost-page-accessibility-tooltips/trip-cost-page-accessibility-tooltips-plan.md).

## Plan and Execution

The three phases ran sequentially. Each phase was validated before the next
began:

1. Reconfirm the route audit and run a focused baseline.
2. Implement semantic controls, labels, keyboard behavior, and approved
   tooltips.
3. Run complete automated checks and responsive browser validation.

The Phase 1 audit and Phase 2 implementation used the same general-purpose
subagent. A task subagent ran the Phase 3 full suite, typecheck, and build. The
orchestrator reviewed the combined changes, completed browser checks, and
added a contextual accessible name and test for the CostRow reorder handle
after the browser accessibility tree exposed that remaining gap.

Subagent model identifiers were not exposed by the tool, and no model override
was supplied. Exact model identity between the orchestrator and subagents could
not be independently verified.

## Changes by Phase

### Phase 1: Audit and Baseline

- Confirmed `/trip` renders the TripToolbar and App composition; the route
  wrapper required no changes.
- Reconfirmed the planned accessibility gaps and decisions. Added two
  follow-up findings to Phase 2: contextual naming for each cost currency
  select and the markup reset action.
- The focused baseline passed: 9 test files and 130 tests.

### Phase 2: Semantic Controls and Tooltips

- Added a visually hidden Trip Cost `h1`, `h2` section headings, named desktop
  sections, and mobile tab/panel relationships with selection, roving focus,
  and Arrow/Home/End navigation.
- Replaced custom pointer-only group/card icon and color actions with native
  buttons. Migrated group reordering to the existing dnd-kit pointer and
  keyboard sensor pattern.
- Added programmatic labels for selectors, edit fields, exchange-rate fields,
  and cost-row controls. Replaced CostRow's custom checkbox and pointer-only
  inline editing/assignment triggers with named native controls.
- Added expanded state and controlled-region relationships to the child
  picker, split/type popovers, and rates disclosure. Separated the Frankfurter
  link from the disclosure button.
- Added approved shared Tooltips while retaining existing consumers and
  consolidating assigned-group descriptions.
- Updated affected component and responsive tests. No dependency, calculation,
  persistence, routing, or shared Tooltip implementation changes were made.

### Phase 3: Validation and Final Review

- Full-suite browser accessibility inspection exposed an unnamed CostRow
  reorder handle. Added the contextual name `Reorder <cost name>` and a
  regression assertion.
- Verified mobile tab switching, keyboard group reordering, inline editing,
  labels, disclosure states, and the separate rates-source link in the
  integrated browser.
- At 390x844, a new group-icon Tooltip appeared on focus and pointer hover,
  matched its trigger's `aria-describedby`, remained within the viewport, and
  did not overlap the trigger. The behavior was checked in light and dark
  themes. At 1280x900, all three desktop sections remained visible without tab
  semantics.
- Restored the browser app to a fresh trip after interaction testing.

## Validation

- Phase 1 focused baseline: 9 files, 130 tests passed.
- Phase 2 focused suite: 9 files, 141 tests passed; `npm run typecheck`
  passed; responsive tests passed (1 file, 4 tests); `git diff --check` passed.
- Final full suite after the CostRow reorder-name fix:
  `npm run test -- --run` passed (50 files, 485 tests).
- `npm run typecheck` passed.
- `npm run build` passed; Vite transformed 1,859 modules.
- Final `git diff --check` passed.
- The complete test suite includes the unchanged shared Tooltip touch-pointer
  test, which verifies that opening a Tooltip does not suppress its trigger
  action. No physical touch device was used.
- Browser accessibility-tree snapshots exposed the expected headings, labels,
  tab selection, disclosure states, and row-action names. These snapshots are
  supplemental evidence, not a substitute for a screen-reader check.

## Residuals and Decisions

- A partial Windows Narrator smoke check announced the Summary tab name, role,
  and position (“Summary tab item 3/3”); the selected-state announcement was
  inconclusive. Form-label, row-action, exchange-rate, and disclosure
  announcements were not checked. The user explicitly accepted these
  unverified checks as a validation limitation and descoped the remainder.
  This partial result is not represented as a complete screen-reader pass.
- The integrated browser driver did not dispatch a resize event after viewport
  changes, so browser checks explicitly dispatched the event before verifying
  responsive state.
- No product or architecture decision remains open.

## Final Result

All implementation work and automated/browser checks passed, with no new
dependencies or changes outside the Trip Cost accessibility scope. The plan is
recorded as complete with a validation limitation; run the screen-reader smoke
check in an environment where assistive-technology output can be observed
before claiming every acceptance criterion is verified.
