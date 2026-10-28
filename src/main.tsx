import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from '@/router';
import '@/index.css';
import { activateLanguage } from '@/i18n';
import { useSettingsStore } from '@/store/settingsStore';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const router = getRouter();
const root = createRoot(rootElement);

void activateLanguage(useSettingsStore.getState().language).catch(() => false).finally(() => {
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
