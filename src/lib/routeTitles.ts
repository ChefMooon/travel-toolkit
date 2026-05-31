import { TOOLS } from '@/lib/tools';

const APP_TITLE = 'Travel Toolkit';
const ROUTE_TITLES: Record<string, string> = Object.fromEntries(
  TOOLS.map((tool) => [tool.route, tool.label]),
);

export function getRouteTitle(pathname: string): string {
  if (pathname === '/' || pathname === '') {
    return APP_TITLE;
  }

  const toolTitle = ROUTE_TITLES[pathname];
  if (toolTitle) {
    return `${APP_TITLE} - ${toolTitle}`;
  }

  if (pathname === '/__not-found') {
    return `${APP_TITLE} - Page Not Found`;
  }

  if (pathname === '/__route-error') {
    return `${APP_TITLE} - Route Error`;
  }

  return APP_TITLE;
}