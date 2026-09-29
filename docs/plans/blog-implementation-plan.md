---
title: "Blog Area - Implementation Plan"
status: COMPLETED
current_phase: 3 / 3
created: 2026-09-29
last_updated: 2026-09-29
---

# Overall Plan Completion Status

* **Final State:** COMPLETED
* **Total Phases Completed:** 3 / 3
* **Summary of Outcome:** All three phases, acceptance criteria, and required final checks passed. The static Markdown content pipeline, accessible blog routes and tag filtering, README publishing workflow, and Cloudflare SPA deep links are complete. No in-scope requirement remains open.
* **Final Validation Evidence:**
  - `npm run test -- --run src/integration.test.tsx src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx' src/components/Footer/Footer.test.tsx src/lib/routeTitles.test.ts` -> 6 files passed; 78 tests passed.
  - `npm run build` -> passed; main chunk 442.00 kB and lazy article/Markdown chunk 119.66 kB, with no >500 kB warning.
  - `npm exec --yes --package=wrangler -- wrangler dev --config wrangler.toml --ip 127.0.0.1 --port 8788` -> Cloudflare Workers Assets preview passed. Direct requests for `/blog`, `/blog/introducing-the-travel-toolkit-blog`, and `/blog/not-a-published-post` returned the SPA app shell; browser checks rendered the expected index and article, and the unknown slug rendered the existing Page Not Found view.
  - `git diff --check` -> passed. Final diff review confirmed the changed files match the planned blog work and its documentation; `wrangler.toml` and unrelated runtime configuration are unchanged.
* **Remaining Risks / Issues:** Phase 1 noted existing dependency-tree advisories involving `xlsx`/`seroval`; these were not introduced or remediated by this work and were not independently audited as part of the blog plan. This non-blocking pre-existing risk does not affect the validated blog scope.

# Specification & Overview

### 1. Scope & Objective

- **Goal:** Add a small, public blog for articles and changelogs, with stable post URLs and tag-based filtering.
- **In-Scope:**
  - Store post content as Markdown files in the repository, with frontmatter for title, publication date, summary, and tags.
  - Publish one concise introductory post explaining why the blog exists and that it will be used for articles and changelogs.
  - Provide a `/blog` index and a `/blog/$slug` article route.
  - Sort posts newest-first and let readers filter by tag.
  - Keep the active tag in the URL query string so filtered lists can be bookmarked and shared.
  - Use the existing application shell, responsive styling, navigation, route-title handling, and Cloudflare deployment.
  - Provide accessible filter controls, useful empty states, and tests for content, filtering, and routes.
- **Out-of-Scope:**
  - A CMS, authoring dashboard, database, authentication, editorial workflow, or scheduled publishing.
  - Private drafts: Markdown files included in the app are public content. Keep unpublished writing outside the published content directory and deployment branch.
  - RSS, sitemap generation, search, pagination, comments, and social sharing.
  - Prerendering/SSG or a separate SEO platform. The current SPA fallback must support direct URLs; crawler and social-preview guarantees are not part of this phase.
  - Inventing product claims or promising a publishing cadence in the introductory post. The blog must still render correctly with no published posts.
- **Success Criteria:**
  - Readers can open `/blog`, open a published post at its stable slug URL, and return to the list.
  - The initial published post introduces the blog and accurately describes its intended use for articles and changelogs.
  - Tag controls show matching posts, expose the active tag in the URL, and support clearing the filter.
  - A `Blog` link in the shared footer provides the only site navigation entry point to the blog.
  - Direct requests to blog URLs load the app and resolve to the correct route in the Cloudflare deployment model.
  - Invalid post content is reported clearly; unknown post slugs do not render as successful articles.
  - Blog pages work on mobile and desktop, are keyboard accessible, and match the existing site styling.
  - A contributor can add a post by following the documented content format and rebuilding/deploying the app.

### 2. Technical Constraints & Architecture

