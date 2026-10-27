/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { useConsentStore } from '@/store/consentStore';

async function renderAppAtHome() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(<RouterProvider router={router} />);
  await screen.findByRole('link', { name: 'Blog' });
}

describe('Footer', () => {
  beforeEach(() => {
    useConsentStore.getState().resetConsent();
  });

  it('shows privacy preferences control', async () => {
    await renderAppAtHome();

    expect(screen.getByRole('button', { name: 'Privacy Preferences' })).toBeInTheDocument();
  });

  it('shows the source code link', async () => {
    await renderAppAtHome();

    const sourceLink = screen.getByRole('link', { name: 'Source code' });

    expect(sourceLink).toHaveAttribute('href', 'https://github.com/ChefMooon/travel-toolkit');
    expect(sourceLink).toHaveAttribute('target', '_blank');
    expect(sourceLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('shows the Cloudflare hosting link', async () => {
    await renderAppAtHome();

    const hostingLink = screen.getByRole('link', { name: 'Cloudflare' });

    expect(hostingLink).toHaveAttribute('href', 'https://www.cloudflare.com/');
    expect(hostingLink).toHaveAttribute('target', '_blank');
    expect(hostingLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('shows the blog link in the shared footer', async () => {
    await renderAppAtHome();

    const blogLink = screen.getByRole('link', { name: 'Blog' });

    expect(blogLink).toHaveAttribute('href', '/blog');
    expect(screen.getAllByRole('link', { name: 'Blog' })).toHaveLength(1);
  });

  it('resets consent state when privacy preferences is clicked', async () => {
    useConsentStore.getState().acceptAll();
    expect(useConsentStore.getState().consentChoice).toBe('accepted');

    await renderAppAtHome();

    fireEvent.click(screen.getByRole('button', { name: 'Privacy Preferences' }));

    expect(useConsentStore.getState().consentChoice).toBe('unset');
    expect(useConsentStore.getState().analyticsConsent).toBe(false);
  });
});
