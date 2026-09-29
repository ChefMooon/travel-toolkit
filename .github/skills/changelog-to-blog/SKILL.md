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
   Ask for the UTC publication time if the changelog does not provide one; do
   not infer or fabricate a time.
2. Review the existing Markdown files in `src/content/blog/` for tone and
   check that a post for this version does not already exist. Do not overwrite
   an existing post; ask whether to update it or use another filename.
3. Write for Travel Toolkit users in plain, approachable language. Explain what
   changed and why it is useful. Group related changes, omit internal
   implementation details, and do not add claims that the changelog does not
   support. Do not copy the changelog bullets verbatim.
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
   date: "2026-09-29"
   publishedAt: "2026-09-29T12:00:00Z"
   summary: "A concise summary of the release for the blog index."
   tags:
     - changelog
   ---
   ```

   Set `date` to the release date from the changelog and `publishedAt` to the
   user-provided UTC publication time in canonical `YYYY-MM-DDTHH:mm:ssZ`
   format. Keep the filename-derived slug lowercase kebab-case and unique.
   The only allowed tags are `announcement` and `changelog`; use `changelog`
   for release posts. Do not add topic tags.
6. Write the article body in Markdown with clear section headings. The article
   page already displays the post title, date, summary, and tags, so do not
   repeat the title as a top-level heading in the body.
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
- `date`: valid calendar date in `YYYY-MM-DD` format
- `publishedAt`: valid UTC timestamp in canonical `YYYY-MM-DDTHH:mm:ssZ` format
- `summary`: non-empty string for the blog index
- `tags`: a non-empty list containing only `announcement` and/or `changelog`

The filename must start with the post's `YYYY-MM-DD` publication or release
date. The remaining filename, without the date prefix and `.md`, forms part of
the lowercase kebab-case slug. The article body is rendered as Markdown.