- The app uses React, Vite, and file-based TanStack Router routes under `src/routes/`, rendered within the shared root shell.
- `src/routeTree.gen.ts` is generated; use the repository's supported route-generation workflow and do not edit it by hand.
- Cloudflare serves the built assets from `dist` and has `not_found_handling = "single-page-application"` in `wrangler.toml`. Verify direct-route behavior; change deployment configuration only if that check fails.
- There is no blog CMS or blog-specific backend. The content source is the repository and adding a post requires a deploy.
- `package.json` currently has no Markdown or frontmatter parser. Select only browser/Vite-compatible parsing and rendering dependencies that are necessary; do not add a CMS or server dependency.
- Markdown rendering must not enable raw HTML or use `dangerouslySetInnerHTML`. Preserve safe link handling.
- Derive the route slug from each Markdown filename. Require a unique kebab-case slug, a title, an ISO `YYYY-MM-DD` date, a summary, and at least one normalized kebab-case tag.
- Sort by publication date descending, with slug as a deterministic tie-breaker. Tag matching is exact on normalized tag values.
- Keep the active tag in `/blog?tag=<tag>`. An unknown tag shows the no-results state with a clear-filter action; it must not break route rendering.
- Keep route/document titles consistent with the existing root analytics/title bridge. Article titles come from post metadata and must not be overwritten with the generic app title.
- **Navigation decision:** Put a `Blog` link in the shared footer only. Do not add a header/navbar link, a homepage CTA, or a tool-grid card. Preserve the footer's existing visibility behavior on each route and viewport.
- Match existing project formatting and test conventions. Run focused Vitest tests and the production build.

#### Published Post Authoring Contract

Each published post is a Markdown file named with a unique kebab-case slug under `src/content/blog/`. Its frontmatter requires a title, an ISO `YYYY-MM-DD` date, a summary, and one or more normalized kebab-case tags; the Markdown body follows the closing delimiter.

```md
---
title: "A sample article"
date: "2026-09-29"
summary: "A concise description of the article."
tags:
  - travel-planning
  - changelog
---

Write the article body in Markdown.
```

---

# Execution Plan & Handoffs

## Phase 1: Establish the Markdown Content Pipeline

- **Status:** COMPLETED
- **Objective:** Define and test the published-post contract, load Markdown content from the repository, and render Markdown safely.

### Tasks

- [x] Define a single post metadata/body contract and authoring example in the plan: required title, ISO date, summary, one or more normalized tags, filename-derived slug, and Markdown body.
- [x] Add the repository-owned published-content location and a typed loader that bundles posts at build time; do not fetch content from a runtime service.
- [x] Select and add only the Markdown/frontmatter dependencies required by the Vite client build; verify browser compatibility before adopting them.
- [x] Validate required metadata, date format, slug format/uniqueness, and tag format with actionable error messages.
- [x] Exclude any unpublished writing by keeping it outside the bundled published-content directory; do not rely on hiding drafts in the UI.
- [x] Add `src/content/blog/introducing-the-travel-toolkit-blog.md` as the initial published post. Explain that the blog is a new place for Travel Toolkit articles and changelogs, what readers can expect to find there, and avoid unsupported product claims or a promised publishing schedule. Use the required frontmatter, a publication date matching the actual launch, and relevant normalized tags.
- [x] Render Markdown without raw HTML or unsafe HTML injection and preserve safe link behavior.
- [x] Add loader/rendering tests for the initial post, other valid posts, malformed metadata, duplicate slugs, date ordering, empty content, and representative Markdown.

### Verification & Acceptance Criteria

*All criteria must pass before advancing to the handoff report.*

