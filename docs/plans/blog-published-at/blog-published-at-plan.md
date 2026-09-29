---
title: "Add UTC Publication Timestamps to the Blog - Implementation Plan"
status: COMPLETED
current_phase: 2 / 2
created: 2026-09-29
last_updated: 2026-09-29
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 2 / 2
* **Summary of Outcome:** Blog posts now require validated UTC publication timestamps, sort newest-first by publication instant, and expose that timestamp as machine-readable metadata while preserving the visible date.
* **Final Validation Checks:**
  - `npm test -- --run src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx'` - PASSED (3 files, 50 tests).
  - `npm run build` - PASSED (TypeScript and Vite production build).
  - `git diff --check` - PASSED.
* **Remaining Issues:** None.

# Specification & Overview

### 1. Scope & Objective

- **Goal:** Give every blog post a required UTC `publishedAt` timestamp and use
  it to order posts newest-first, so posts published on the same date appear in
  their actual publication order.
- **In-Scope:**
  - Add and validate the required `publishedAt` frontmatter field.
  - Sort posts by the instant represented by `publishedAt`, newest first, with
    the existing slug order retained as a deterministic tie-breaker.
  - Keep `date` as the date displayed to readers; expose `publishedAt` as the
    machine-readable value on the blog's `<time>` elements.
  - Add timestamps to all existing blog posts and update the
    `changelog-to-blog` skill so future posts supply one.
  - Test parsing, ordering, and both blog routes.
- **Out-of-Scope:**
  - Displaying the publication time to readers or localizing timestamps.
  - Changing date-prefixed filenames, post tags, or release-date conventions.
  - Deriving publication times from file metadata, Git history, or the current
    time.

### 2. Technical Constraints & Architecture

- `src/lib/blogPosts.ts` defines `BlogPost`, parses YAML frontmatter, and sorts
  loaded posts. It currently validates `date` as `YYYY-MM-DD` and sorts by that
  date with the slug as a tie-breaker.
- `src/routes/blog.index.tsx` and
  `src/features/blog/BlogArticlePage.tsx` display `post.date` in `<time>`
  elements. Keep that visible date unchanged and use `publishedAt` for the
  elements' machine-readable `dateTime` value.
- `src/lib/blogPosts.test.ts` covers parser validation, bundled posts, and
  newest-first ordering. Route-level metadata assertions are in
  `src/routes/blog.index.test.tsx` and `src/routes/blog.$slug.test.tsx`.
- The `changelog-to-blog` skill at
  `.github/skills/changelog-to-blog/SKILL.md` creates release posts from
  `CHANGELOG.md`, which supplies a release date but not a release time.
- **Chosen contract:** Every post must include a UTC ISO 8601 timestamp ending
  in `Z`, using the canonical `YYYY-MM-DDTHH:mm:ssZ` form. `date` remains a
  separate display date. Posts sort by the parsed `publishedAt` instant in
  descending order; identical instants sort by slug ascending.
- **Timestamp decision:** The owner authorized assigning general UTC publication
  times and specified that the release notes must follow the introduction
  post. Use `09:00:00Z` for the introduction post and `12:00:00Z` for the
  release notes, both on 2026-09-29.

---

# Execution Plan & Handoffs

## Phase 1: Establish the Timestamp Contract

- **Status:** COMPLETED
- **Objective:** Require and validate UTC `publishedAt` metadata, update all
  current posts, and make the post-creation skill follow the new contract.
- **Dependencies:** Owner-authorized general UTC publication times for every
  existing post.

### Tasks

- [x] Obtain the owner's authorization to use general UTC publication times
  for every existing Markdown post in `src/content/blog/`, keeping the release
  notes after the introduction post. Use `09:00:00Z` for the introduction and
  `12:00:00Z` for the release notes on 2026-09-29.
- [x] Extend `BlogPost` and `parseBlogPost` in `src/lib/blogPosts.ts` to require
  `publishedAt` and validate the canonical
  `YYYY-MM-DDTHH:mm:ssZ` form, including real calendar dates and valid time
  components.
- [x] Add `publishedAt` to every existing post in `src/content/blog/` while
  preserving its current `date`, title, summary, tags, and body.
- [x] Update parser tests in `src/lib/blogPosts.test.ts` for valid values,
  missing values, malformed timestamps, impossible dates/times, and timestamps
  without the required UTC `Z` suffix.
- [x] Update `.github/skills/changelog-to-blog/SKILL.md` to require a
  `publishedAt` value for generated posts and to ask for the UTC publication
  time when the changelog does not provide one. Keep its date-only `date`
  frontmatter and date-prefixed filename guidance.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** Run
  `npm test -- --run src/lib/blogPosts.test.ts`.
- [x] **Functional Assertions:** All current posts parse with their owner-authorized
  timestamps; omitting `publishedAt` or providing a non-canonical or invalid
  timestamp produces an actionable invalid-post error; `date` remains
  independently available as a date-only value.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Modify `src/lib/blogPosts.ts`,
  `src/lib/blogPosts.test.ts`, every existing `src/content/blog/*.md` post, and
  `.github/skills/changelog-to-blog/SKILL.md`.
- [x] **Boundaries:** Do not change blog rendering or ordering in this phase;
  do not change visible dates, filenames, tags, or post bodies.
