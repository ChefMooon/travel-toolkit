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

/** How long the first render waits for the translation before showing English; it switches once the load finishes. */
const LANGUAGE_LOAD_TIMEOUT_MS = 4000;

const languageReady = activateLanguage(useSettingsStore.getState().language).catch(() => false);
const languageTimeout = new Promise<void>((resolve) => { window.setTimeout(resolve, LANGUAGE_LOAD_TIMEOUT_MS); });

void Promise.race([languageReady, languageTimeout]).finally(() => {
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
});