- [x] **Automated Checks:** `npm run test -- --run src/lib/blogPosts.test.ts`
- [x] **Automated Checks:** `npm run build`
- [x] **Functional Assertions:** Valid posts produce typed metadata and rendered Markdown; dates sort newest-first with a stable tie-breaker.
- [x] **Functional Assertions:** The introductory post has the required metadata, is treated as published, and explains the blog's purpose without asserting an unconfirmed cadence.
- [x] **Functional Assertions:** Missing/invalid required metadata, duplicate slugs, invalid dates, and malformed tags produce descriptive failures rather than silently disappearing.
- [x] **Functional Assertions:** No raw HTML from Markdown is rendered as executable markup; an empty published-post collection is valid.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** `src/content/blog/introducing-the-travel-toolkit-blog.md`; `src/lib/blogPosts.ts` and `src/lib/blogPosts.test.ts`; `package.json` and `package-lock.json` only if selected parser/renderer dependencies are required.
- [x] **Boundaries:** Do not add a CMS, API, database, draft UI, or runtime content fetch. Do not enable raw Markdown HTML or use `dangerouslySetInnerHTML`. Keep metadata and parsing logic in the planned content module rather than duplicating it in routes.
- [x] **Legacy Code Removed:** None planned; no existing content path should be replaced.
- [x] **Acceptance Checks:** Confirm the focused test command and production build above were actually run.

### Phase 1 Handoff & Verification Report

*Filled out by the executing agent upon phase completion.*

- **Compliance Check:** PASSED — Required content, loader, tests, and dependency files are present. Diff review confirmed parsing/metadata validation remain centralized, Markdown is rendered without raw HTML injection, and no CMS, draft UI, runtime fetch, or legacy-path replacement was introduced.
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  - `npm run test -- --run src/lib/blogPosts.test.ts` -> 1 test file passed; 32 tests passed.
  - `npm run build` -> TypeScript project build and Vite production build passed (1,859 modules transformed).
- **Artifacts Created/Modified:**
  - `src/content/blog/introducing-the-travel-toolkit-blog.md` — initial published post with launch-date frontmatter.
  - `src/lib/blogPosts.ts` — typed static content loader and metadata validation/sorting.
  - `src/lib/blogPosts.test.ts` — loader and renderer tests.
  - `src/components/BlogMarkdown.tsx` — reusable safe Markdown renderer.
  - `package.json`, `package-lock.json` — `react-markdown` and `yaml` dependencies.
- **Decisions & Deviations:** Used browser-compatible `react-markdown` (without raw-HTML plugins) and `yaml`; Vite production build verified client bundling. No scope deviations. The implementation agent noted audit advisories in existing `xlsx`/`seroval` dependencies; these were not changed in this phase.
- **Next Phase Context:** Phase 2 consumes the validated post loader and uses its filename-derived slug, normalized tags, and published-post collection.

---

## Phase 2: Build Blog Routes, Listing, and Tag Filtering

- **Status:** COMPLETED
- **Objective:** Deliver the public index and article experience within the existing app shell, including shareable tag filtering.

### Tasks

- [x] Add the `/blog` index route and `/blog/$slug` detail route using the repository's file-based TanStack Router conventions.
- [x] Regenerate the route tree using the supported project workflow; never hand-edit generated route output.
- [x] Build a newest-first post list with title, date, summary, and tag links/controls.
- [x] Implement tag filtering through the typed `tag` search parameter; support all posts, active filter, clear filter, and unknown-tag/no-results states.
- [x] Build the article template with title, publication date, tags, Markdown body, and a link back to the blog index.
- [x] Add a `Blog` link to the shared footer using its existing link styling; do not add another blog entry point to the navbar, homepage intro, or tool grid.
- [x] Integrate article-specific document titles with the root title/analytics behavior; set the blog index title and article title from the relevant route/post.
- [x] Add responsive styles using existing site conventions and accessible filter semantics, focus states, and result/empty-state messaging.
- [x] Add route/component tests for listing, filtering, query-string navigation, article rendering, unknown slugs, and footer navigation.

### Verification & Acceptance Criteria

