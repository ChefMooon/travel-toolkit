/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { afterEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { blogPosts } from '@/lib/blogPosts';

const initialBlogPosts = [...blogPosts];

async function renderBlog(initialEntry = '/blog') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });

  render(<RouterProvider router={router} />);
  await screen.findByRole('heading', { level: 1, name: 'Blog' });

  return router;
}

function firstPost() {
  const post = blogPosts[0];

  if (!post) {
    throw new Error('Expected a published post for blog route coverage.');
  }

  return post;
}

function filterNavigation() {
  return screen.getByRole('navigation', { name: 'Filter posts by tag' });
}

afterEach(() => {
  blogPosts.splice(0, blogPosts.length, ...initialBlogPosts);
});

describe('blog index route', () => {
  it('lists published posts newest-first with metadata and tag controls', async () => {
    const post = firstPost();

    await renderBlog();

    expect(screen.getByRole('heading', { level: 1, name: 'Blog' })).toBeInTheDocument();

    const postList = screen.getByRole('list', { name: 'Published blog posts' });
    const displayedTitles = within(postList)
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);

    expect(displayedTitles).toEqual(blogPosts.map((publishedPost) => publishedPost.title));
    expect(within(postList).getByRole('link', { name: post.title })).toHaveAttribute(
      'href',
      `/blog/${post.slug}`,
    );
    expect(within(postList).getByText(post.summary)).toBeInTheDocument();
    const firstPostCard = within(postList).getAllByRole('article')[0];
    if (!firstPostCard) {
      throw new Error('Expected the first published post card.');
    }
    expect(within(firstPostCard).getByText(post.date, { selector: 'time' })).toHaveAttribute(
      'datetime',
      post.publishedAt,
    );
    expect(
      within(filterNavigation()).getByRole('link', { name: 'All posts' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('filters by an exact tag and supports clear, back, and forward navigation', async () => {
    const tag = 'announcement';

    if (!blogPosts.some((post) => post.tags.includes(tag))) {
      throw new Error('Expected an announcement post for unique-tag filter coverage.');
    }

    const router = await renderBlog();

    fireEvent.click(
      within(filterNavigation()).getByRole('link', {
        name: `Filter posts by tag ${tag}`,
      }),
    );

    await waitFor(() => {
      expect(router.state.location.search).toEqual({ tag });
    });
    expect(
      within(filterNavigation()).getByRole('link', {
        name: `Filter posts by tag ${tag}`,
      }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(screen.getByRole('list', { name: 'Published blog posts' })).getAllByRole('article'),
    ).toHaveLength(1);

    fireEvent.click(within(filterNavigation()).getByRole('link', { name: 'All posts' }));

    await waitFor(() => {
      expect(router.state.location.search).toEqual({});
    });

    await act(async () => {
      router.history.back();
    });
    await waitFor(() => {
      expect(router.state.location.search).toEqual({ tag });
    });

    await act(async () => {
      router.history.forward();
    });
    await waitFor(() => {
      expect(router.state.location.search).toEqual({});
    });
  });

  it('restores an active tag from the URL on direct load', async () => {
    const tag = firstPost().tags[0];

    if (!tag) {
      throw new Error('Expected a tag on a published post.');
    }

    const router = await renderBlog(`/blog?tag=${encodeURIComponent(tag)}`);

    expect(router.state.location.search).toEqual({ tag });
    expect(
      within(filterNavigation()).getByRole('link', {
        name: `Filter posts by tag ${tag}`,
      }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('shows accessible no-results feedback for unknown and partial tags', async () => {
    const tag = firstPost().tags[0];

    if (!tag) {
      throw new Error('Expected a tag on a published post.');
    }

    const partialTag = tag.slice(0, -1);
    await renderBlog(`/blog?tag=${encodeURIComponent(partialTag)}`);

    expect(screen.getByRole('status')).toHaveTextContent(
      `No posts were found for the “${partialTag}” tag.`,
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Clear tag filter' }));

    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Published blog posts' })).toBeInTheDocument();
    });
  });

  it('shows an accessible empty state when no posts are published', async () => {
    blogPosts.splice(0, blogPosts.length);

    await renderBlog();

    expect(screen.getByRole('status')).toHaveTextContent(
      'There are no published blog posts yet.',
    );
    expect(screen.getByRole('link', { name: 'View all posts' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });
});
