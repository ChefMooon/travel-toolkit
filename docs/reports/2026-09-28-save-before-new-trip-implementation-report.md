# Save Before Starting a New Trip - Implementation Report

**Date:** 2026-09-28
**Final status:** COMPLETED

## Goal and Scope

Make saving the active trip an always-available choice before starting a new
trip. Reuse Save Data Slots for slot selection and overwrite confirmation, and
reset only after a successful save of the intended trip or the explicit
no-save confirmation. Preserve the active trip on cancellation and save
failure, and cancel a pending reset if Load or Import replaces the workspace.

The persisted save-slot schema, slot limit, import/export formats, and inactive
`Topbar` route were unchanged. The implementation plan is
[save-before-new-trip-plan.md](../plans/save-before-new-trip/save-before-new-trip-plan.md).

## Plan and Execution

The three phases ran sequentially. Each phase was validated before the next
started; no phases ran in parallel.

1. Add safe save-completion and continuation-cancellation callbacks.
2. Expose save-before-reset in the active Trip Cost toolbar.
3. Document and validate the responsive user flow.

One general-purpose subagent implemented the phases in sequential assignments;
the primary session coordinated the order, independently reran the focused
tests, and performed browser verification. No model override was supplied.
The agent runtime did not expose model identifiers, so exact same-model
identity could not be independently verified.

## Changes by Phase

### Phase 1: Supporting Safe Save Completion

- Added optional, typed save-completion and continuation-cancellation
  callbacks to [SaveDataPanel.tsx](../../src/components/SaveDataPanel/SaveDataPanel.tsx).
- Successful empty-slot saves and confirmed overwrites report completion once.
  Ordinary Save Data Slots use retains its existing success notification.
- Load and successful Import cancel the pending continuation before replacing
  the active trip; later saves in that manager do not resume it.
- Added [SaveDataPanel.test.tsx](../../src/components/SaveDataPanel/SaveDataPanel.test.tsx)
  for successful saves, cancelled overwrites, failures, ordinary save behavior,
  and Load/Import cancellation.

### Phase 2: Exposing Save Before Reset in New Trip

- Updated [TripToolbar.tsx](../../src/components/TripToolbar/TripToolbar.tsx)
  to always offer **Save & Start New Trip**, plus **Start Fresh Without Saving**
  and **Cancel**.
- Routed save-and-start through the existing Save Data Slots manager. A
  one-shot continuation resets only after successful save; the manager closes
  and a single contextual notification is shown.
- Closing the manager returns to the New Trip decision. Cancelling that
  decision clears the continuation. Load/Import replacement also clears it,
  and ordinary toolbar Save Data Slots use stays save-only.
- Removed the toolbar's direct-save path; existing slots require the manager's
  overwrite confirmation.
- Expanded [TripToolbar.test.tsx](../../src/components/TripToolbar/TripToolbar.test.tsx)
  for success, cancellation, duplicate IDs, failure, overwrites, dialog
  lifecycle, and workspace replacement.

### Phase 3: Documenting and Validating the User Flow

- Updated [SITE-DESIGN-SPEC.md](../SITE-DESIGN-SPEC.md) with the New Trip
  decision, empty-slot and overwrite paths, successful-save reset, cancellation
  and re-arming, Load/Import replacement, explicit no-save path, and error
  states.
- Verified the desktop and mobile layouts and the primary save/reset,
  overwrite-cancel, duplicate-ID failure, manager dismissal, no-save, and
  keyboard-focus paths in the browser.
- Restored the original empty active trip and cleared the temporary test saves.

## Validation

- **Phase 1:** `npm test -- --run src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts` passed (2 files, 17 tests). `npm run typecheck` and `git diff --check` passed.
- **Phase 2:** `npm test -- --run src/components/TripToolbar/TripToolbar.test.tsx src/components/SaveDataPanel/SaveDataPanel.test.tsx src/store/saveSlotStore.test.ts` passed (3 files, 32 tests). `npm run typecheck` and `git diff --check` passed.
- **Phase 3 and final rerun:** The same focused test command passed (3 files, 32 tests); `npm run build` passed, including `tsc -b` and Vite production build; `git diff --check` passed.
- **Browser:** At 1280x900 and 390x844 there was no horizontal overflow. At 390x844, the Save Data Slots dialog measured 362px wide within the viewport and the New Trip dialog measured approximately 309px wide. Tab navigation wrapped within the New Trip dialog; focus remained within Save Data Slots after 30 Tab presses.
- **Save success:** Saving the initial trip to an empty slot produced one contextual success notification and changed the active trip ID only after the save.
- **Overwrite and failure:** The occupied-slot overwrite confirmation appeared; cancelling it kept the manager open and the active trip intact. Saving a loaded trip with a duplicate ID to another empty slot showed the duplicate-ID error, kept the manager open, and left the active trip unchanged.
- **No-save and cancellation:** The explicit **Start Fresh Without Saving** choice reset the trip. Closing an armed manager returned to the New Trip decision; cancelling that decision cleared the continuation. Opening and closing Save Data Slots from the ordinary toolbar remained save-only.

The integrated browser's ordinary click action timed out while controls were
being stabilized, so accessible-role Playwright clicks were used for pointer
actions. Keyboard checks used Tab navigation.

## Residuals and Decisions

- No product or architecture decision remains open.
- The existing save-slot duplicate-ID guard and overwrite confirmation remain
  authoritative; no alternate slot-selection or overwrite implementation was
  introduced.
- The toolbar continuation remains one-shot and explicitly re-armed after
  cancellation or workspace replacement.

## Final Result

All three planned phases are complete. Focused component and store tests,
typecheck, production build, and desktop/mobile browser checks passed. The plan
status and phase handoffs are recorded in
[save-before-new-trip-plan.md](../plans/save-before-new-trip/save-before-new-trip-plan.md).
