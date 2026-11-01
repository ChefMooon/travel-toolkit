# Content and Project Structure

This reference is for people maintaining Travel Toolkit content and source files.

## Blog Content and Publishing

Published posts are Markdown files in `src/content/blog/`. Each filename must be a unique kebab-case slug, using lowercase letters and numbers separated by single hyphens. For example, `introducing-the-travel-toolkit-blog.md` is available at `/blog/introducing-the-travel-toolkit-blog`.

Add a `.md` file with YAML frontmatter containing a non-empty `title`, a canonical UTC `publishedAt` timestamp in `YYYY-MM-DDTHH:mm:ssZ` format, a non-empty `summary`, and one or more `tags` written as lowercase letters and numbers separated by single hyphens. The visible calendar date comes from the UTC date in `publishedAt`; a separate `date` field is not needed. Write the article body in Markdown after the closing frontmatter delimiter:

```md
---
title: "A sample article"
publishedAt: "2026-09-29T09:00:00Z"
summary: "A concise description of the article."
tags:
  - travel-planning
  - changelog
---

Write the article body in Markdown.
```

Every Markdown file in `src/content/blog/` is included in the built app and is public. Keep unpublished drafts outside this directory and off the deployment branch. To publish a post, add the file, run `npm run build`, then deploy with `wrangler deploy`; the post becomes available after deployment.

## Project Structure

```text
src/
  content/blog/    Published Markdown blog posts
  routes/          File-based route entry points
  features/        Tool-specific modules, including countdown, currency, forecast, timezone, and units
  components/      Shared UI and trip-cost components
  store/           Persisted and ephemeral Zustand stores
  lib/             Shared helpers, tool metadata, and core calculations
docs/
  ARCHITECTURE.md       Technical architecture reference
  CONTENT-AND-STRUCTURE.md Blog content and project structure guidance
  Travel Toolkit PRD.md Product requirements document
  SITE-DESIGN-SPEC.md   UI and design system reference
  STYLE-GUIDE.md        Recurring CSS patterns and tool-card styling
```

For route responsibilities and runtime behavior, see [Architecture](ARCHITECTURE.md). For visual design and recurring CSS patterns, see the [Site Design Specification](SITE-DESIGN-SPEC.md) and [Style Guide](STYLE-GUIDE.md).
