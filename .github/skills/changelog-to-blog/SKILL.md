---
name: changelog-to-blog
description: 'Create a reader-friendly release blog post from the newest dated CHANGELOG.md entry in this repository. Use after updating the changelog or when asked for a release announcement or changelog blog post.'
---

# Changelog to Blog Post

Turn the latest released changelog entry into a blog post for Travel Toolkit.
Keep the post grounded in the changelog and follow the blog content format used
by this repository.

## When to Use

Use this skill after a changelog entry has been created, or when asked to write
a release announcement, release notes, or a changelog blog post.

## Workflow

1. Read the newest dated version entry in `CHANGELOG.md`. Use its exact version,
   date, and user-visible changes as the source of truth. Do not edit the
   changelog. If there is no dated release entry, ask which release to cover.
   Use an explicitly provided publication time if available. Otherwise, obtain
   the current UTC date and time when preparing the post (for example, with
   `(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')` in
   PowerShell). Do not guess the current time.
2. Review the existing Markdown files in `src/content/blog/` for tone and
   check that a post for this version does not already exist. Do not overwrite
   an existing post; ask whether to update it or use another filename.
3. Write for Travel Toolkit users in plain, approachable language. Lead with
   the most useful change and explain what readers can do or notice, where to
   find it when known, and why it helps. Group related changes and give major
   features room for a short explanation or practical example. Avoid generic
   claims about polish or consistency when a concrete change can be described.
   Omit internal implementation details and do not copy changelog bullets
   verbatim. The changelog defines the release scope; consult the relevant UI or
   documentation for factual context when needed, but do not invent behavior,
   benefits, or release claims that the available evidence does not support.
   Briefly group minor refinements or omit them when they add little for readers.
4. Create a Markdown file in `src/content/blog/` named
   `YYYY-MM-DD-travel-toolkit-MAJOR-MINOR-PATCH-release-notes.md`, using the
   release date from the changelog and replacing the version dots with hyphens
   (for example, `2026-09-29-travel-toolkit-1-3-0-release-notes.md`). Prefix
   every blog post filename with its publication or release date in
   `YYYY-MM-DD` format so the folder sorts chronologically.
5. Use the blog's required YAML frontmatter:

   ```yaml
   ---
   title: "What's New in Travel Toolkit 1.3.0"
   publishedAt: "2026-09-29T12:00:00Z"
   summary: "A concise summary of the release for the blog index."
   tags:
     - changelog
   ---
   ```

   Set `publishedAt` to the explicitly provided publication time, converted to
   UTC if necessary, or the current UTC time obtained in step 1. Use canonical
   `YYYY-MM-DDTHH:mm:ssZ` format. The displayed calendar date is the UTC date
   portion of `publishedAt`; the filename's release-date prefix remains based
   on the changelog date. Keep the filename-derived slug lowercase kebab-case
   and unique. The only allowed tags are `announcement` and `changelog`; use
   `changelog` for release posts. Do not add topic tags.
6. Match the length and format to the release: a small update can use a short
   opening and a few bullets, while a larger one can use descriptive section
   headings and short paragraphs. Prefer headings that say what changed. Write
   a specific summary for the index without repeating it in the opening. The
   article page already displays the post title, the UTC calendar date from
   `publishedAt`, summary, and tags, so do not repeat the title as a top-level
   heading in the body. Before saving, check that readers can understand what
   changed and why it matters, that wording is specific and not repetitive,
   and that each claim is supported by the available evidence.
7. If the user requested a draft only, show it without writing the file.
   Otherwise, create the post and report its path and the validation performed.
8. Validate the post with the focused blog parser test:

   ```powershell
   npm test -- --run src/lib/blogPosts.test.ts
   ```

   The test imports all blog Markdown files and checks the repository's
   frontmatter parsing. If it fails, fix the post's metadata or filename and
   rerun the test.

## Blog Content Contract

Blog posts are Markdown files under `src/content/blog/`. Required frontmatter
fields are:

- `title`: non-empty string
- `publishedAt`: valid UTC timestamp in canonical `YYYY-MM-DDTHH:mm:ssZ` format
- `summary`: non-empty string for the blog index
- `tags`: a non-empty list containing only `announcement` and/or `changelog`

The displayed calendar date is the UTC date portion of `publishedAt`.
The filename must start with the post's `YYYY-MM-DD` publication or release
date. The remaining filename, without the date prefix and `.md`, forms part of
the lowercase kebab-case slug. The article body is rendered as Markdown.
