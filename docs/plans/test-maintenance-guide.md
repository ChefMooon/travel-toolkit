# Test Maintenance Guide

## Objective
Define a repeatable process for maintaining and adding tests in MKT so quality stays high as features evolve.

## Project Testing Stack
- Test runner: Vitest
- DOM environment: jsdom
- UI assertions: React Testing Library + jest-dom
- Setup file: `vitest.setup.ts`
- Main config: `vitest.config.ts`

## Test Taxonomy
Use these levels consistently:

1. Unit tests
- Smallest behavior-focused tests
- Pure logic (`src/lib/*.test.ts`) and isolated components (`src/components/*.test.tsx`)

2. Integration tests
- Multi-component/store workflows in `src/integration.test.tsx`
- Assert real user flows and state transitions

3. Regression tests
- Add when bugs are fixed
- Include issue context in test name or a short comment near the case

## Naming Conventions

### Files
- Co-locate tests with source where possible
- Use `<Component>.test.tsx` for components
- Use `<module>.test.ts` for logic modules

### Test IDs
- Frontend component tests: `FE-<AREA>-<NNN>`
  - Example: `FE-EDT-009`
- Calculation tests: `CALC-<AREA>-<NNN>`
  - Example: `CALC-SUM-007`

### Describe/it structure
- `describe('<Component or module>')`
- `it('<TEST-ID> concise behavior statement', () => { ... })`

## When Adding a New Feature
Follow this workflow in order:

1. Identify affected layers
- UI component(s)
- Store action/state
- Calculation logic
- Integration flow

2. Add/update tests in this order
- Pure logic tests first (if rules changed)
- Component tests second
- Integration tests third for end-to-end confidence

3. Run focused tests
- `npm run test -- --run path/to/file.test.tsx`

4. Run full suite
- `npm run test -- --run`

5. Update docs
- Add or update coverage rows in `docs/plans/frontend-test-matrix.md`
- If scope was broad, append notes in `docs/plans/frontend-test-implementation-report.md`

## Component Test Patterns (Project Standard)

### Store-backed components
- Mock `useTripStore` with `vi.mock('@/store/tripStore', ...)`
- Drive selectors via a shared `mockStoreState` object
- Reset mocks in `beforeEach`

### Pure presentational components
- Pass callback props directly
- Assert render + callback invocation

### Modal and portal behavior
- Assert open/close triggers from user events
- Cover confirm, cancel, and backdrop paths

### Form components
- Validate both success and blocked-save scenarios
- Cover invalid values, empty required fields, and edge transitions

## Integration Test Patterns
- Use `src/integration.test.tsx` for cross-component behavior
- Prefer realistic state transitions over implementation details
- Verify side effects that matter to users:
  - localStorage persistence
  - reset behavior
  - summary updates after edits

## Accessibility Baseline
Every new interactive UI component should include at least:
- Semantic role assertions where relevant (`button`, `dialog`, etc.)
- Keyboard interaction coverage (Enter/Escape/Tab as applicable)
- Label coverage (`aria-label` or associated `<label>`)

## Responsive Testing Guidance
When behavior differs by breakpoint, add tests that:
- Set viewport/matchMedia conditions in test setup
- Assert mobile-only and desktop-only UI affordances
- Avoid brittle CSS snapshots; focus on behavior and visible structure

## Bugfix Policy
For every production bug fix:
1. Add a failing test that reproduces the bug
2. Implement the fix
3. Ensure the new test passes
4. Run full suite to catch regressions

## PR Readiness Checklist
- New behavior has at least one test
- Existing tests updated for changed behavior
- No flaky assertions (timeouts, unstable selectors)
- Full suite passes locally
- Matrix doc updated if coverage changed materially

## Useful Commands
```sh
# Run all tests once
npm run test -- --run

# Run a single test file
npm run test -- --run src/components/EditRow.test.tsx

# Run integration suite only
npm run test -- --run src/integration.test.tsx
```

## Suggested Next Improvements
1. Add coverage reporting (`@vitest/coverage-v8`) and track thresholds
2. Add dedicated accessibility suite for modal focus and keyboard flows
3. Add responsive behavior suite for key breakpoints
