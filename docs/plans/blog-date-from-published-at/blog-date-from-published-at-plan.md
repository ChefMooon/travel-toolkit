---
title: "Use publishedAt as the Blog's Sole Date Source - Implementation Plan"
status: COMPLETED
current_phase: 2 / 2
created: 2026-09-29
last_updated: 2026-09-29
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 2 / 2
* **Summary of Outcome:** Blog display dates now derive from the UTC calendar date in `publishedAt`; current posts and authoring guidance no longer require a separate `date` field.
* **Final Validation:** PASSED
* **Final Checks:** Focused blog tests -> 3 files and 48 tests passed; `npm run build` -> succeeded; `git diff --check` -> passed.

# Specification & Overview

### 1. Scope & Objective

- **Goal:** Remove the separate `date` field from blog post frontmatter and use
  the required `publishedAt` timestamp as the single source for both the
  machine-readable publication instant and the reader-visible calendar date.
  This prevents two metadata values for the same post from disagreeing.
- **In-Scope:**
  - Remove `date` from the `BlogPost` model and parser requirements.
  - Derive the visible date from the UTC calendar-date portion of
    `publishedAt`, preserving the existing `YYYY-MM-DD` display.
  - Update parser and route tests, both current blog posts, the README authoring
    guidance, and the `changelog-to-blog` skill.
  - Retain timestamp validation, timestamp-based ordering, and
    `publishedAt` as each `<time>` element's `dateTime`.
- **Out-of-Scope:**
  - Changing publication timestamps, their UTC format, or post ordering.
  - Renaming posts, changing filename-derived slugs, or changing the existing
    filename date-prefix convention.
  - Displaying publication times, localizing dates to a reader's timezone,
    changing article content, tags, routes, or Markdown rendering.
  - Rewriting completed historical plans that describe the previous contract.

### 2. Technical Constraints & Architecture

- `src/lib/blogPosts.ts` defines `BlogPost`, validates Markdown frontmatter,
  and sorts posts by `publishedAt`. It currently also requires `date` and
  returns it as an independent model property.
- `src/routes/blog.index.tsx` and
  `src/features/blog/BlogArticlePage.tsx` display `post.date` while setting
  each `<time>` element's `dateTime` to `post.publishedAt`.
- Parser and route coverage lives in `src/lib/blogPosts.test.ts`,
  `src/routes/blog.index.test.tsx`, and `src/routes/blog.$slug.test.tsx`.
- Both existing posts in `src/content/blog/` provide both fields. The
  `changelog-to-blog` skill and README also document blog authoring metadata.
- The `publishedAt` contract is a validated UTC timestamp in canonical
  `YYYY-MM-DDTHH:mm:ssZ` form. Derive the displayed date from its UTC date
  portion; do not convert through local time, which can shift the displayed
  calendar day for some viewers.
- Displayed dates will follow the publication timestamp's UTC date even when
  it differs from a release date. Preserve release-date filename prefixes as
  currently documented; do not silently change filenames as part of this work.
- **Open Decisions:** None. The requested single-source behavior implies that
  `publishedAt` determines the displayed calendar date.

---

# Execution Plan & Handoffs

## Phase 1: Derive Blog Display Dates from publishedAt

- **Status:** COMPLETED
- **Objective:** Remove the independent date property from the parsed blog
  model and use the UTC date portion of `publishedAt` consistently in both
  blog views.
- **Dependencies:** None.

### Tasks

- [x] Update `src/lib/blogPosts.ts` to remove `date` from `BlogPost`, stop
  requiring or validating the frontmatter `date`, and provide a shared,
  UTC-safe way for the blog views to obtain the `YYYY-MM-DD` display date from
  the already validated `publishedAt`.
- [x] Update `src/routes/blog.index.tsx` and
  `src/features/blog/BlogArticlePage.tsx` to display the derived date while
  retaining `post.publishedAt` for the `<time dateTime>` value.
- [x] Update `src/lib/blogPosts.test.ts` to omit `date` from canonical
  fixtures and expected model values, verify a post without `date` parses, and
  keep coverage for invalid `publishedAt` dates/times and timestamp ordering.
- [x] Update `src/routes/blog.index.test.tsx` and
  `src/routes/blog.$slug.test.tsx` to assert the visible UTC calendar date and
  unchanged timestamp `dateTime` value.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** Run
  `npm test -- --run src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx'`
  and `npm run build`.
- [x] **Functional Assertions:** A valid post parses without a `date`
  frontmatter field; the returned `BlogPost` no longer carries an independent
  `date`; both views show the UTC `YYYY-MM-DD` part of `publishedAt` and retain
  the complete timestamp in `dateTime`; ordering and existing blog behavior
  remain unchanged.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Modify `src/lib/blogPosts.ts`,
  `src/lib/blogPosts.test.ts`, `src/routes/blog.index.tsx`,
  `src/routes/blog.index.test.tsx`,
  `src/features/blog/BlogArticlePage.tsx`, and
  `src/routes/blog.$slug.test.tsx`.
