/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { afterEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';
import { useTripStore } from '@/store/tripStore';

async function renderAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => act(() => useTripStore.getState().resetTrip()));

describe('unsaved trip navigation guard', () => {
  it('lets a clean trip navigate through the brand without a warning', async () => {
    const router = await renderAt('/trip');
    await screen.findByRole('heading', { name: 'Cost Ledger' });
    await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'Go to home page' })); });
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByRole('dialog', { name: 'Leave with unsaved changes?' })).not.toBeInTheDocument();
  });

  it('lets the user stay or proceed from a dirty trip navigation warning', async () => {
    const router = await renderAt('/trip');
    await screen.findByRole('heading', { name: 'Cost Ledger' });
    act(() => useTripStore.getState().setTripName('Unsaved trip'));

    await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'Go to home page' })); });
    const dialog = await screen.findByRole('dialog', { name: 'Leave with unsaved changes?' });
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'Stay' })); });
    await waitFor(() => expect(router.state.location.pathname).toBe('/trip'));
    expect(useTripStore.getState().tripName).toBe('Unsaved trip');

    await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'Go to home page' })); });
    const secondDialog = await screen.findByRole('dialog', { name: 'Leave with unsaved changes?' });
    await act(async () => { fireEvent.click(within(secondDialog).getByRole('button', { name: 'Leave' })); });
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('does not block navigation when the current route is not Trip Cost', async () => {
    const router = await renderAt('/blog');
    await screen.findByRole('heading', { name: 'Blog' });
    act(() => useTripStore.getState().setTripName('Changed elsewhere'));
    await act(async () => { await router.navigate({ to: '/' }); });
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByRole('dialog', { name: 'Leave with unsaved changes?' })).not.toBeInTheDocument();
  });
});