- [x] **Legacy Code Removed:** Date-only frontmatter is no longer accepted as
  complete post metadata; retain the separate `date` field for display.
- [x] **Acceptance Checks:** Run the phase verification command and confirm all
  assertions against the implementation and content diff.

### Phase 1 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
```bash
  $ npm test -- --run src/lib/blogPosts.test.ts -> Test Files 1 passed (1); Tests 43 passed (43).
```
- **Artifacts Created/Modified:**
* `src/lib/blogPosts.ts` - Added the required canonical UTC `publishedAt` parser contract.
* `src/lib/blogPosts.test.ts` - Added parser validation cases for required, malformed, and invalid timestamps.
* `src/content/blog/2026-09-29-introducing-the-travel-toolkit-blog.md` - Added the owner-authorized 09:00 UTC timestamp.
* `src/content/blog/2026-09-29-travel-toolkit-1-3-0-release-notes.md` - Added the owner-authorized 12:00 UTC timestamp.
* `.github/skills/changelog-to-blog/SKILL.md` - Required the timestamp and instructed asking when the changelog omits a time.
* `docs/plans/blog-published-at/blog-published-at-plan.md` - Recorded the timestamp decision and phase execution.
- **Decisions & Deviations:** The owner authorized general UTC publication times and required the release notes to follow the introduction post; selected `09:00:00Z` for the introduction and `12:00:00Z` for the release notes on 2026-09-29.
- **Next Phase Context:** `BlogPost` parsing now exposes validated `publishedAt` on every post. Phase 2 can use it for sorting and `<time datetime>` values while retaining `date` for visible display.

---

## Phase 2: Sort and Render by Publication Timestamp

- **Status:** COMPLETED
- **Objective:** Use `publishedAt` for deterministic newest-first ordering and
  machine-readable publication metadata while preserving the date shown to
  readers.
- **Dependencies:** Phase 1 is complete and every post has a validated
  `publishedAt` value.

### Tasks

- [x] Update the comparator in `src/lib/blogPosts.ts` to compare parsed
  `publishedAt` instants descending and retain ascending slug order for exact
  timestamp ties.
- [x] Update sorting tests in `src/lib/blogPosts.test.ts` to cover different
  times on the same date, timestamps spanning dates, and equal timestamps.
- [x] Update the `<time>` elements in `src/routes/blog.index.tsx` and
  `src/features/blog/BlogArticlePage.tsx` to use `post.publishedAt` for
  `dateTime` while continuing to display `post.date`.
- [x] Update metadata assertions in `src/routes/blog.index.test.tsx` and
  `src/routes/blog.$slug.test.tsx` to verify the visible date stays date-only
  and the machine-readable value is the timestamp.
- [x] Verify the blog index presents posts in timestamp order and existing
  links, tag filters, and article rendering remain unchanged.

### Verification & Acceptance Criteria

- [x] **Automated Checks:** Run
  `npm test -- --run src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx'`
  and `npm run build`.
- [x] **Functional Assertions:** Posts sort by publication instant, newest
  first; equal timestamps use slug order; both routes display the unchanged
  `date` and expose `publishedAt` in the `<time datetime>` attribute.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Modify `src/lib/blogPosts.ts`,
  `src/lib/blogPosts.test.ts`, `src/routes/blog.index.tsx`,
  `src/routes/blog.index.test.tsx`, `src/features/blog/BlogArticlePage.tsx`,
  and `src/routes/blog.$slug.test.tsx`.
- [x] **Boundaries:** Do not render a new visible time, change date display
  formatting, alter route structure, or regenerate route definitions manually.
- [x] **Legacy Code Removed:** Remove date-only ordering and date-only
  `<time datetime>` metadata as the ordering/machine-readable source; retain
  `date` as the visible calendar date.
- [x] **Acceptance Checks:** Run the focused tests and production build and
  verify the resulting order and `<time>` values.

### Phase 2 Handoff & Verification Report

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
```bash
  $ npm test -- --run src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx' -> Test Files 3 passed (3); Tests 50 passed (50).
  $ npm run build -> TypeScript build and Vite production build passed.
```
- **Artifacts Created/Modified:**
* `src/lib/blogPosts.ts` - Sorts by parsed publication timestamp and retains slug order for exact ties.
* `src/lib/blogPosts.test.ts` - Covers same-day time ordering, cross-date order, and timestamp ties.
* `src/routes/blog.index.tsx` - Keeps the visible date and uses `publishedAt` for `dateTime`.
* `src/routes/blog.index.test.tsx` - Verifies ordered titles and timestamp metadata while preserving tag-navigation coverage.
* `src/features/blog/BlogArticlePage.tsx` - Keeps the visible date and uses `publishedAt` for `dateTime`.
* `src/routes/blog.$slug.test.tsx` - Verifies article metadata and existing article behavior.
* `docs/plans/blog-published-at/blog-published-at-plan.md` - Recorded phase completion and validation.
- **Decisions & Deviations:** No plan deviations. Route tests were made specific to each post and to a unique announcement tag because multiple posts share a display date and the timestamp ordering changes which post appears first.
- **Next Phase Context:** Implementation phases are complete; the plan is ready for final validation.
