import { useEffect } from 'react';
import { Outlet } from '@tanstack/react-router';
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
