---
title: "New Trip Save Status - Implementation Plan"
status: COMPLETED
current_phase: 2 / 2
created: 2026-09-28
last_updated: 2026-09-28
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 2 / 2
* **Summary of Outcome:** Both phases and final validation passed. The New Trip
  dialog reports the active trip's save status and hides the redundant save
  action when the snapshot is already saved.
* **Final Validation:** Focused tests passed (3 files, 39 tests);
  `npm run build` passed; `git diff --check` passed. Desktop/mobile status and
  action states, keyboard focus containment, and no-horizontal-overflow checks
  passed.

# Specification & Overview

### 1. Scope & Objective

- **Goal:** Give users an accurate account of whether the active trip is saved
  before they choose how to start a new trip, and avoid presenting a
  save-and-start action when the active trip already matches a saved slot.
- **In-Scope:** Determine the active trip's save status from its snapshot and
  saved slots; show a status message in the New Trip dialog; conditionally
  present and label the dialog actions based on that status; update focused
  tests and the relevant user-flow documentation.
- **Out-of-Scope:** Changing save-slot persistence, schema or slot count;
  changing the existing save manager or overwrite-confirmation behavior;
  automatic saves; changing the one-shot save continuation; changing the
  inactive `Topbar` flow.
- **Resolved UX Decision:** If the active snapshot exactly matches a saved
  slot, hide **Save & Start New Trip** and label the reset action **Start New
  Trip**. If the current snapshot is not already saved, retain
  **Save & Start New Trip** and **Start Fresh Without Saving**.
- **Status States:**
  - An exact snapshot match identifies the saved slot and indicates there are
    no unsaved changes.
  - A same-trip-ID saved snapshot that differs from the active snapshot
    indicates unsaved changes and identifies the last saved slot.
  - If no saved slot belongs to the active trip, indicate that the trip has
    not been saved to a slot; include unsaved-change context when applicable.

### 2. Technical Constraints & Architecture

- The active Trip Cost route uses `TripToolbar`; limit UI behavior changes to
  this route. `Topbar` is inactive for this route.
- `TripToolbar` uses the shared `Modal`, whose secondary action is optional.
  Conditional visibility and labels should use the existing dialog API where
  possible.
- `SaveDataPanel` compares the active snapshot to slot snapshots for its saved
  status. `saveSlotStore` also exports `findRelatedOlderSlotIndex` to identify
  an older snapshot with the same trip ID. Reuse or extract existing
  comparison logic rather than adding an inconsistent comparison.
- `tripStore` persists the active trip data but not `isDirty`. Do not use
  `isDirty` alone as proof that the trip has or has not been saved. An exact
  snapshot comparison is authoritative for the unchanged-saved state.
- Preserve the existing successful-save continuation, explicit no-save reset,
  cancellation behavior, duplicate-trip-ID guard, and overwrite confirmation.

### 3. Assumptions, Risks & Decisions

- **Decision:** When the active snapshot is exactly saved, the save-and-start
  action is redundant and hidden. The primary reset action is relabeled
  **Start New Trip** because the current trip is already saved.
- **Assumption:** A same-trip-ID slot whose data differs from the active
  snapshot is the relevant prior saved copy to identify in the status message.
- **Risk:** A status derived only from `isDirty` can be wrong after reload
  because that flag is not persisted. Use snapshot comparison and test the
  saved, changed, and absent-slot states.
- **Risk:** Conditional actions and extra status copy may change dialog height
  and the keyboard/screen-reader experience; validate desktop and mobile
  layouts and accessible dialog content.
- **Source:** User-approved follow-up to the save-before-new-trip UX review,
  informed by the existing flow in
  [`save-before-new-trip-plan.md`](../save-before-new-trip/save-before-new-trip-plan.md)
  and repository inspection.

---

# Execution Plan & Handoffs

## Phase 1: Deriving Reliable Active-Trip Save Status

- **Status:** COMPLETED
- **Objective:** Determine whether the active snapshot is already saved, differs
  from a prior saved copy, or has no saved slot, using repository-consistent
  comparison logic.
- **Dependencies:** None.

### Tasks

- [x] Inspect and reuse or extract the snapshot comparison used by
  `SaveDataPanel` and the same-trip-ID lookup in `saveSlotStore`; avoid a
  second, divergent comparison implementation.
- [x] Derive status from the current trip snapshot and slot state. Treat an
  exact snapshot match as saved with no unsaved changes; identify a differing
  same-ID snapshot as the last saved copy; distinguish a trip with no saved
  slot. Use `isDirty` only as supplementary context, not as the authority for
  whether an identical saved snapshot exists.
- [x] Ensure the status shown when the New Trip dialog opens reflects the
  current active snapshot and slot contents, rather than a stale status from a
  previous dialog opening.
- [x] Add focused tests for the status states, including an exact saved match,
  a changed active snapshot with an older same-ID save, and a trip with no
  saved slot. Include a case where the snapshot matches despite `isDirty`
  being true, if supported by the current store/test patterns.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:**
  `npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/store/saveSlotStore.test.ts`
- [x] **Functional Assertions:** Status reflects exact snapshot equality and
  same-trip-ID prior-save data. It remains correct after opening the dialog
  following trip or slot updates and does not rely on the non-persisted dirty
  flag to claim a saved snapshot is absent or present.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Update `TripToolbar.tsx` and its focused tests;
  update `saveSlotStore.ts` or its tests only if comparison logic is
  intentionally extracted or extended.
