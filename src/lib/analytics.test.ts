import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAnalyticsScript, trackPageView } from '@/lib/analytics';

describe('analytics helpers', () => {
  beforeEach(() => {
    document.head.querySelector('#mkt-ga-script')?.remove();
    delete window.gtag;
    delete window.__mktGaInitialized;
  });

  it('loads analytics script once for a provided measurement id', async () => {
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      const appended = Element.prototype.appendChild.call(document.head, node);
      const element = node as HTMLScriptElement;
      element.onload?.(new Event('load'));
      return appended;
    });

    await loadAnalyticsScript('G-TEST1234');

    const script = document.getElementById('mkt-ga-script') as HTMLScriptElement | null;
    expect(script).toBeTruthy();
    expect(script?.src).toContain('googletagmanager.com/gtag/js?id=G-TEST1234');

    await loadAnalyticsScript('G-TEST1234');
    expect(document.querySelectorAll('#mkt-ga-script')).toHaveLength(1);

    appendSpy.mockRestore();
  });

  it('does not add a script element when id is missing', async () => {
    await loadAnalyticsScript('');
    expect(document.getElementById('mkt-ga-script')).toBeNull();
  });

  it('dispatches page_view when initialized', () => {
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    window.__mktGaInitialized = true;

    trackPageView('/trip?currency=EUR', 'MKT - Trip Cost');

    expect(gtagSpy).toHaveBeenCalledTimes(1);
    expect(gtagSpy).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({
        page_path: '/trip?currency=EUR',
        page_title: 'MKT - Trip Cost',
      }),
    );
  });

  it('does not dispatch page_view before initialization', () => {
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    window.__mktGaInitialized = false;

    trackPageView('/trip');

    expect(gtagSpy).not.toHaveBeenCalled();
  });
});
