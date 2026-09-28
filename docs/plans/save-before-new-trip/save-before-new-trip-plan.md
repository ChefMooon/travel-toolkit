---
title: "Save Before Starting a New Trip - Implementation Plan"
status: COMPLETED
current_phase: 3 / 3
created: 2026-09-28
last_updated: 2026-09-28
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 3 / 3
* **Summary of Outcome:** Added a safe save-before-new-trip flow, verified its
  cancellation and failure safeguards, and updated the user-flow specification.

# Specification & Overview

### 1. Scope & Objective

- **Goal:** Make it obvious how to preserve the current trip before starting a
  new one, and prevent the active trip from being cleared until that save has
  succeeded.
- **Recommended UX:** Add a consistently visible **Save & Start New Trip**
  action to the existing New Trip confirmation. It opens the existing Save Data
  Slots manager, where the user chooses an empty slot or explicitly confirms an
  overwrite. A successful save starts the new trip. Keep **Start Fresh Without
  Saving** as a separate, explicit destructive choice, plus **Cancel**.
- **In-Scope:** Save-first entry point, save completion/reset handoff, overwrite
  and save-failure handling, safe handling if the active trip is replaced while
  the manager is open, focused tests, and the related user-flow documentation.
- **Out-of-Scope:** Automatic saves or automatic slot selection, silent
  overwrites, changing the save-slot limit or persisted schema, redesigning
  import/export, and a second slot-selection implementation.

### 2. Technical Constraints & Architecture

- The active Trip Cost route renders `TripToolbar` through
  [`TripCostPage.tsx`](../../../src/features/trip/TripCostPage.tsx). The shared
  root renders `Navbar`; [`Topbar.tsx`](../../../src/components/Topbar/Topbar.tsx)
  is not used by this route and is outside this plan's implementation scope.
- [`TripToolbar.tsx`](../../../src/components/TripToolbar/TripToolbar.tsx)
  currently opens a destructive confirmation. Its **Update Save & Start Fresh**
  action is conditional on a related older save and writes directly to that
  slot; there is no save path in the dialog for a trip without that matching
  older save.
- [`SaveDataPanel.tsx`](../../../src/components/SaveDataPanel/SaveDataPanel.tsx)
  already supports saving to empty slots, confirming overwrites, and managing
  saved trips. Reuse it rather than building duplicate slot-selection or
  overwrite logic.
- [`saveSlotStore.ts`](../../../src/store/saveSlotStore.ts) returns a success
  value from `saveToSlot` and rejects duplicate trip IDs. Only a successful
  save of the intended active trip may trigger the reset.
- [`tripStore.ts`](../../../src/store/tripStore.ts) resets the active trip and
  generates a new trip ID. Keep that reset behind the existing explicit
  confirmation or the successful save completion.
- [`SITE-DESIGN-SPEC.md`](../../../docs/SITE-DESIGN-SPEC.md) currently
  documents New Trip as a destructive confirmation only; update its flow and
  error-state descriptions.

### 3. Assumptions, Risks & Decisions

- **Assumptions:** Save slots remain finite and user-selected. Existing
  overwrite confirmation and save-management actions remain authoritative.
- **Resolved decision — save experience:** The always-visible
  **Save & Start New Trip** action opens the existing full Save Data Slots
  manager; do not add a separate compact slot picker.
- **Resolved decision — successful save:** After the initiating trip is saved
  successfully, including a confirmed overwrite, close the manager, reset the
  current trip, and show one contextual success notification. Ordinary uses of
  Save Data Slots remain save-only.
- **Resolved decision — cancel or close:** If the manager is closed without
  saving, return to the New Trip decision with the current trip intact.
  Cancelling an overwrite confirmation keeps the user in Save Data Slots and
  does not reset the trip.
- **Resolved decision — continuation lifecycle:** Arm a one-shot
  save-and-start continuation only when the user chooses **Save & Start New
  Trip**. Clear it when the Save Data Slots manager closes, when the New Trip
  decision is cancelled, or before Load/Import replaces the active trip.
  Reopening Save Data Slots through its ordinary toolbar action is save-only.
  After closing the manager without saving, the user must explicitly choose
  **Save & Start New Trip** again to arm a new continuation. After Load/Import,
  a later reset requires a fresh explicit choice for the replacement trip.
- **Risk:** The full manager can load or import another trip. Those actions
  replace the active workspace and must cancel the pending save-and-start
  continuation before changing it; a later save must not unexpectedly clear
  the replacement trip.

---

# Execution Plan & Handoffs

## Phase 1: Supporting Safe Save Completion

- **Status:** COMPLETED
- **Objective:** Let the Save Data Slots manager report a successful save to a
  caller without changing its existing behavior for ordinary save management.
- **Dependencies:** None.

### Tasks

- [x] Add a typed, optional save-completion callback to
  [`SaveDataPanel.tsx`](../../../src/components/SaveDataPanel/SaveDataPanel.tsx).
  Call it only after `saveToSlot` succeeds, both for an empty slot and after an
  overwrite confirmation. Call it at most once for that save, and never after a
  rejected save or cancelled overwrite. Keep the existing regular-save
  notification when no continuation callback is supplied; allow the caller to
  provide one contextual success notification without producing duplicate
  toasts.