- [x] **Automated Checks:** `npm run test -- --run src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx' src/components/Footer/Footer.test.tsx src/lib/routeTitles.test.ts`
- [x] **Automated Checks:** `npm run build`
- [x] **Functional Assertions:** `/blog` lists published posts newest-first; `/blog/$slug` renders the matching post and returns not-found for unknown slugs.
- [x] **Functional Assertions:** Selecting a tag updates the query string, filters to posts with that exact normalized tag, survives reload/back-forward navigation, and can be cleared.
- [x] **Functional Assertions:** Unknown tags and an empty post collection show an understandable empty state with a way back to all posts.
- [x] **Functional Assertions:** Blog links and controls are keyboard-operable, expose accessible names/state, and article titles are not replaced by the root generic title.
- [x] **Functional Assertions:** The shared footer is the only site navigation entry point to `/blog`, and its existing route/viewport visibility behavior is unchanged.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** `src/routes/blog.index.tsx`, `src/routes/blog.$slug.tsx`, generated `src/routeTree.gen.ts`, `src/components/Footer/Footer.tsx` and its test, `src/lib/routeTitles.ts` and its test, `src/index.css`, and route/component tests.
- [x] **Boundaries:** Keep blog pages within the existing shared shell. Add the blog link to the footer only; do not add navbar, homepage-intro, or tool-grid links, create a separate site shell, or add a tag-specific route when the query parameter covers filtering. Do not change footer visibility rules.
- [x] **Legacy Code Removed:** None planned. Preserve existing footer links, route behavior, and title tracking.
- [x] **Acceptance Checks:** Confirm the focused route/footer/title tests and production build above were actually run.

### Phase 2 Handoff & Verification Report

*Filled out by the executing agent upon phase completion.*

- **Compliance Check:** PASSED — Required route, generated tree, shared footer, title, style, and test files are present. Diff review confirmed the blog is within the shared shell, the footer is the only site navigation entry point added, existing footer visibility/links and root title tracking are preserved, and filtering uses a query parameter rather than a new route.
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  - `npm exec -- tsr generate` -> generated route tree; no manual edit to `src/routeTree.gen.ts`.
  - `npm run test -- --run src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx' src/components/Footer/Footer.test.tsx src/lib/routeTitles.test.ts` -> 4 files passed; 16 tests passed.
  - `npm run build` -> passed; main chunk is 442.00 kB, lazy article/Markdown chunk is 119.66 kB, and no >500 kB warning remains.
- **Artifacts Created/Modified:**
  - `src/routes/blog.index.tsx`, `src/routes/blog.$slug.tsx`, `src/routeTree.gen.ts` — blog index/article routes and generated route registration.
  - `src/features/blog/BlogArticlePage.tsx`, `src/features/blog/index.ts` — lazily loaded article view to keep Markdown rendering out of the initial bundle.
  - `src/components/BlogTagLinks.tsx`, `src/components/Footer/Footer.tsx`, `src/components/Footer/Footer.test.tsx` — reusable accessible tag links and the single footer entry.
  - `src/lib/routeTitles.ts`, `src/lib/routeTitles.test.ts` — route titles for the index, article, and unknown slugs.
  - `src/routes/blog.index.test.tsx`, `src/routes/blog.$slug.test.tsx`, `src/index.css` — route coverage and responsive/accessibility styling.
- **Decisions & Deviations:** Used existing TanStack Router `lazyRouteComponent` pattern for the article view after the first build showed an oversized main chunk; lazy loading removed the warning. Route generation emitted non-blocking notices for colocated test files. No scope deviations.
- **Next Phase Context:** Phase 3 verifies end-to-end behavior and documents how to add posts; it should preserve the generated routes and query-string filter contract.

---

## Phase 3: Verify Cloudflare Deep Links and Document Publishing

- **Status:** COMPLETED
- **Objective:** Confirm built/deployed route behavior and leave a repeatable, accurate workflow for adding articles and changelogs.

### Tasks