- [x] **Boundaries:** Do not change persisted trip/save-slot schemas, slot
  count, import/export behavior, overwrite behavior, or the active route's
  reset lifecycle.
- [x] **Legacy Code Removed:** Remove any duplicated status-comparison logic
  introduced by this phase if a shared comparison helper replaces it.
- [x] **Acceptance Checks:** Run the focused test command above and verify all
  saved, changed, and never-saved status cases.

### Phase 1 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  ```text
  npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/store/saveSlotStore.test.ts
  2 files passed; 31 tests passed.
  git diff --check — passed.
  ```
- **Artifacts Created/Modified:** `src/store/saveSlotStore.ts`;
  `src/store/saveSlotStore.test.ts`; `src/components/TripToolbar/TripToolbar.tsx`;
  `src/components/TripToolbar/TripToolbar.test.tsx`.
- **Decisions & Deviations:** Reused `findRelatedOlderSlotIndex` and its
  snapshot comparison to distinguish an exact matching saved trip from a
  prior same-ID version. The toolbar captures status from the latest snapshot
  when opening the dialog. No schema or persistence behavior changed.
- **Next Phase Context:** The dialog now has status copy for saved, changed,
  and never-saved trips. Phase 2 conditionally hides or relabels actions for an
  exact saved snapshot and validates the complete flow.

---

## Phase 2: Adapting New Trip Dialog Copy and Actions

- **Status:** COMPLETED
- **Objective:** Show the verified save status and present only the relevant
  save/reset choices while preserving the existing safe continuation behavior.
- **Dependencies:** Phase 1 status logic and tests are complete.

### Tasks

- [x] Update the New Trip dialog in `TripToolbar.tsx` to display concise,
  understandable status copy:
  - For an exact saved snapshot, identify the slot and say there are no
    unsaved changes.
  - For changed data with an older same-ID save, state that there are unsaved
    changes and identify the last saved slot.
  - For a trip without a saved slot, state that it has not been saved; include
    the unsaved-change context when applicable.
- [x] When the active snapshot exactly matches a saved slot, hide
  **Save & Start New Trip** and label the reset action **Start New Trip**.
  Keep **Cancel**.
- [x] When the active snapshot is not already saved, retain
  **Save & Start New Trip**, **Start Fresh Without Saving**, and **Cancel**.
  Saving must continue to use the full Save Data Slots manager and its
  overwrite confirmation.
- [x] Preserve the existing one-shot continuation behavior: successful saves
  may reset only after the save succeeds; cancelling, closing, duplicate-ID
  rejection, or save failure must not reset the active trip.
- [x] Update `TripToolbar.test.tsx` to cover conditional action visibility and
  labels, all status-copy states, cancellation, and unchanged save/reset
  behavior.
- [x] Update the New Trip flow in `docs/SITE-DESIGN-SPEC.md` to document the
  status-dependent message and action labels.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:**
  `npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts`
  and `npm run build`.
- [x] **Functional Assertions:** An unchanged saved trip shows its saved slot
  and no-unsaved-changes status, hides **Save & Start New Trip**, and offers
  **Start New Trip** plus **Cancel**. Changed or never-saved data shows
  appropriate status copy and retains both save-first and explicit no-save
  choices. Existing save, overwrite, cancellation, failure, and reset
  safeguards remain intact.
- [x] **Manual Checks:** At desktop and mobile widths, verify status readability,
  action layout, keyboard focus behavior, and accessible dialog content.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Modify `TripToolbar.tsx` and
  `TripToolbar.test.tsx`; update `docs/SITE-DESIGN-SPEC.md` to match the
  implemented flow.
- [x] **Boundaries:** Limit UI changes to the active `/trip` toolbar. Preserve
  save-slot storage, manager behavior, one-shot continuations, and all
  successful-save and explicit no-save guards.
- [x] **Legacy Code Removed:** Remove or replace the fixed New Trip body and
  unconditional action labels where they conflict with the status-dependent
  dialog; do not leave stale copy in the active flow.
- [x] **Acceptance Checks:** Run the listed tests and production build, then
  complete desktop/mobile and keyboard checks.

### Phase 2 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  ```text
  npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts
  3 files passed; 39 tests passed.
  npm run build — passed.
  git diff --check — passed.
  Browser: saved, changed-since-save, and no-saved-slot states verified.
  At 390x844, the dialog fit within the viewport, had no horizontal overflow,
  and retained keyboard focus within the dialog.
  ```
- **Artifacts Created/Modified:** `src/components/TripToolbar/TripToolbar.tsx`;
  `src/components/TripToolbar/TripToolbar.test.tsx`;
  `src/store/saveSlotStore.ts`; `src/store/saveSlotStore.test.ts`;
  `docs/SITE-DESIGN-SPEC.md`.
- **Decisions & Deviations:** When an exact saved snapshot exists, the redundant
  save action is hidden and the reset action is labeled **Start New Trip**.
  The temporary browser save was cleared; the original active trip ID/name,
  empty slots, and 1280x900 viewport were restored.
- **Next Phase Context:** Both implementation phases and their focused
  validation are complete. Ready for Helm Implementation Final Validation.
