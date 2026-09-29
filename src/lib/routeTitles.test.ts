import { describe, expect, it } from 'vitest';
import { getRouteTitle } from '@/lib/routeTitles';
import { blogPosts } from '@/lib/blogPosts';

describe('route titles', () => {
  it('returns the app title for the home route', () => {
    expect(getRouteTitle('/')).toBe('Travel Toolkit');
  });

  it('returns friendly titles for tool routes', () => {
    expect(getRouteTitle('/trip')).toBe('Travel Toolkit - Trip Cost');
    expect(getRouteTitle('/currency')).toBe('Travel Toolkit - Currency Converter');
    expect(getRouteTitle('/timezone')).toBe('Travel Toolkit - Timezone Tracker');
    expect(getRouteTitle('/forecast')).toBe('Travel Toolkit - Destination Forecast');
  });

  it('uses the blog title and published-post metadata for blog routes', () => {
    expect(getRouteTitle('/blog')).toBe('Travel Toolkit - Blog');

    const post = blogPosts[0];

    if (!post) {
      throw new Error('Expected at least one published blog post for title coverage.');
    }

    expect(getRouteTitle(`/blog/${post.slug}`)).toBe(`Travel Toolkit - ${post.title}`);
  });

  it('uses the not-found title for unknown blog slugs', () => {
    expect(getRouteTitle('/blog/not-a-published-post')).toBe(
      'Travel Toolkit - Page Not Found',
    );
  });

  it('falls back to the app title for unknown routes', () => {
    expect(getRouteTitle('/unknown')).toBe('Travel Toolkit');
  });
});