- [x] Add a continuation-cancel callback or equivalent guard for Load and
  Import actions that replace the active trip. Clear the pending
  save-and-start intent before applying either replacement. Keep the manager
  open after replacement, but do not let later saves in that manager complete
  the cancelled continuation.
- [x] Add `src/components/SaveDataPanel/SaveDataPanel.test.tsx` to cover
  successful empty-slot saves, confirmed and cancelled overwrites, failed saves,
  ordinary save-only behavior without a continuation callback, and workspace
  replacement while a continuation is pending followed by another save attempt.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:**
  `npm test -- --run src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts`
- [x] **Functional Assertions:** The completion callback runs exactly once only
  after a successful save, including a confirmed overwrite. A cancelled or
  rejected save does not invoke it. Loading or importing a different trip
  cancels the pending continuation before replacing active data. Ordinary
  Save Data Slots behavior remains unchanged when no callback is provided.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Modify
  [`SaveDataPanel.tsx`](../../../src/components/SaveDataPanel/SaveDataPanel.tsx);
  create
  `src/components/SaveDataPanel/SaveDataPanel.test.tsx`.
- [x] **Boundaries:** Do not change the persisted save-slot schema, slot count,
  import/export formats, or the existing `saveSlotStore` duplicate-ID guard.
  Do not add a second implementation of save or overwrite behavior.
- [x] **Legacy Code Removed:** None in this phase; preserve ordinary
  Save Data Slots actions and notifications.
- [x] **Acceptance Checks:** Run the targeted test command above and verify
  every save-success, overwrite-cancel, save-failure, and workspace-replacement
  assertion.

