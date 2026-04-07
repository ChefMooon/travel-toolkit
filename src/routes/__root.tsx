import { useEffect, useState } from 'react';
import { Outlet, createRootRoute, useLocation } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { createQueryClient } from '@/lib/queryClient';
import Footer from '@/components/Footer';
import { NON_DESKTOP_MAX_WIDTH, shouldShowFooter } from '@/components/Footer/footerVisibility';
import { useTripStore } from '@/store/tripStore';
import Navbar from '@/components/Navbar';
import ToastViewport from '@/components/ToastViewport';

function ThemeSync() {
  const theme = useTripStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    document.documentElement.style.colorScheme = theme;

    const frameId = window.requestAnimationFrame(() => {
      document.documentElement.classList.remove('theme-preload');
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [theme]);

  return null;
}

function getViewportWidth() {
  if (typeof window === 'undefined') {
    return NON_DESKTOP_MAX_WIDTH + 1;
  }

  return window.innerWidth;
}

function useFooterVisibility() {
  const { pathname } = useLocation();
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return shouldShowFooter(pathname, viewportWidth);
}

export default function RootLayout() {
  const [queryClient] = useState(() => createQueryClient());
  const showFooter = useFooterVisibility();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <div className="app-shell">
        <Navbar />
        <ToastViewport />
        <div className="route-body">
          <Outlet />
        </div>
        {showFooter ? <Footer /> : null}
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
