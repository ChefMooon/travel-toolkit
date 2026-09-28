/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimezoneNavbar from '@/features/timezone/TimezoneNavbar';

vi.mock('@/store/timezoneStore', () => ({
  useTimezoneStore: vi.fn(),
}));

vi.mock('@/features/timezone/ConfigModal/ConfigModal', () => ({
  default: () => <div data-testid="config-modal" />,
}));

import { useTimezoneStore } from '@/store/timezoneStore';

const mockState = {
  localTz: 'America/New_York',
  setLocalTz: vi.fn(),
};

describe('TimezoneNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTimezoneStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: typeof mockState) => unknown) => selector(mockState),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-TZ-005 Settings button opens ConfigModal', async () => {
    render(<TimezoneNavbar />);

    expect(screen.queryByTestId('config-modal')).not.toBeInTheDocument();

    const settingsButton = screen.getByRole('button', { name: 'Manage tracked timezones' });
    expect(settingsButton).not.toHaveAttribute('title');
    fireEvent.focus(settingsButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Manage tracked timezones');
    fireEvent.click(settingsButton);

    expect(await screen.findByTestId('config-modal')).toBeInTheDocument();
  });

  it('FE-TZ-006 Detect button calls setLocalTz with the browser timezone', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      timeZone: 'Europe/Paris',
      locale: 'en',
      calendar: 'iso8601',
      numberingSystem: 'latn',
    });

    render(<TimezoneNavbar />);

    const detectButton = screen.getByLabelText('Detect my timezone');
    fireEvent.focus(detectButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Use browser timezone');
    fireEvent.click(detectButton);

    expect(mockState.setLocalTz).toHaveBeenCalledWith('Europe/Paris');
  });
});
