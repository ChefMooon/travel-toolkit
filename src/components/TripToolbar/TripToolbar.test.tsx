/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TripToolbar from '@/components/TripToolbar';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

import { useTripStore } from '@/store/tripStore';

const mockStoreState = {
  tripName: 'Summer Trip',
  setTripName: vi.fn(),
  globalMarkup: 50,
  setGlobalMarkup: vi.fn(),
  resetTrip: vi.fn(),
};

describe('TripToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.tripName = 'Summer Trip';
    mockStoreState.globalMarkup = 50;

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
    );
  });

  it('FE-TBR-001 renders trip name input pre-filled with tripName', () => {
    render(<TripToolbar />);

    expect(screen.getByLabelText('Trip name')).toHaveValue('Summer Trip');
  });

  it('FE-TBR-002 focusing trip name reveals clear button; clicking it calls setTripName with empty string', () => {
    render(<TripToolbar />);

    fireEvent.focus(screen.getByLabelText('Trip name'));

    const clearButton = screen.getByLabelText('Clear trip name');
    fireEvent.click(clearButton);

    expect(mockStoreState.setTripName).toHaveBeenCalledWith('');
  });

  it('FE-TBR-003 typing in the trip name input calls setTripName with the entered value', () => {
    render(<TripToolbar />);

    fireEvent.change(screen.getByLabelText('Trip name'), {
      target: { value: 'Autumn Adventure' },
    });

    expect(mockStoreState.setTripName).toHaveBeenCalledWith('Autumn Adventure');
  });

  it('FE-TBR-004 clicking markup toggle shows editing input pre-filled with globalMarkup', () => {
    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /Markup/i }));

    expect(screen.getByLabelText('Global markup percentage')).toHaveValue(50);
  });

  it('FE-TBR-005 blurring markup input with negative value does not call setGlobalMarkup', () => {
    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /Markup/i }));

    const markupInput = screen.getByLabelText('Global markup percentage');
    fireEvent.change(markupInput, { target: { value: '-10' } });
    fireEvent.blur(markupInput);

    expect(mockStoreState.setGlobalMarkup).not.toHaveBeenCalled();
  });

  it('FE-TBR-006 clicking New Trip button opens reset confirmation modal', () => {
    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /New Trip/i }));

    expect(screen.getByText('Start a new trip?')).toBeInTheDocument();
  });

  it('FE-TBR-007 confirming reset modal calls resetTrip', () => {
    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /New Trip/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete & Start Fresh' }));

    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
  });
});
