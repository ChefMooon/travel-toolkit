---
title: "Dismiss Open Tool Navigation Tooltip - Implementation Plan"
status: COMPLETED
current_phase: 1 / 1
created: 2026-09-30
last_updated: 2026-09-30
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 1 / 1
* **Summary of Outcome:** The tool-navigation tooltip stays hidden while the panel is open and does not reappear after selecting a tool or dismissing the panel. Trigger accessibility, normal toggling, and Escape focus restoration are preserved.
* **Final Validation:** `npm test -- --run src/components/Navbar/Navbar.test.tsx src/components/GridPanel/GridPanel.test.tsx src/components/Tooltip/Tooltip.test.tsx` passed (3 files, 18 tests); `npm run typecheck` and `git diff --check` passed. Browser checks confirmed tooltip absence after route navigation and outside dismissal.

# Specification & Overview

### 1. Scope & Objective
- **Goal:** Hide the tool-navigation tooltip after activation opens the navigation panel, rather than leaving a tooltip visible over the active control.
- **In-Scope:** The navigation trigger and its tooltip behavior in `src/components/Navbar/Navbar.tsx`, with regression coverage in `src/components/Navbar/Navbar.test.tsx`. Change the shared tooltip component only if required to implement the navigation-specific behavior safely.
- **Out-of-Scope:** Changes to other tooltip content or interaction behavior, navigation-panel functionality or appearance, and unrelated launcher or repository work.

### 2. Technical Constraints & Architecture
- `Navbar` chooses between `Open tool navigation` and `Close tool navigation` from `gridOpen`; it wraps the trigger in the shared `Tooltip`.
- The shared tooltip is shown while the trigger is hovered, focused, or touch-opened. Its visibility is not currently tied to the navigation panel state.
- `Navbar.test.tsx` currently expects the `Close tool navigation` tooltip to remain visible after the trigger opens the panel. Update that behavior assertion as part of the regression fix.
- Preserve the trigger's accessible name, `aria-expanded` state, menu toggle action, and existing touch activation behavior.
- **Assumption:** The tooltip should remain hidden while the navigation panel is open and should not reappear solely because the panel closes from navigation or outside dismissal. Existing tooltip behavior remains available on explicit hover or focus when closed. Do not introduce a repository-wide “dismiss every tooltip on click” behavior.
- **Risks:** A narrowly scoped change must account for hover, keyboard focus, and touch-triggered tooltip state so the tooltip does not remain visible while the panel is open. Avoid changing unrelated controls that share the Tooltip component.
- **Dependencies:** Existing React Testing Library and Vitest tests; no new package or service dependencies.
- **Open Decisions:** None. The implementation may choose the smallest safe mechanism consistent with the stated assumption.

---

# Execution Plan & Handoffs

## Phase 1: Dismiss the tooltip while navigation is open
- **Status:** COMPLETED
- **Objective:** Ensure activating the tool-navigation trigger opens the panel without leaving its tooltip visible, while preserving the trigger's accessible state and other tooltip behavior.

### Tasks
- [x] Update or add a regression case in `src/components/Navbar/Navbar.test.tsx` that shows the tooltip before activation, activates the trigger, and verifies the panel opens with the tooltip hidden.
- [x] Implement the narrowest suitable behavior in `src/components/Navbar/Navbar.tsx`; modify `src/components/Tooltip/Tooltip.tsx` only if the navigation-specific fix cannot be achieved safely at the Navbar integration point.
- [x] Avoid automatically returning focus to the trigger when the panel closes through tool navigation or outside dismissal, so its tooltip does not reopen; preserve the panel's Escape focus return.
- [x] If shared tooltip code changes, update `src/components/Tooltip/Tooltip.test.tsx` with coverage for the changed shared behavior, while preserving existing hover, keyboard, touch, Escape, and outside-pointer behavior.
- [x] Verify that the navigation trigger still reports “Close tool navigation” and `aria-expanded="true"` when the panel is open, and that the panel still toggles normally.

### Verification & Acceptance Criteria
*All criteria must pass before advancing to the handoff report.*
- [x] **Automated Checks:** Run `npm test -- --run src/components/Navbar/Navbar.test.tsx src/components/GridPanel/GridPanel.test.tsx src/components/Tooltip/Tooltip.test.tsx` and `npm run typecheck`.
- [x] **Functional Assertions:** After the trigger opens the navigation panel, the tooltip is absent even if the pointer remains over the trigger; the panel is open, the trigger has the close accessible name and expanded state, and normal trigger activation still works. After selecting a tool or dismissing the panel from outside, the tooltip stays absent. When closed, explicit hover/focus can still show the tooltip.
- [x] **Regression Assertions:** Existing touch activation and unrelated shared-tooltip interaction tests continue to pass.

### Plan Compliance Checklist
*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*
- [x] **Required Files:** Updated `src/components/Navbar/Navbar.tsx` and `src/components/Navbar/Navbar.test.tsx`; shared Tooltip files were not required.
- [x] **Boundaries:** No unrelated tooltips, navigation-panel behavior or styling, launcher work, dependencies, or unrelated files were modified.
- [x] **Legacy Code Removed:** No unrelated legacy code removal was required; the superseded expectation that the close tooltip remains visible was replaced.
- [x] **Acceptance Checks:** The automated commands, live route-navigation and outside-dismissal checks, and every functional and regression assertion above were run and passed.

### Phase 1 Handoff & Verification Report
*Filled out by the executing agent upon phase completion.*
- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
```text
$ npm test -- --run src/components/Navbar/Navbar.test.tsx src/components/GridPanel/GridPanel.test.tsx src/components/Tooltip/Tooltip.test.tsx
-> Test Files 3 passed (3); Tests 18 passed (18); exit code 0
$ npm run typecheck
-> tsc -b; exit code 0
$ git diff --check
-> exit code 0
```
- **Manual Verification:** On the local app, selected Currency Converter from the open navigation panel and confirmed no tooltip appeared after route change; reopened the panel, clicked the backdrop, and confirmed it closed without showing a tooltip.
- **Artifacts Created/Modified:**
  - `src/components/Navbar/Navbar.tsx` - Suppresses tooltip content while open and avoids refocusing the trigger on route/outside close.
  - `src/components/Navbar/Navbar.test.tsx` - Covers tooltip dismissal while open, navigation and backdrop close without reopening, accessibility state, and normal toggling.
  - `docs/plans/open-tool-navigation-tooltip/open-tool-navigation-tooltip-plan.md` - Records execution status, compliance, and validation.
- **Decisions & Deviations:** Live reproduction showed the `closeGrid` callback programmatically refocused the trigger on both route selection and outside dismissal, reopening the focus tooltip. Removed that unconditional refocus; `GridPanel` retains its explicit Escape focus return. Shared Tooltip behavior remains unchanged.
- **Next Phase Context:** None; this plan contains one implementation phase.
