# Component Colocation Refactor

Migrate `src/components/` from a flat structure to the colocation pattern. Each component gets its own folder containing its `.tsx` file, its `.test.tsx` file (if one exists), and a barrel `index.ts` that re-exports the default. No import paths in the rest of the codebase need to change — TypeScript resolves `@/components/Topbar` to `@/components/Topbar/index.ts` automatically.

---

## Step 1 — Move each component into its own folder

For every component listed below, create a folder with the component's name inside `src/components/`, then move the `.tsx` and `.test.tsx` files into it.

Components that have both a `.tsx` and a `.test.tsx`:
- `BulkActionBar`
- `ColorChoiceModal`
- `CostLedger`
- `CostRow`
- `CostSummary`
- `CoupleCard`
- `EditRow`
- `GroupSetup`
- `IconChoiceModal`
- `MobileNav`
- `Modal`
- `RegionSelector`
- `ToastViewport`
- `Topbar`

Components that only have a `.tsx` (move that file only):
- `Logo`
- `SplitAssignmentModal`

---

## Step 2 — Create an `index.ts` barrel file in each new folder

Each `index.ts` must contain exactly one line:

```ts
export { default } from './ComponentName';
```

Apply this to all 16 component folders. Replace `ComponentName` with the actual component name in each case.

---

## Step 3 — Verify no imports are broken

Do not modify any import statements. Instead, confirm that all of the following files resolve correctly after the move:

- `src/App.tsx` imports `Topbar`, `GroupSetup`, `CostLedger`, `CostSummary`, `MobileNav`, `ToastViewport`
- `src/components/CostLedger/CostLedger.tsx` imports `CostRow`, `EditRow`, `BulkActionBar`, `Modal`
- `src/components/CostSummary/CostSummary.tsx` imports `RegionSelector`
- `src/components/GroupSetup/GroupSetup.tsx` imports `CoupleCard`, `Modal`
- Any other inter-component imports discovered during the move

If any import fails to resolve, the fix is to check that the folder name exactly matches the import path and that `index.ts` exists inside it.

---

## Step 4 — Run the test suite

```bash
npm test
```

All tests must pass before considering the refactor complete. No test file content should need to change — only file locations have moved.

---

## Step 5 — Confirm the final structure matches the target

After the move, `src/components/` should contain only folders (no loose `.tsx` or `.test.tsx` files at the top level). Each folder should contain exactly:

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx   ← only if a test existed before
└── index.ts
```

If any loose files remain at the top level of `src/components/`, the step 1 move is incomplete.
