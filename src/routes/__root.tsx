import { useEffect, useState } from 'react';
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { createQueryClient } from '@/lib/queryClient';
import { useTripStore } from '@/store/tripStore';
import Navbar from '@/components/Navbar';
import ToastViewport from '@/components/ToastViewport';
import appCssUrl from '@/index.css?url';

const INITIAL_THEME_SCRIPT = `(function(){
  var storageKey = 'mkt-trip-data';
  var fallbackTheme = 'light';
  var root = document.documentElement;
  var theme = fallbackTheme;

  root.classList.add('theme-preload');

  try {
    var storedValue = window.localStorage.getItem(storageKey);

    if (storedValue) {
      var parsedValue = JSON.parse(storedValue);
      var persistedTheme = parsedValue && parsedValue.state && parsedValue.state.theme;

      if (persistedTheme === 'light' || persistedTheme === 'dark') {
        theme = persistedTheme;
      }
    }
  } catch (error) {
    theme = fallbackTheme;
  }

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();`;

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

export default function RootLayout() {
  const [queryClient] = useState(() => createQueryClient());

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

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light dark' },
      { title: 'MKT' },
    ],
    links: [{ rel: 'stylesheet', href: appCssUrl }],
    scripts: [{ children: INITIAL_THEME_SCRIPT }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFoundRoute,
  errorComponent: RouteError,
});
