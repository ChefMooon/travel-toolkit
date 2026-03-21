import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import RootLayout from '@/routes/__root';
import LandingPage from '@/routes';
import TripCostPage from '@/routes/trip';
import CurrencyPage from '@/routes/currency';
import TimezonePage from '@/routes/timezone';
import ForecastPage from '@/routes/forecast';

function NotFoundRoute() {
  return (
    <section className="tool-page" aria-label="Page not found">
      <h1>Page not found</h1>
      <p>The page you requested does not exist. Use the grid menu to jump to a tool.</p>
    </section>
  );
}

function RouteError() {
  return (
    <section className="tool-page" aria-label="Route error">
      <h1>Something went wrong</h1>
      <p>We could not load this route. Try again or switch to another tool.</p>
    </section>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundRoute,
  errorComponent: RouteError,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const tripRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trip',
  component: TripCostPage,
});

const currencyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/currency',
  component: CurrencyPage,
});

const timezoneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timezone',
  component: TimezonePage,
});

const forecastRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forecast',
  component: ForecastPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  tripRoute,
  currencyRoute,
  timezoneRoute,
  forecastRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