- [x] Add the blog routes and Markdown authoring requirements to the README's route/content documentation, including an example frontmatter block and the deploy-to-publish workflow.
- [x] Extend integration coverage for navigation from the shared shell to the index and from an index entry to its article.
- [x] Build and preview the app, then verify direct requests to `/blog`, `/blog/introducing-the-travel-toolkit-blog`, and an unknown post URL resolve through the current Cloudflare SPA fallback.
- [x] Verify the unknown-slug route displays the existing not-found experience on direct navigation.
- [x] Change `wrangler.toml` only if the direct-route smoke test demonstrates that the current fallback is insufficient; document any necessary deviation.
- [x] Review the final diff against all phase boundaries and ensure no CMS, secrets, private drafts, or unrelated files were introduced.

### Verification & Acceptance Criteria

- [x] **Automated Checks:** `npm run test -- --run src/integration.test.tsx src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx' src/components/Footer/Footer.test.tsx src/lib/routeTitles.test.ts`
- [x] **Automated Checks:** `npm run build`
- [x] **Functional Assertions:** In a local Cloudflare preview using the built assets, direct visits to `/blog`, `/blog/introducing-the-travel-toolkit-blog`, and an unknown post URL render the expected list, introductory article, and not-found states.
- [x] **Functional Assertions:** README authoring instructions agree with the implemented parser, required fields, tag format, and deployment behavior.
- [x] **Functional Assertions:** `wrangler.toml` remains unchanged if its current SPA fallback passes the smoke test; any change is justified by observed behavior.

### Plan Compliance Checklist

*Verify each item against the actual diff before claiming this phase complete. Do not mark the phase COMPLETED if any item fails.*

- [x] **Required Files:** `README.md` and `src/integration.test.tsx`; `wrangler.toml` only if a verified deployment issue requires a configuration change.
- [x] **Boundaries:** Do not add prerendering, RSS, sitemap generation, a CMS, or unrelated deployment changes. Do not invent real launch-post copy.
- [x] **Legacy Code Removed:** None planned; existing Cloudflare behavior and unrelated documentation must remain unchanged.
- [x] **Acceptance Checks:** Confirm focused tests, production build, direct-route preview checks, and final-diff compliance review were actually completed.

### Phase 3 Handoff & Verification Report

*Filled out by the executing agent upon phase completion.*

- **Compliance Check:** PASSED — README and integration coverage are present. Final diff review found no CMS, prerendering, RSS, sitemap, secrets, private drafts, or unrelated deployment changes. `wrangler.toml` and its existing SPA fallback are unchanged.
- **Verification Result:** PASSED
- **Execution Proof / Logs:**
  - `npm run test -- --run src/integration.test.tsx src/lib/blogPosts.test.ts src/routes/blog.index.test.tsx 'src/routes/blog.$slug.test.tsx' src/components/Footer/Footer.test.tsx src/lib/routeTitles.test.ts` -> 6 files passed; 78 tests passed.
  - `npm run build` -> passed; main chunk 442.00 kB and lazy article/Markdown chunk 119.66 kB, with no >500 kB warning.
  - `npm exec --yes --package=wrangler -- wrangler dev --config wrangler.toml --ip 127.0.0.1 --port 8788` -> local Workers assets preview ready. Direct requests to `/blog`, `/blog/introducing-the-travel-toolkit-blog`, and `/blog/not-a-published-post` each returned HTTP 200 with the app shell; Wrangler logs confirmed use of `not_found_handling`.
  - Browser smoke checks in the preview rendered the blog index and introductory article with their expected titles/content; the unknown post displayed the existing Page Not Found view and title.
  - `git diff --check` -> passed.
- **Artifacts Created/Modified:**
  - `README.md` — route table and post authoring/publication instructions.
  - `src/integration.test.tsx` — footer-to-index and index-to-article navigation coverage.
  - `wrangler.toml` — unchanged; existing Workers Assets SPA fallback passed direct-route verification.
- **Decisions & Deviations:** Wrangler was not installed in the project or on PATH, so the preview used an ephemeral `wrangler` package via `npm exec` without changing dependencies. Used `wrangler dev` with the repository's Workers Assets configuration (rather than a Pages-only preview command). The fallback passed; no deployment configuration changes were needed.
- **Next Phase Context:** None; implementation and final validation are complete.