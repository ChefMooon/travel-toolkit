/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlogMarkdown } from '../components/BlogMarkdown';
import { blogPosts, loadBlogPosts, parseBlogPost } from './blogPosts';

const validFrontmatter = `title: "Example article"
date: "2026-09-29"
publishedAt: "2026-09-29T09:00:00Z"
summary: "A concise example summary."
tags:
  - travel-planning`;

function makeMarkdown(frontmatter = validFrontmatter, content = '# Example') {
  return `---
${frontmatter}
---
${content}`;
}

function makeFile(slug: string, markdown = makeMarkdown()): Record<string, string> {
  return { [`../content/blog/${slug}.md`]: markdown };
}

describe('parseBlogPost', () => {
  it('parses required metadata and the Markdown body', () => {
    expect(parseBlogPost('../content/blog/example-article.md', makeMarkdown())).toEqual({
      slug: 'example-article',
      title: 'Example article',
      date: '2026-09-29',
      publishedAt: '2026-09-29T09:00:00Z',
      summary: 'A concise example summary.',
      tags: ['travel-planning'],
      content: '# Example',
    });
  });

  it('rejects files without valid YAML frontmatter with an actionable error', () => {
    expect(() => parseBlogPost('../content/blog/example-article.md', 'An empty post.')).toThrow(
      /example-article\.md.*expected YAML frontmatter.*---/
    );
  });

  it.each([
    [
      'title',
      `date: "2026-09-29"
summary: "A concise example summary."
tags:
  - travel-planning`,
    ],
    [
      'date',
      `title: "Example article"
publishedAt: "2026-09-29T09:00:00Z"
summary: "A concise example summary."
tags:
  - travel-planning`,
    ],
    [
      'publishedAt',
      `title: "Example article"
date: "2026-09-29"
summary: "A concise example summary."
tags:
  - travel-planning`,
    ],
    [
      'summary',
      `title: "Example article"
date: "2026-09-29"
tags:
  - travel-planning`,
    ],
    [
      'tags',
      `title: "Example article"
date: "2026-09-29"
publishedAt: "2026-09-29T09:00:00Z"
summary: "A concise example summary."`,
    ],
  ])('rejects missing required metadata field "%s"', (field, frontmatter) => {
    expect(() =>
      parseBlogPost('../content/blog/example-article.md', makeMarkdown(frontmatter))
    ).toThrow(`frontmatter field "${field}"`);
  });

  it('rejects malformed YAML and identifies the source file', () => {
    expect(() =>
      parseBlogPost(
        '../content/blog/broken-frontmatter.md',
        makeMarkdown('title: [unfinished', '# Body')
      )
    ).toThrow(/broken-frontmatter\.md.*could not parse YAML frontmatter/);
  });

  it.each(['2026-02-30', '2026-9-29', 'not-a-date'])(
    'rejects an invalid publication date: %s',
    (date) => {
      const frontmatter = validFrontmatter.replace('2026-09-29', date);
      expect(() =>
        parseBlogPost('../content/blog/example-article.md', makeMarkdown(frontmatter))
      ).toThrow(/frontmatter field "date".*ISO YYYY-MM-DD/);
    }
  );

  it.each([
    ['malformed timestamp', '2026-09-29 09:00:00Z'],
    ['missing seconds', '2026-09-29T09:00Z'],
    ['impossible date', '2026-02-30T09:00:00Z'],
    ['hour out of range', '2026-09-29T24:00:00Z'],
    ['minute out of range', '2026-09-29T09:60:00Z'],
    ['second out of range', '2026-09-29T09:00:60Z'],
    ['UTC offset instead of Z', '2026-09-29T09:00:00+00:00'],
    ['missing UTC suffix', '2026-09-29T09:00:00'],
  ])('rejects an invalid UTC publication timestamp (%s)', (_description, publishedAt) => {
    const frontmatter = validFrontmatter.replace(
      '2026-09-29T09:00:00Z',
      publishedAt
    );
    expect(() =>
      parseBlogPost('../content/blog/example-article.md', makeMarkdown(frontmatter))
    ).toThrow(/frontmatter field "publishedAt".*ISO YYYY-MM-DDTHH:mm:ssZ/);
  });

  it.each([
    ['empty list', 'tags: []'],
    ['not a list', 'tags: travel-planning'],
    ['uppercase tag', 'tags:\n  - Travel-Planning'],
    ['spaces in tag', 'tags:\n  - travel planning'],
    ['underscore in tag', 'tags:\n  - travel_planning'],
    ['non-string tag', 'tags:\n  - 42'],
  ])('rejects malformed tags (%s)', (_description, tags) => {
    const frontmatter = validFrontmatter.replace('tags:\n  - travel-planning', tags);
    expect(() =>
      parseBlogPost('../content/blog/example-article.md', makeMarkdown(frontmatter))
    ).toThrow(/frontmatter field "tags/);
  });

  it('accepts a valid post with an empty Markdown body', () => {
    const emptyPost = parseBlogPost(
      '../content/blog/empty-body.md',
      makeMarkdown(validFrontmatter, '')
    );
    expect(emptyPost.content).toBe('');
  });

  it('rejects a completely empty Markdown file', () => {
    expect(() => parseBlogPost('../content/blog/empty.md', '')).toThrow(
      /empty\.md.*expected YAML frontmatter/
    );
  });
});

describe('loadBlogPosts', () => {
  it.each(['Uppercase', 'two_words', 'two--hyphens', '-leading', 'trailing-', 'has spaces'])(
    'rejects a non-kebab-case filename slug: %s',
    (slug) => {
      expect(() => loadBlogPosts(makeFile(slug))).toThrow(
        /filename-derived slug .* must be kebab-case/
      );
    }
  );

  it('rejects duplicate filename-derived slugs with both paths in the error', () => {
    expect(() =>
      loadBlogPosts({
        '../content/blog/example.md': makeMarkdown(),
        '../content/blog/archive/example.md': makeMarkdown(),
      })
    ).toThrow(/filename-derived slug "example" duplicates "\.\.\/content\/blog\/example\.md"/);
  });

  it('sorts by publication timestamp and uses the slug for exact timestamp ties', () => {
    const withPublication = (date: string, publishedAt: string) =>
      validFrontmatter
        .replace('date: "2026-09-29"', `date: "${date}"`)
        .replace('2026-09-29T09:00:00Z', publishedAt);

    const posts = loadBlogPosts({
      '../content/blog/older-date-post.md': makeMarkdown(
        withPublication('2026-09-28', '2026-09-28T23:59:59Z')
      ),
      '../content/blog/same-day-earlier-post.md': makeMarkdown(
        withPublication('2026-09-29', '2026-09-29T08:00:00Z')
      ),
      '../content/blog/same-day-zulu-post.md': makeMarkdown(
        withPublication('2026-09-29', '2026-09-29T09:00:00Z')
      ),
      '../content/blog/same-day-alpha-post.md': makeMarkdown(
        withPublication('2026-09-29', '2026-09-29T09:00:00Z')
      ),
      '../content/blog/newer-date-post.md': makeMarkdown(
        withPublication('2026-09-30', '2026-09-30T00:01:00Z')
      ),
    });

    expect(posts.map(({ slug }) => slug)).toEqual([
      'newer-date-post',
      'same-day-alpha-post',
      'same-day-zulu-post',
      'same-day-earlier-post',
      'older-date-post',
    ]);
  });

  it('supports an empty published-post collection', () => {
    expect(loadBlogPosts({})).toEqual([]);
  });

  it('limits published tag options to announcements and changelog posts', () => {
    const tagOptions = new Set(blogPosts.flatMap(({ tags }) => tags));

    expect(tagOptions).toEqual(new Set(['announcement', 'changelog']));
  });

  it('bundles the launch post with its required publication metadata and purpose', () => {
    const launchPost = blogPosts.find(
      ({ slug }) => slug === '2026-09-29-introducing-the-travel-toolkit-blog'
    );

    expect(launchPost).toMatchObject({
      slug: '2026-09-29-introducing-the-travel-toolkit-blog',
      title: 'Introducing the Travel Toolkit Blog',
      date: '2026-09-29',
      summary: 'A new place for Travel Toolkit articles and changelogs.',
      tags: ['announcement', 'changelog'],
    });
    expect(launchPost?.content).toContain(
      'The Travel Toolkit blog is a new place for articles and changelogs.'
    );
    expect(launchPost?.content).not.toMatch(/\b(?:daily|weekly|monthly|every week|every month)\b/i);
  });

  it('publishes release notes with a date-prefixed slug and only the changelog tag', () => {
    const releasePost = blogPosts.find(
      ({ slug }) => slug === '2026-09-29-travel-toolkit-1-3-0-release-notes'
    );

    expect(releasePost).toMatchObject({
      slug: '2026-09-29-travel-toolkit-1-3-0-release-notes',
      date: '2026-09-29',
      tags: ['changelog'],
    });
  });
});

describe('BlogMarkdown', () => {
  it('renders representative Markdown elements', () => {
    const { container } = render(
      createElement(BlogMarkdown, {
        content: `# Markdown Example

A **bold** and *emphasized* paragraph.

- First item
- Second item

[Travel Toolkit](https://example.com)`,
      })
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Markdown Example' })).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('bold');
    expect(container.querySelector('em')).toHaveTextContent('emphasized');
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Travel Toolkit' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('does not render raw HTML as executable markup', () => {
    const { container } = render(
      createElement(BlogMarkdown, {
        content: '<img src="x" onerror="alert(1)" />\n\n<script>alert(1)</script>',
      })
    );

    expect(container.querySelector('img, script, [onerror]')).not.toBeInTheDocument();
  });

  it('keeps safe links and blocks unsafe URL protocols', () => {
    const { container } = render(
      createElement(BlogMarkdown, {
        content: '[safe](https://example.com) [unsafe](javascript:alert%281%29)',
      })
    );

    const anchors = container.querySelectorAll('a');
    expect(anchors[0]).toHaveAttribute('href', 'https://example.com');
    expect(anchors[1]).toHaveAttribute('href', '');
    expect(container.querySelector('a[href^="javascript:"]')).not.toBeInTheDocument();
  });

  it('renders empty Markdown content without inserting markup', () => {
    const { container } = render(createElement(BlogMarkdown, { content: '' }));

    expect(container.querySelector('.blog-markdown')).toBeEmptyDOMElement();
  });
});
