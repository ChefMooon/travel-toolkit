/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useTripStore } from '@/store/tripStore';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('@/components/GridPanel', () => ({
  default: ({ open }: { open: boolean }) => (
    <div data-testid="grid-panel-state">{open ? 'open' : 'closed'}</div>
  ),
}));

const mockState = {
  theme: 'light' as 'light' | 'dark',
  setTheme: vi.fn(),
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.theme = 'light';

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockState) => unknown) => selector(mockState)
    );
  });

  it('toggles theme from light to dark', () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(mockState.setTheme).toHaveBeenCalledWith('dark');
  });

  it('toggles grid panel open state from trigger', () => {
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'Open tool navigation' });
    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('closed');

    fireEvent.click(trigger);

    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('open');
    expect(screen.getByRole('button', { name: 'Close tool navigation' })).toHaveAttribute('aria-expanded', 'true');
  });
});
