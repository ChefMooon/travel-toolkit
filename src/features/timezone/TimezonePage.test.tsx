/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useTimezoneStore } from '@/store/timezoneStore';
import TimezonePage from './TimezonePage';

describe('TimezonePage', () => {
  beforeEach(() => {
    localStorage.clear();
    useTimezoneStore.setState({ localTz: 'UTC', trackedZones: [] });
  });

  it('opens the existing timezone dialog from the empty state and restores focus on close', async () => {
    render(<TimezonePage />);
    expect(screen.getByRole('main')).toHaveAttribute('data-page-entrance');

    const addButton = screen.getByRole('button', { name: 'Add timezone' });
    fireEvent.click(addButton);

    expect(await screen.findByRole('dialog', { name: 'Timezone Settings' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }));

    expect(await screen.findByRole('button', { name: 'Add timezone' })).toHaveFocus();
  });
});
