import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

const UnitConverter = lazyRouteComponent(() => import('@/features/units/UnitConverter'));

export const Route = createFileRoute('/units')({ component: UnitConverter });
