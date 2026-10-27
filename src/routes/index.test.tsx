/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LandingPage from './index';
import { blogPosts, getBlogPostDisplayDate } from '@/lib/blogPosts';

const initialBlogPosts = [...blogPosts];

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (routeOptions: unknown) => routeOptions,
  Link: ({ to, params, search: _search, children, ...props }: React.ComponentProps<'a'> & { to: string; params?: { slug: string }; search?: { tag: undefined } }) => (
    <a href={params ? `/blog/${params.slug}` : to} {...props}>
      {children}
    </a>
  ),
}));

const expectedTools = [
  {
    label: 'Trip Cost',
    description: 'Calculate shared and split costs across trip groups.',
    route: '/trip',
  },
  {
    label: 'Currency Converter',
    description: 'Convert between currencies with live rates.',
    route: '/currency',
  },
  {
    label: 'Timezone Tracker',
    description: 'Save and track timezones for different locations.',
    route: '/timezone',
  },
  {
    label: 'Destination Forecast',
    description: 'Check weather and event forecasts before travel.',
    route: '/forecast',
  },
];

describe('landing route', () => {
  afterEach(() => {
    blogPosts.splice(0, blogPosts.length, ...initialBlogPosts);
  });

  it('renders accessible tool links with decorative Lucide icons', () => {
    const { container } = render(<LandingPage />);

    expect(screen.getByRole('link', { name: 'Calculate trip cost' })).toHaveAttribute('href', '/trip');

    for (const { label, description, route } of expectedTools) {
      const link = screen.getByRole('link', { name: new RegExp(label) });
      expect(link).toHaveAttribute('href', route);
      expect(link).toHaveClass(`tool-card--${route.slice(1)}`);
      expect(link).toHaveTextContent(description);
    }

    expect(
      container.querySelectorAll(
        '.tool-launcher-icon[aria-hidden="true"] > svg[focusable="false"]',
      ),
    ).toHaveLength(expectedTools.length);
    expect(
      Array.from(container.querySelectorAll('.tool-launcher-icon svg')).every(
        (icon) => icon.getAttribute('stroke-width') === '2',
      ),
    ).toBe(true);
    expect(container.querySelector('.tool-grid')).toHaveAttribute('data-page-entrance');
  });

  it('shows the latest published post and a link to the unfiltered archive', () => {
    const latestPost = initialBlogPosts[0]!;
    render(<LandingPage />);

    expect(screen.getByRole('heading', { name: 'Latest from the blog' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: latestPost.title })).toHaveAttribute(
      'href',
      `/blog/${latestPost.slug}`,
    );
    expect(screen.getByText(getBlogPostDisplayDate(latestPost.publishedAt))).toHaveAttribute(
      'datetime',
      latestPost.publishedAt,
    );
    expect(screen.getByRole('link', { name: /View all posts/ })).toHaveAttribute('href', '/blog');
  });

  it('omits the latest blog section when there are no published posts', () => {
    blogPosts.splice(0, blogPosts.length);
    render(<LandingPage />);

    expect(screen.queryByRole('heading', { name: 'Latest from the blog' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View all posts/ })).not.toBeInTheDocument();
  });
});
