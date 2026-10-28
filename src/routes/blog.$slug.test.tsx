/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { blogPosts, getBlogPostDisplayDate } from '@/lib/blogPosts';

async function renderBlogArticle(initialEntry: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  render(<RouterProvider router={router} />);

  return router;
}

describe('blog article route', () => {
  it('renders published metadata, safe Markdown, tags, and a link back to the index', async () => {
    const post = blogPosts[0];

    if (!post) {
      throw new Error('Expected a published post for article route coverage.');
    }

    renderBlogArticle(`/blog/${post.slug}`);
    await screen.findByRole('heading', { level: 1, name: post.title });

    expect(screen.getByRole('main')).toHaveAttribute('data-page-entrance');
    expect(screen.getByRole('heading', { level: 1, name: post.title })).toBeInTheDocument();
    expect(screen.getByText(getBlogPostDisplayDate(post.publishedAt), { selector: 'time' })).toHaveAttribute(
      'datetime',
      post.publishedAt,
    );
    expect(screen.getByText(post.summary)).toBeInTheDocument();

    const firstParagraph = post.content
      .trim()
      .split(/\r?\n\s*\r?\n/)[0]
      ?.replace(/\s*\r?\n\s*/g, ' ');
    if (firstParagraph) {
      expect(screen.getByText(firstParagraph)).toBeInTheDocument();
    }

    const backLink = screen.getByRole('link', { name: 'Back to Blog' });
    expect(backLink).toHaveAttribute('href', '/blog');

    const tagsNavigation = screen.getByRole('navigation', {
      name: `Tags for ${post.title}`,
    });
    const firstTag = post.tags[0];
    if (!firstTag) {
      throw new Error('Expected a tag on the introductory post.');
    }
    expect(
      within(tagsNavigation).getByRole('link', {
        name: `Filter posts by tag ${firstTag}`,
      }),
    ).toHaveAttribute('href', `/blog?tag=${firstTag}`);

    await waitFor(() => {
      expect(document.title).toBe(`Travel Toolkit - ${post.title}`);
    });
  });

  it('renders the existing not-found experience for an unknown slug', async () => {
    renderBlogArticle('/blog/not-a-published-post');

    await screen.findByRole('heading', { level: 1, name: 'Page not found' });
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Travel Toolkit - Page Not Found');
    });
  });
});
