import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

const ForecastPage = lazyRouteComponent(() => import('@/features/forecast'));

export const Route = createFileRoute('/forecast')({
  component: ForecastPage,
});
