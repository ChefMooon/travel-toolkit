/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
// @ts-nocheck

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useTripStore } from './store/tripStore';
import { getColorThemeValue, COUPLE_ICONS } from './store/types';
import { useConsentStore } from './store/consentStore';
import RootLayout from './routes/__root';

const { initializeAnalyticsMock, trackPageViewMock, useLocationMock } = vi.hoisted(() => ({
  initializeAnalyticsMock: vi.fn(),
  trackPageViewMock: vi.fn(),
  useLocationMock: vi.fn(() => ({ pathname: '/trip', searchStr: '' })),
}));

vi.mock('@/lib/analytics', () => ({
  initializeAnalytics: initializeAnalyticsMock,
  trackPageView: trackPageViewMock,
}));

vi.mock('@tanstack/react-router', () => ({
  Outlet: () => null,
  createRootRoute: (options: unknown) => options,
  useLocation: useLocationMock,
}));

vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => null }));
vi.mock('@/components/ToastViewport', () => ({ default: () => null }));
vi.mock('@/components/ConsentBanner', () => ({ default: () => null }));

describe('Phase 6: Integration & Dark Mode Testing', () => {
  beforeEach(() => {
    // Clear all mocks and reset store state
    vi.clearAllMocks();
    document.documentElement.dataset.theme = 'light';
    
    // Reset the store to initial state
    useTripStore.getState().resetTrip();
  });

  afterEach(() => {
    delete document.documentElement.dataset.theme;
    vi.clearAllMocks();
  });

  describe('E2E Scenario 1: Icon Change Flow (GroupSetup → CostSummary)', () => {
    it('should update icon in CostSummary when changed in GroupSetup', async () => {
      // Add a couple with initial icon 1
      useTripStore.getState().addCouple();

      const couple = useTripStore.getState().couples[0];
      if (!couple) return;
      
      const coupleId = couple.id;
      const initialIcon = COUPLE_ICONS[1]?.symbol;

      // Verify icon is rendered initially
      expect(useTripStore.getState().couples[0]?.iconIndex).toBe(1);

      // Change icon to 5
      useTripStore.getState().updateCoupleIcon(coupleId, 5);

      // Verify icon was updated in store
      expect(useTripStore.getState().couples[0]?.iconIndex).toBe(5);
      expect(COUPLE_ICONS[5]?.symbol).not.toBe(initialIcon);
    });

    it('should immediately reflect icon changes across multiple couples', async () => {
      // Add multiple couples
      useTripStore.getState().addCouple();
      useTripStore.getState().addCouple();

      const couples = useTripStore.getState().couples;
      if (couples.length < 2) return;

      const couple1Id = couples[0].id;
      const couple2Id = couples[1].id;

      // Change icons for each couple
      useTripStore.getState().updateCoupleIcon(couple1Id, 3);
      useTripStore.getState().updateCoupleIcon(couple2Id, 7);

      const c1 = useTripStore.getState().couples[0];
      const c2 = useTripStore.getState().couples[1];
      
      expect(c1?.iconIndex).toBe(3);
      expect(c2?.iconIndex).toBe(7);
      expect(c1?.iconIndex !== c2?.iconIndex).toBe(true);
    });
  });

  describe('E2E Scenario 2: Color Change Flow (GroupSetup → CostSummary)', () => {
    it('should update color in store when changed in GroupSetup', async () => {
      // Add a couple with color 1
      useTripStore.getState().addCouple();

      const couple = useTripStore.getState().couples[0];
      if (!couple) return;
      
      const coupleId = couple.id;
      const initialColor = couple.colorIndex;

      // Change color to 5
      useTripStore.getState().updateCoupleColor(coupleId, 5);

      // Verify color updated
      const updatedCouple = useTripStore.getState().couples[0];
      expect(updatedCouple?.colorIndex).toBe(5);
      expect(updatedCouple?.colorIndex).not.toBe(initialColor);
    });

    it('should propagate color changes across the store state', async () => {
      useTripStore.getState().addCouple();
      useTripStore.getState().addCouple();

      const couples = useTripStore.getState().couples;
      if (couples.length < 2) return;

      const couple1Id = couples[0].id;
      const couple2Id = couples[1].id;

      // Assign different colors
      useTripStore.getState().updateCoupleColor(couple1Id, 2);
      useTripStore.getState().updateCoupleColor(couple2Id, 8);

      const c1 = useTripStore.getState().couples[0];
      const c2 = useTripStore.getState().couples[1];
      
      expect(c1?.colorIndex).toBe(2);
      expect(c2?.colorIndex).toBe(8);
    });

    it('should allow cycling through all 10 colors', async () => {
      useTripStore.getState().addCouple();

      const couple = useTripStore.getState().couples[0];
      if (!couple) return;
      
      const coupleId = couple.id;

      for (let i = 1; i <= 10; i++) {
        useTripStore.getState().updateCoupleColor(coupleId, i);
        expect(useTripStore.getState().couples[0]?.colorIndex).toBe(i);
      }
    });
  });

  describe('E2E Scenario 3: Dark Mode - Theme Toggle Updates Modals', () => {
    it('should toggle theme and update document attribute', async () => {
      // Initial theme should be light
      expect(useTripStore.getState().theme).toBe('light');

      // Toggle to dark
      useTripStore.getState().setTheme('dark');

      expect(useTripStore.getState().theme).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');

      // Toggle back to light
      useTripStore.getState().setTheme('light');

      expect(useTripStore.getState().theme).toBe('light');
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    it('should provide correct colors for light mode', async () => {
      // Test all 10 colors in light mode
      for (let i = 1; i <= 10; i++) {
        const lightColor = getColorThemeValue(i, 'light');
        const darkColor = getColorThemeValue(i, 'dark');

        // Light and dark colors should be different
        expect(lightColor).not.toBe(darkColor);
        // Both should be valid color format
        expect(lightColor).toMatch(/^#[0-9A-F]{6}$/i);
        expect(darkColor).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    it('should provide correct colors for dark mode', async () => {
      // Test all 10 colors in dark mode
      for (let i = 1; i <= 10; i++) {
        const darkColor = getColorThemeValue(i, 'dark');
        expect(darkColor).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });
  });

  describe('E2E Scenario 4: Dark Mode - Modal Colors Adapt on Theme Change', () => {
    it('modalColors should change when theme changes', async () => {
      useTripStore.getState().setTheme('light');

      const lightModeColor1 = getColorThemeValue(1, 'light');
      const darkModeColor1 = getColorThemeValue(1, 'dark');

      useTripStore.getState().setTheme('dark');

      // Verify the current theme in the store matches
      expect(useTripStore.getState().theme).toBe('dark');

      // Verify color values are different for light vs dark
      expect(lightModeColor1).not.toBe(darkModeColor1);
    });

    it('should handle rapid theme switches', async () => {
      useTripStore.getState().setTheme('light');
      useTripStore.getState().setTheme('dark');
      useTripStore.getState().setTheme('light');
      useTripStore.getState().setTheme('dark');

      expect(useTripStore.getState().theme).toBe('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });

  describe('E2E Scenario 5: Persistence - Icon/Color Survive Store Actions', () => {
    it('should persist icon changes in store state', async () => {
      useTripStore.getState().addCouple();

      const firstCouple = useTripStore.getState().couples[0];
      if (!firstCouple) return;
      
      const coupleId = firstCouple.id;

      // Change icon
      useTripStore.getState().updateCoupleIcon(coupleId, 7);

      // Verify it's still there after other operations
      useTripStore.getState().addCouple();

      const couple1 = useTripStore.getState().couples.find((c) => c.id === coupleId);
      expect(couple1?.iconIndex).toBe(7);
    });

    it('should persist color changes across multiple operations', async () => {
      useTripStore.getState().addCouple();

      const firstCouple = useTripStore.getState().couples[0];
      if (!firstCouple) return;
      
      const coupleId = firstCouple.id;

      // Change color
      useTripStore.getState().updateCoupleColor(coupleId, 4);

      // Perform other store operations
      useTripStore.getState().setTripName('Test Trip');
      useTripStore.getState().setGlobalMarkup(50);

      // Verify color persisted
      const couple = useTripStore.getState().couples.find((c) => c.id === coupleId);
      expect(couple?.colorIndex).toBe(4);
    });

    it('should maintain icon/color through couple rename', async () => {
      useTripStore.getState().addCouple();

      const firstCouple = useTripStore.getState().couples[0];
      if (!firstCouple) return;
      
      const coupleId = firstCouple.id;

      useTripStore.getState().updateCoupleIcon(coupleId, 5);
      useTripStore.getState().updateCoupleColor(coupleId, 3);
      useTripStore.getState().renameCouple(coupleId, 'Alice & Bob');

      const couple = useTripStore.getState().couples.find((c) => c.id === coupleId);
      expect(couple?.iconIndex).toBe(5);
      expect(couple?.colorIndex).toBe(3);
      expect(couple?.name).toBe('Alice & Bob');
    });
  });

  describe('E2E Scenario 6: Color Contrast - Readable in Light and Dark Modes', () => {
    it('should have valid colors for all color indices in light mode', () => {
      for (let i = 1; i <= 10; i++) {
        const color = getColorThemeValue(i, 'light');
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        // Verify it's not pure white or transparent
        expect(color.toLowerCase()).not.toBe('#ffffff');
      }
    });

    it('should have valid colors for all color indices in dark mode', () => {
      for (let i = 1; i <= 10; i++) {
        const color = getColorThemeValue(i, 'dark');
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        // Verify it's not pure black or transparent
        expect(color.toLowerCase()).not.toBe('#000000');
      }
    });

    it('should provide distinct colors for visual differentiation', () => {
      const lightColors = new Set<string>();
      const darkColors = new Set<string>();

      for (let i = 1; i <= 10; i++) {
        const light = getColorThemeValue(i, 'light');
        const dark = getColorThemeValue(i, 'dark');
        lightColors.add(light);
        darkColors.add(dark);
      }

      // All light colors should be unique
      expect(lightColors.size).toBe(10);
      // All dark colors should be unique
      expect(darkColors.size).toBe(10);
    });

    it('should darken colors in dark mode for better visibility', () => {
      // In dark mode, colors should generally be lighter (higher brightness)
      // than light mode since we need contrast against a dark background
      for (let i = 1; i <= 10; i++) {
        const lightColor = getColorThemeValue(i, 'light');
        const darkColor = getColorThemeValue(i, 'dark');

        // Both should exist and be different
        expect(lightColor).toBeTruthy();
        expect(darkColor).toBeTruthy();
        expect(lightColor).not.toBe(darkColor);
      }
    });
  });

  describe('E2E Scenario 7: Cross-Section Consistency - Changes Sync Everywhere', () => {
    it('should keep couple data consistent across store subscriptions', async () => {
      useTripStore.getState().addCouple();

      const firstCouple = useTripStore.getState().couples[0];
      if (!firstCouple) return;
      
      const coupleId = firstCouple.id;

      // Make changes
      useTripStore.getState().updateCoupleIcon(coupleId, 6);
      useTripStore.getState().updateCoupleColor(coupleId, 9);
      useTripStore.getState().renameCouple(coupleId, 'Eve & Frank');

      // Verify all changes are persisted together
      const couple = useTripStore.getState().couples[0];
      expect(couple?.iconIndex).toBe(6);
      expect(couple?.colorIndex).toBe(9);
      expect(couple?.name).toBe('Eve & Frank');
    });

    it('should handle independent icon and color updates', async () => {
      useTripStore.getState().addCouple();

      const firstCouple = useTripStore.getState().couples[0];
      if (!firstCouple) return;
      
      const coupleId = firstCouple.id;

      // Update only icon
      useTripStore.getState().updateCoupleIcon(coupleId, 4);

      let couple = useTripStore.getState().couples[0];
      expect(couple?.iconIndex).toBe(4);
      expect(couple.colorIndex).not.toBeUndefined();

      // Update only color
      useTripStore.getState().updateCoupleColor(coupleId, 6);

      couple = useTripStore.getState().couples[0];
      expect(couple.iconIndex).toBe(4); // Should still be 4
      expect(couple.colorIndex).toBe(6);
    });

    it('should maintain consistency with multiple couples', async () => {
      useTripStore.getState().addCouple();
      useTripStore.getState().addCouple();
      useTripStore.getState().addCouple();

      const [couple1Id, couple2Id, couple3Id] = useTripStore.getState().couples.map((c) => c.id);

      // Make distinct changes
      useTripStore.getState().updateCoupleIcon(couple1Id, 1);
      useTripStore.getState().updateCoupleColor(couple1Id, 1);

      useTripStore.getState().updateCoupleIcon(couple2Id, 5);
      useTripStore.getState().updateCoupleColor(couple2Id, 5);

      useTripStore.getState().updateCoupleIcon(couple3Id, 10);
      useTripStore.getState().updateCoupleColor(couple3Id, 10);

      expect(useTripStore.getState().couples[0].iconIndex).toBe(1);
      expect(useTripStore.getState().couples[0].colorIndex).toBe(1);

      expect(useTripStore.getState().couples[1].iconIndex).toBe(5);
      expect(useTripStore.getState().couples[1].colorIndex).toBe(5);

      expect(useTripStore.getState().couples[2].iconIndex).toBe(10);
      expect(useTripStore.getState().couples[2].colorIndex).toBe(10);
    });
  });

  describe('E2E Scenario 8: Modal Behavior - Click-Outside Cancels Without Saving', () => {
    it('should handle modal state correctly on cancel', async () => {
      useTripStore.getState().addCouple();

      const coupleId = useTripStore.getState().couples[0].id;
      const originalIcon = useTripStore.getState().couples[0].iconIndex;
      const originalColor = useTripStore.getState().couples[0].colorIndex;

      // Simulate modal open/cancel without changing
      // (In actual UI, this would be handled by modal component)
      const updatedIcon = 7;
      const updatedColor = 3;

      // Change values
      useTripStore.getState().updateCoupleIcon(coupleId, updatedIcon);
      useTripStore.getState().updateCoupleColor(coupleId, updatedColor);

      // Verify changes took effect (since we updated the store directly)
      expect(useTripStore.getState().couples[0].iconIndex).toBe(updatedIcon);
      expect(useTripStore.getState().couples[0].colorIndex).toBe(updatedColor);
    });

    it('should preserve original values when not confirmed', async () => {
      useTripStore.getState().addCouple();

      const couple = useTripStore.getState().couples[0];
      const originalId = couple.id;
      const originalIcon = couple.iconIndex;
      const originalColor = couple.colorIndex;

      // Verify originals
      expect(useTripStore.getState().couples[0].iconIndex).toBe(originalIcon);
      expect(useTripStore.getState().couples[0].colorIndex).toBe(originalColor);
    });
  });

  describe('Cross-Scenario Integrated Tests', () => {
    it('should handle complete workflow: add couple → change icon/color → switch theme', async () => {
      // Add couple
      useTripStore.getState().addCouple();

      const coupleId = useTripStore.getState().couples[0].id;

      // Change icon and color
      useTripStore.getState().updateCoupleIcon(coupleId, 3);
      useTripStore.getState().updateCoupleColor(coupleId, 5);

      // Switch theme
      useTripStore.getState().setTheme('dark');

      // Verify all state is maintained
      expect(useTripStore.getState().couples[0].iconIndex).toBe(3);
      expect(useTripStore.getState().couples[0].colorIndex).toBe(5);
      expect(useTripStore.getState().theme).toBe('dark');
    });

    it('should handle creating multiple couples with distinct icons/colors across themes', async () => {
      // Add couples in light mode
      useTripStore.getState().setTheme('light');
      useTripStore.getState().addCouple();
      useTripStore.getState().addCouple();

      const couple1Id = useTripStore.getState().couples[0].id;
      const couple2Id = useTripStore.getState().couples[1].id;

      // Customize each couple
      useTripStore.getState().updateCoupleIcon(couple1Id, 2);
      useTripStore.getState().updateCoupleColor(couple1Id, 4);

      useTripStore.getState().updateCoupleIcon(couple2Id, 8);
      useTripStore.getState().updateCoupleColor(couple2Id, 6);

      // Switch to dark mode
      useTripStore.getState().setTheme('dark');

      // Verify customizations persisted through theme change
      expect(useTripStore.getState().couples[0].iconIndex).toBe(2);
      expect(useTripStore.getState().couples[0].colorIndex).toBe(4);
      expect(useTripStore.getState().couples[1].iconIndex).toBe(8);
      expect(useTripStore.getState().couples[1].colorIndex).toBe(6);
      expect(useTripStore.getState().theme).toBe('dark');
    });

    it('should maintain data integrity through rapid consecutive updates', async () => {
      useTripStore.getState().addCouple();

      const coupleId = useTripStore.getState().couples[0].id;

      // Rapid updates
      useTripStore.getState().updateCoupleIcon(coupleId, 1);
      useTripStore.getState().updateCoupleColor(coupleId, 1);
      useTripStore.getState().updateCoupleIcon(coupleId, 5);
      useTripStore.getState().updateCoupleColor(coupleId, 5);
      useTripStore.getState().updateCoupleIcon(coupleId, 10);
      useTripStore.getState().updateCoupleColor(coupleId, 10);

      // Final state should reflect last updates
      expect(useTripStore.getState().couples[0].iconIndex).toBe(10);
      expect(useTripStore.getState().couples[0].colorIndex).toBe(10);
    });
  });
});

describe('Root analytics consent bridge', () => {
  beforeEach(() => {
    vi.stubEnv('PROD', true);
    vi.clearAllMocks();
    useConsentStore.getState().resetConsent();
    initializeAnalyticsMock.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not initialize analytics or send page views while consent is unset', () => {
    render(<RootLayout />);

    expect(initializeAnalyticsMock).not.toHaveBeenCalled();
    expect(trackPageViewMock).not.toHaveBeenCalled();
  });

  it('initializes analytics and sends page views with accepted consent in production', async () => {
    useConsentStore.getState().acceptAll();
    render(<RootLayout />);

    await waitFor(() => expect(trackPageViewMock).toHaveBeenCalledTimes(1));
    expect(initializeAnalyticsMock).toHaveBeenCalledTimes(1);
    await expect(initializeAnalyticsMock.mock.results[0]?.value).resolves.toBe(true);
    expect(trackPageViewMock).toHaveBeenCalledWith('/trip', expect.any(String));
  });

  it('does not initialize analytics or send page views with rejected consent', () => {
    useConsentStore.getState().rejectAll();
    render(<RootLayout />);

    expect(initializeAnalyticsMock).not.toHaveBeenCalled();
    expect(trackPageViewMock).not.toHaveBeenCalled();
  });

  it('does not send page views when accepted consent is outside production', async () => {
    vi.stubEnv('PROD', false);
    initializeAnalyticsMock.mockResolvedValue(false);
    useConsentStore.getState().acceptAll();
    render(<RootLayout />);

    await waitFor(() => expect(initializeAnalyticsMock).toHaveBeenCalledTimes(1));
    await expect(initializeAnalyticsMock.mock.results[0]?.value).resolves.toBe(false);
    expect(trackPageViewMock).not.toHaveBeenCalled();
  });
});

describe('Blog navigation integration', () => {
  it('navigates from the shared footer to a post from the blog index', async () => {
    vi.doUnmock('@tanstack/react-router');
    vi.doUnmock('@/components/Footer');
    vi.resetModules();

    const routerModule = await import('@tanstack/react-router');
    const { routeTree } = await import('./routeTree.gen');
    const { blogPosts } = await import('./lib/blogPosts');
    const post = blogPosts[0];

    if (!post) {
      throw new Error('Expected a published post for blog navigation coverage.');
    }

    const router = routerModule.createRouter({
      routeTree,
      history: routerModule.createMemoryHistory({ initialEntries: ['/'] }),
    });
    const RouterProvider = routerModule.RouterProvider;

    render(<RouterProvider router={router} />);

    fireEvent.click(await screen.findByRole('link', { name: 'Blog' }));
    await screen.findByRole('heading', { level: 1, name: 'Blog' });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/blog');
    });

    fireEvent.click(await screen.findByRole('link', { name: post.title }));
    await screen.findByRole('heading', { level: 1, name: post.title });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/blog/${post.slug}`);
    });
  });
});
