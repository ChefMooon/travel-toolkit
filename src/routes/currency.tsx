import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

const CurrencyPage = lazyRouteComponent(() => import('@/features/currency/CurrencyTool'));

export const Route = createFileRoute('/currency')({
  component: CurrencyPage,
});
