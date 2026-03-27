import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

const TimezonePage = lazyRouteComponent(() => import('@/features/timezone/TimezonePage'));

export const Route = createFileRoute('/timezone')({
  component: TimezonePage,
});