- [x] **Boundaries:** Do not change post ordering, publication timestamp
  validation, routes, links, tags, content, or timestamp `dateTime` metadata.
  Do not add local-time conversion or duplicate date-conversion logic across
  the two views.
- [x] **Legacy Code Removed:** Remove the required frontmatter `date`
  contract, `BlogPost.date`, and display reads of `post.date`; preserve
  `publishedAt` as the sole publication-date source.
- [x] **Acceptance Checks:** Run the focused blog tests and production build;
  verify no blog display path or parser contract depends on `date`.

### Phase 1 Handoff & Verification Report

*Filled out by the executing agent upon phase completion.*

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  - `npm test -- --run src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx'` -> 3 test files and 48 tests passed.
  - `npm run build` -> TypeScript build and Vite production build succeeded.
  - Source search for `post.date` and `metadata.date` in `src/` -> no matches.
- **Artifacts Created/Modified:**
  - `src/lib/blogPosts.ts` - Removed `BlogPost.date` and its parser requirement; added a shared UTC date extractor.
  - `src/lib/blogPosts.test.ts` - Updated metadata, legacy-date, timestamp, and ordering coverage.
  - `src/routes/blog.index.tsx` - Displays the UTC date derived from `publishedAt`.
  - `src/routes/blog.index.test.tsx` - Asserts visible UTC date and full timestamp metadata.
  - `src/features/blog/BlogArticlePage.tsx` - Displays the UTC date derived from `publishedAt`.
  - `src/routes/blog.$slug.test.tsx` - Asserts visible UTC date and full timestamp metadata.
- **Decisions & Deviations:** None.
- **Next Phase Context:** Existing Markdown posts still contain their legacy `date` frontmatter until Phase 2. Remove that field from all current posts, then update README and `changelog-to-blog` authoring guidance without changing timestamps, filenames, slugs, or article content.

---

## Phase 2: Migrate Blog Content and Authoring Guidance

- **Status:** COMPLETED
- **Objective:** Remove the redundant field from existing posts and make the
  maintained authoring instructions describe the single-source contract.
- **Dependencies:** Phase 1 is complete.

### Tasks

- [x] Remove `date` from the frontmatter of every Markdown post in
  `src/content/blog/`, preserving each `publishedAt`, filename, title,
  summary, tags, and article body.
- [x] Update `README.md`'s Blog Content and Publishing instructions and example
  to require canonical `publishedAt` instead of a separate calendar `date`.
- [x] Update `.github/skills/changelog-to-blog/SKILL.md`'s frontmatter example,
  field requirements, and date-display guidance to omit `date` and use the UTC
  calendar date in `publishedAt`; retain the established release-date filename
  prefix guidance.
- [x] Leave `docs/plans/blog-published-at/blog-published-at-plan.md` and other
  completed historical plans unchanged as records of the prior decision.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** Run
  `npm test -- --run src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx'`,
  `npm run build`, and `git diff --check`.
- [x] **Functional Assertions:** Every current post parses with
  `publishedAt` and no `date`; both current posts retain their existing
  publication timestamps and filename-derived slugs; README and skill
  guidance no longer describe `date` as required frontmatter.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete.
Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** Modify all `src/content/blog/*.md` posts,
  `README.md`, and `.github/skills/changelog-to-blog/SKILL.md`.
- [x] **Boundaries:** Do not alter timestamps, filenames, slugs, summaries,
  tags, article bodies, or the scope of the completed historical plans.
- [x] **Legacy Code Removed:** Remove `date` frontmatter from all published
  posts and remove authoring instructions and examples that require it.
- [x] **Acceptance Checks:** Run the focused blog tests, production build, and
  whitespace check; inspect all published post frontmatter and current
  authoring guidance for the final contract.

### Phase 2 Handoff & Verification Report

*Filled out by the executing agent upon phase completion.*

- **Compliance Check:** PASSED
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  - `npm test -- --run src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx'` -> 3 test files and 48 tests passed.
  - `npm run build` -> TypeScript build and Vite production build succeeded.
  - `git diff --check` -> passed.
  - Search for `date:` in all current blog posts, `README.md`, and `.github/skills/changelog-to-blog/SKILL.md` -> no frontmatter/example matches.
  - Inspected both post frontmatters and diff: timestamps remain `2026-09-29T09:00:00Z` and `2026-09-29T12:00:00Z`; filenames, slugs, summaries, tags, and article bodies are unchanged.
- **Artifacts Created/Modified:**
  - `src/content/blog/2026-09-29-introducing-the-travel-toolkit-blog.md` - Removed redundant `date` frontmatter.
  - `src/content/blog/2026-09-29-travel-toolkit-1-3-0-release-notes.md` - Removed redundant `date` frontmatter.
  - `README.md` - Documents canonical `publishedAt` and its visible UTC calendar date.
  - `.github/skills/changelog-to-blog/SKILL.md` - Updated the example, contract, and date-display guidance while retaining release-date filename prefixes.
- **Decisions & Deviations:** None. Historical plans remain unchanged.
- **Next Phase Context:** All planned phases are complete; proceed to final implementation validation.
