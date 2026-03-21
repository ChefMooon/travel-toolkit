import { useEffect } from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { queryClient } from '@/lib/queryClient';
import { useTripStore } from '@/store/tripStore';
import Navbar from '@/components/Navbar';
import ToastViewport from '@/components/ToastViewport';

function ThemeSync() {
  const theme = useTripStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
  }, [theme]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <div className="app-shell">
        <Navbar />
        <ToastViewport />
        <div className="route-body">
          <Outlet />
        </div>
      </div>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </QueryClientProvider>
  );
}

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

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundRoute,
  errorComponent: RouteError,
});
