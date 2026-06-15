# Blog Area Implementation Plan

## Purpose

Add a blog section to the existing routed web app without replacing the current SPA-style architecture.

This plan is intended for the current Cloudflare static deployment model and the TanStack Router app shell that already exists in the project.

## Current Context

- The app already uses route-based page structure under a shared shell.
- There is no project-owned backend or database.
- Existing content-heavy pages are already split into separate routes.
- Cloudflare static deployment means direct blog URLs must either fall back to the app shell or be prerendered.

## Recommendation

Build the blog as static, repo-owned content first.

That means:

- blog index route for post listings
- individual post routes for reading a post
- post content stored in the repository, most likely as Markdown
- shared site styling reused for article pages

This keeps the blog simple to maintain and matches the current architecture.

If you later want non-developer editing, scheduled publishing, or content managed outside the repo, move the content source to a headless CMS or another content pipeline.

## Proposed Shape

| Route | Purpose |
|---|---|
| `/blog` | Blog index with recent posts |
| `/blog/:slug` | Individual article page |

Optional later additions:

- `/blog/tag/:tag` for topic filtering
- RSS feed for subscriptions
- sitemap entries for blog discoverability

## Content Model

Use one source of truth for posts.

Recommended fields for each post:

- `title`
- `slug`
- `date`
- `summary`
- `tags`
- `draft` or `published`
- article body in Markdown

Recommended storage options, in order of simplicity:

1. Markdown files in the repo with frontmatter.
2. A typed content list plus Markdown bodies.
3. External CMS content if you later need a separate publishing workflow.

## Implementation Plan

1. Decide whether the blog should live as Markdown content in the repo or come from an external source.
2. Add the `/blog` route and the dynamic post route under the existing TanStack Router structure.
3. Create a post content loader that reads post metadata and body from the selected source.
4. Build a blog index page that sorts posts newest-first.
5. Build an article template with title, date, tags, and back navigation.
6. Reuse the existing site typography and layout rules so the blog feels part of the same product.
7. Make sure Cloudflare can resolve direct requests to blog URLs.
8. Add tests for post listing, missing-post handling, and route rendering.

## Deployment Notes

For a static Cloudflare deployment, the blog must work in one of these ways:

- SPA fallback to the app shell for direct route visits.
- Prerendered blog pages for every published post.

If the blog stays small and repo-owned, prerendering or SPA fallback is usually enough.

## When To Use This Plan

Use this plan when you want to:

- publish occasional site update posts
- keep content inside the same codebase
- avoid adding a separate backend just for writing posts
- keep deployment simple for Cloudflare static hosting

## When To Choose Something Else

Pick a different setup if you need any of the following:

- non-developer editing from a browser UI
- draft review and approval workflows
- scheduled publishing
- rich authoring tools beyond Markdown
- content managed outside deploys

In that case, a headless CMS or a separate content service is a better fit than keeping everything inside the SPA repository.

## Success Criteria

- The blog has stable public URLs.
- Posts can be added without changing the application architecture.
- The blog matches the rest of the site visually.
- Direct navigation to a blog URL works in Cloudflare deployment.
- The content workflow is clear enough that future updates do not require rediscovering the setup.