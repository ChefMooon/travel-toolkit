type GtagCommand = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagCommand;
    __mktGaInitialized?: boolean;
  }
}

const GA_SCRIPT_ID = 'mkt-ga-script';
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';

export function isAnalyticsConfigured(): boolean {
  return MEASUREMENT_ID.length > 0;
}

export function isAnalyticsEnabled(): boolean {
  return import.meta.env.PROD && isAnalyticsConfigured();
}

export async function loadAnalyticsScript(measurementId = MEASUREMENT_ID): Promise<void> {
  if (!measurementId) {
    return;
  }

  if (document.getElementById(GA_SCRIPT_ID)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Analytics script'));
    document.head.appendChild(script);
  });
}

export async function initializeAnalytics(): Promise<boolean> {
  if (!isAnalyticsEnabled()) {
    return false;
  }

  if (window.__mktGaInitialized) {
    return true;
  }

  await loadAnalyticsScript();

  window.dataLayer = window.dataLayer ?? [];
  const gtag: GtagCommand = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };

  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { send_page_view: false });

  window.__mktGaInitialized = true;
  return true;
}

export function trackPageView(pagePath: string, pageTitle = document.title): void {
  if (!window.__mktGaInitialized || !window.gtag) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_title: pageTitle,
    page_location: window.location.href,
    page_path: pagePath,
  });
}
