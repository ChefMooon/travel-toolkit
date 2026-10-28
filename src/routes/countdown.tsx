import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

const CountdownPage = lazyRouteComponent(() => import('@/features/countdown/CountdownPage'));

export const Route = createFileRoute('/countdown')({
  validateSearch: (search: Record<string, unknown>): { fromTrip?: true } => ({ fromTrip: search.fromTrip === true || search.fromTrip === 'true' ? true : undefined }),
  component: () => <CountdownPage fromTrip={Route.useSearch().fromTrip} />,
});
