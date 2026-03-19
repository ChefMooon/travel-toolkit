/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Topbar from '@/components/Topbar';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

import { useTripStore } from '@/store/tripStore';

const mockStoreState = {
  tripName: 'Spring Trip',
  setTripName: vi.fn(),
  globalMarkup: 66,
  setGlobalMarkup: vi.fn(),
  theme: 'light' as 'light' | 'dark',
  setTheme: vi.fn(),
  resetTrip: vi.fn(),
};

describe('Topbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.tripName = 'Spring Trip';
    mockStoreState.globalMarkup = 66;
    mockStoreState.theme = 'light';

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );
  });

  it('FE-TOP-001 updates trip name via store action', () => {
    render(<Topbar />);

    fireEvent.change(screen.getByLabelText('Trip name'), {
      target: { value: 'Japan 2026' },
    });

    expect(mockStoreState.setTripName).toHaveBeenCalledWith('Japan 2026');
  });

  it('FE-TOP-002 shows and uses clear trip name button when focused', () => {
    render(<Topbar />);

    const tripInput = screen.getByLabelText('Trip name');
    fireEvent.focus(tripInput);

    const clearButton = screen.getByLabelText('Clear trip name');
    fireEvent.mouseDown(clearButton);

    expect(mockStoreState.setTripName).toHaveBeenCalledWith('');
  });

  it('FE-TOP-003 saves valid global markup on blur', () => {
    render(<Topbar />);

    fireEvent.click(screen.getByText('Markup'));

    const markupInput = screen.getByLabelText('Global markup percentage');
    fireEvent.change(markupInput, { target: { value: '42.5' } });
    fireEvent.blur(markupInput);

    expect(mockStoreState.setGlobalMarkup).toHaveBeenCalledWith(42.5);
  });

  it('FE-TOP-004 does not save invalid global markup', () => {
    render(<Topbar />);

    fireEvent.click(screen.getByText('Markup'));

    const markupInput = screen.getByLabelText('Global markup percentage');
    fireEvent.change(markupInput, { target: { value: '' } });
    fireEvent.blur(markupInput);

    expect(mockStoreState.setGlobalMarkup).not.toHaveBeenCalled();
  });

  it('FE-TOP-005 toggles theme from light to dark', () => {
    render(<Topbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(mockStoreState.setTheme).toHaveBeenCalledWith('dark');
  });

  it('FE-TOP-006 opens reset modal and confirms reset', () => {
    render(<Topbar />);

    fireEvent.click(screen.getByRole('button', { name: /New Trip/i }));
    expect(screen.getByText('Start a new trip?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete & Start Fresh' }));

    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
  });

  it('FE-TOP-007 cancels reset modal without resetting trip', () => {
    render(<Topbar />);

    fireEvent.click(screen.getByRole('button', { name: /New Trip/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    expect(screen.queryByText('Start a new trip?')).not.toBeInTheDocument();
  });
});