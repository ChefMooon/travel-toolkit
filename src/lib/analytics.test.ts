import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeAnalytics, loadAnalyticsScript, trackPageView } from '@/lib/analytics';

describe('analytics helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    document.head.querySelector('#travel-toolkit-ga-script')?.remove();
    delete window.gtag;
    delete window.__travelToolkitGaInitialized;
  });

  it('loads analytics script once for a provided measurement id', async () => {
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const appended = Element.prototype.appendChild.call(document.head, node);
      const element = node as HTMLScriptElement;
      element.onload?.(new Event('load'));
      return appended;
    });

    await loadAnalyticsScript('G-TEST1234');

    const script = document.getElementById('travel-toolkit-ga-script') as HTMLScriptElement | null;
    expect(script).toBeTruthy();
    expect(script?.src).toContain('googletagmanager.com/gtag/js?id=G-TEST1234');

    await loadAnalyticsScript('G-TEST1234');
    expect(document.querySelectorAll('#travel-toolkit-ga-script')).toHaveLength(1);

    appendSpy.mockRestore();
  });

  it('does not add a script element when id is missing', async () => {
    await loadAnalyticsScript('');
    expect(document.getElementById('travel-toolkit-ga-script')).toBeNull();
  });

  it('does not initialize analytics outside production', async () => {
    vi.stubEnv('PROD', false);

    await expect(initializeAnalytics()).resolves.toBe(false);
    expect(document.getElementById('travel-toolkit-ga-script')).toBeNull();
    expect(window.__travelToolkitGaInitialized).toBeUndefined();
  });

  it('pushes Arguments objects (not arrays) onto dataLayer so gtag.js processes them', async () => {
    vi.resetModules();
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST1234');
    window.dataLayer = [];

    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const appended = Element.prototype.appendChild.call(document.head, node);
      const element = node as HTMLScriptElement;
      element.onload?.(new Event('load'));
      return appended;
    });

    const analytics = await import('@/lib/analytics');
    await expect(analytics.initializeAnalytics()).resolves.toBe(true);

    const layer = window.dataLayer ?? [];
    expect(layer.length).toBeGreaterThanOrEqual(2);
    for (const entry of layer) {
      expect(Array.isArray(entry)).toBe(false);
      expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]');
    }

    const configEntry = layer.find((entry) => (entry as ArrayLike<unknown>)[0] === 'config') as
      | ArrayLike<unknown>
      | undefined;
    expect(configEntry).toBeDefined();
    expect(configEntry?.[1]).toBe('G-TEST1234');

    appendSpy.mockRestore();
    delete window.dataLayer;
  });

  it('dispatches page_view when initialized', () => {
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    window.__travelToolkitGaInitialized = true;

    trackPageView('/trip?currency=EUR', 'Travel Toolkit - Trip Cost');

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    expect(gtagSpy).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({
        page_path: '/trip?currency=EUR',
        page_title: 'Travel Toolkit - Trip Cost',
      }),
    );
  });

  it('does not dispatch page_view before initialization', () => {
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    window.__travelToolkitGaInitialized = false;

    trackPageView('/trip');

    expect(gtagSpy).not.toHaveBeenCalled();
  });
});