### Phase 1 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  ```text
  npm test -- --run src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts
  2 files passed; 17 tests passed.
  npm run typecheck — passed.
  git diff --check — passed.
  ```
- **Artifacts Created/Modified:** `src/components/SaveDataPanel/SaveDataPanel.tsx`;
  `src/components/SaveDataPanel/SaveDataPanel.test.tsx`.
- **Decisions & Deviations:** Added optional typed completion and continuation
  cancellation callbacks; ordinary save behavior remains unchanged.
- **Next Phase Context:** Phase 2 consumes the successful-save callback to
  reset only after saving the intended active trip.

---

## Phase 2: Exposing Save Before Reset in New Trip

- **Status:** COMPLETED
- **Objective:** Make saving a clear, available choice for every active trip and
  reset only after the intended trip has been saved successfully.
- **Dependencies:** Phase 1 provides the save-completion and
  continuation-cancellation behavior used by the toolbar.

### Tasks

- [x] Update [`TripToolbar.tsx`](../../../src/components/TripToolbar/TripToolbar.tsx)
  so the New Trip dialog always shows **Save & Start New Trip**, regardless of
  whether a related save already exists. Explain that saving opens Save Data
  Slots; label the destructive alternative **Start Fresh Without Saving** and
  retain **Cancel**.
- [x] Model the save-and-start intent as a one-shot continuation: arm it only
  from **Save & Start New Trip**, consume it before resetting after successful
  save, and clear it if the New Trip decision is cancelled or the manager is
  closed. Closing the manager returns to the New Trip decision; another attempt
  must be explicitly armed again. Opening Save Data Slots from the ordinary
  toolbar action must never inherit a continuation.
- [x] Make **Save & Start New Trip** open the existing Save Data Slots manager
  without leaving two competing dialogs open. On a successful save of the
  initiating trip, close the manager, reset the trip, and show one contextual
  success notification. Closing the manager without saving returns to the New
  Trip decision with the active trip intact; cancelling an overwrite keeps the
  user in Save Data Slots without resetting the trip.
- [x] Route updates to existing saved trips through the manager's overwrite
  confirmation instead of the current direct
  **Update Save & Start Fresh** write. Do not silently replace any saved slot.
- [x] Ensure a failed save, duplicate-ID rejection, or cancelled overwrite
  never resets the active trip. If Load or Import replaces that trip while the
  manager is open, cancel the pending reset continuation before applying the
  replacement; a later save attempt must not reset the replacement trip unless
  the user closes the manager and explicitly starts a new save-and-start flow.
- [x] Update
  [`TripToolbar.test.tsx`](../../../src/components/TripToolbar/TripToolbar.test.tsx)
  for the always-visible save action, empty and occupied slots, overwrite
  confirmation, duplicate-ID rejection when choosing a nonmatching slot,
  cancelled/failed saves, manager dismissal, workspace
  replacement followed by a later save attempt, the explicit no-save path,
  cancelling the New Trip dialog, exactly one contextual success notification,
  and ensuring a cancelled/closed continuation cannot be triggered by a later
  ordinary Save Data Slots action.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:**
  `npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts`
- [x] **Functional Assertions:** The save action is visible even when there is
  no related save. An empty-slot save or explicitly confirmed overwrite starts
  a new trip only after success and produces exactly one contextual success
  notification. Cancelling, closing, a failed save, or duplicate-ID rejection
  leaves active data untouched. **Start Fresh Without Saving** resets only after
  its explicit confirmation. Closing the manager or cancelling New Trip clears the
  one-shot continuation; ordinary Save Data Slots use remains save-only. A
  Load/Import replacement cannot be cleared by a later save under the
  cancelled intent. The full manager remains available for slot management.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Modify
  [`TripToolbar.tsx`](../../../src/components/TripToolbar/TripToolbar.tsx) and
  [`TripToolbar.test.tsx`](../../../src/components/TripToolbar/TripToolbar.test.tsx);
  integrate the callback from Phase 1 in
  [`SaveDataPanel.tsx`](../../../src/components/SaveDataPanel/SaveDataPanel.tsx).
- [x] **Boundaries:** Limit New Trip changes to the active `/trip` toolbar.
  Do not modify the inactive `Topbar` component, reset persistence behavior,
  or save-slot schema. Never reset on callback absence or save failure.
- [x] **Legacy Code Removed:** Remove the active toolbar's conditional
  direct-save handler and **Update Save & Start Fresh** path once the
  save-manager continuation replaces it; retain shared store helpers still
  used elsewhere.
- [x] **Acceptance Checks:** Run the targeted test command above and confirm
  there is no overlapping-dialog state, silent overwrite, or reset following
  cancellation or workspace replacement.

### Phase 2 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  ```text
  npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts
  3 files passed; 32 tests passed.
  npm run typecheck — passed.
  git diff --check — passed.
  ```
- **Artifacts Created/Modified:** `src/components/TripToolbar/TripToolbar.tsx`;
  `src/components/TripToolbar/TripToolbar.test.tsx`; integration with the
  Phase 1 callbacks in `SaveDataPanel.tsx`.
- **Decisions & Deviations:** The continuation is armed only by the explicit
  save-and-start action, and is cleared on manager close, New Trip cancel, or
  Load/Import. Direct toolbar saves were removed.
- **Next Phase Context:** Phase 3 documents the implemented flow and verifies
  its responsive and keyboard behavior.

---

## Phase 3: Documenting and Validating the User Flow

- **Status:** COMPLETED
- **Objective:** Keep the UI specification accurate and verify the complete
  save-before-new-trip journey and its safeguards.
- **Dependencies:** Phases 1 and 2 are complete and their user-visible behavior
  is stable.

### Tasks

- [x] Update
  [`SITE-DESIGN-SPEC.md`](../../../docs/SITE-DESIGN-SPEC.md) to describe the New Trip decision,
  Save Data Slots transition, empty-slot and overwrite paths, successful-save
  reset, cancellation and continuation re-arming behavior, Load/Import
  replacement behavior, and explicit no-save option.
- [x] Run the focused component and store tests, then the production build.
- [x] Manually verify the `/trip` flow at desktop and mobile widths, including
  keyboard navigation, manager dismissal, overwrite confirmation, successful
  save, save failure, and the no-save path.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:**
  `npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts`
  and `npm run build`.
- [x] **Functional Assertions:** The documented choices and transitions match
  the implementation. At desktop and mobile widths, users can identify the
  save path before resetting; keyboard focus remains within the active dialog;
  overwrite requires confirmation; and no cancelled or unsuccessful save
  clears the trip. Closing or cancelling an armed flow returns to a save-only
  state, and Load/Import replacement is not cleared by a later save unless the
  user explicitly starts a new save-and-start flow.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Update
  [`SITE-DESIGN-SPEC.md`](../../../docs/SITE-DESIGN-SPEC.md); retain and run
  [`TripToolbar.test.tsx`](../../../src/components/TripToolbar/TripToolbar.test.tsx),
  `src/components/SaveDataPanel/SaveDataPanel.test.tsx`, and
  [`saveSlotStore.test.ts`](../../../src/store/saveSlotStore.test.ts).
- [x] **Boundaries:** Documentation and verification must describe the
  implemented flow without introducing new product behavior or changing
  unrelated documentation.
- [x] **Legacy Code Removed:** Confirm the active toolbar no longer exposes
  the conditional direct-save path or stale destructive-only copy.
- [x] **Acceptance Checks:** Run all listed tests and the production build;
  complete the desktop/mobile interaction checks before marking this phase
  complete.

### Phase 3 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  ```text
  npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts
  3 files passed; 32 tests passed.
  npm run build — passed.
  Browser: passed at 1280x900 and 390x844; no horizontal overflow at either size.
  Keyboard: New Trip dialog tab cycle wrapped; manager retained focus after 30 Tab presses.
  Empty-slot save reset only after success and showed one contextual notification.
  Overwrite confirmation/cancellation, duplicate-ID rejection, manager dismissal,
  and explicit no-save reset were verified.
  ```
- **Artifacts Created/Modified:** `docs/SITE-DESIGN-SPEC.md`.
- **Decisions & Deviations:** Browser buttons required accessible-role Playwright
  clicks with force because standard click actionability timed out; keyboard
  focus was exercised with Tab. Temporary browser saves were cleared and the
  original empty trip was restored.
- **Next Phase Context:** All phases are complete; see the implementation report
  under `docs/reports`.
