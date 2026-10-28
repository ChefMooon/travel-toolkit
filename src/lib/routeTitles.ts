import { TOOLS } from '@/lib/tools';
import { blogPosts } from '@/lib/blogPosts';
import type { TranslationKey } from '@/i18n';

type Translate = (key: TranslationKey) => string;

const APP_TITLE = 'Travel Toolkit';
const ENGLISH_ROUTE_TERMS: Partial<Record<TranslationKey, string>> = { travelToolkit: APP_TITLE, blog: 'Blog', pageNotFoundDocumentTitle: 'Page Not Found', routeError: 'Route Error', toolTripCost: 'Trip Cost', toolCurrency: 'Currency Converter', toolTimezone: 'Timezone Tracker', toolUnits: 'Unit Converter', toolForecast: 'Destination Forecast', toolCountdown: 'Travel Countdown' };
const PAGE_NOT_FOUND_TITLE = 'pageNotFoundDocumentTitle';
const ROUTE_TITLES: Record<string, string> = Object.fromEntries(
  TOOLS.map((tool) => [tool.route, tool.label]),
);

export function getRouteTitle(pathname: string, t: Translate = (key) => ENGLISH_ROUTE_TERMS[key] ?? key): string {
  if (pathname === '/' || pathname === '') {
    return t('travelToolkit');
  }

  if (pathname === '/blog' || pathname === '/blog/') {
    return `${t('travelToolkit')} - ${t('blog')}`;
  }

  if (pathname.startsWith('/blog/')) {
    const slug = pathname.slice('/blog/'.length).replace(/\/$/, '');
    const post = blogPosts.find((candidate) => candidate.slug === slug);

    return post ? `${t('travelToolkit')} - ${post.title}` : `${t('travelToolkit')} - ${t(PAGE_NOT_FOUND_TITLE)}`;
  }

  const toolTitle = ROUTE_TITLES[pathname];
  if (toolTitle) {
    const key: Record<string, TranslationKey> = { 'Trip Cost': 'toolTripCost', 'Currency Converter': 'toolCurrency', 'Timezone Tracker': 'toolTimezone', 'Unit Converter': 'toolUnits', 'Destination Forecast': 'toolForecast', 'Travel Countdown': 'toolCountdown' };
    return `${t('travelToolkit')} - ${t(key[toolTitle] ?? 'travelToolkit')}`;
  }

  if (pathname === '/__not-found') {
    return `${t('travelToolkit')} - ${t(PAGE_NOT_FOUND_TITLE)}`;
  }

  if (pathname === '/__route-error') {
    return `${t('travelToolkit')} - ${t('routeError')}`;
  }

  return t('travelToolkit');
}
