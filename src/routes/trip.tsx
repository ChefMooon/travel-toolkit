import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

const TripCostPage = lazyRouteComponent(() => import('@/features/trip/TripCostPage'));

export const Route = createFileRoute('/trip')({
  component: TripCostPage,
});
