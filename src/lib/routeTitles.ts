import { TOOLS } from '@/lib/tools';
import { blogPosts } from '@/lib/blogPosts';

const APP_TITLE = 'Travel Toolkit';
const PAGE_NOT_FOUND_TITLE = `${APP_TITLE} - Page Not Found`;
const ROUTE_TITLES: Record<string, string> = Object.fromEntries(
  TOOLS.map((tool) => [tool.route, tool.label]),
);

export function getRouteTitle(pathname: string): string {
  if (pathname === '/' || pathname === '') {
    return APP_TITLE;
  }

  if (pathname === '/blog' || pathname === '/blog/') {
    return `${APP_TITLE} - Blog`;
  }

  if (pathname.startsWith('/blog/')) {
    const slug = pathname.slice('/blog/'.length).replace(/\/$/, '');
    const post = blogPosts.find((candidate) => candidate.slug === slug);

    return post ? `${APP_TITLE} - ${post.title}` : PAGE_NOT_FOUND_TITLE;
  }

  const toolTitle = ROUTE_TITLES[pathname];
  if (toolTitle) {
    return `${APP_TITLE} - ${toolTitle}`;
  }

  if (pathname === '/__not-found') {
    return PAGE_NOT_FOUND_TITLE;
  }

  if (pathname === '/__route-error') {
    return `${APP_TITLE} - Route Error`;
  }

  return APP_TITLE;
}