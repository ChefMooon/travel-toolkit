/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TripToolbar from '@/components/TripToolbar';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/store/saveSlotStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/saveSlotStore')>();
  return {
    ...actual,
    useSaveSlotStore: vi.fn(),
  };
});

vi.mock('@/store/toastStore', () => ({
  useToastStore: vi.fn(),
}));

import { useTripStore } from '@/store/tripStore';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';

const mockStoreState = {
  tripId: '123456',
  setTripId: vi.fn(),
  tripName: 'Summer Trip',
  setTripName: vi.fn(),
  globalMarkup: 50,
  setGlobalMarkup: vi.fn(),
  isDirty: false,
  resetTrip: vi.fn(),
  getSnapshot: vi.fn(),
  loadSnapshot: vi.fn(),
  markClean: vi.fn(),
};

const mockSaveStoreState = {
  slots: [null, null, null] as Array<{ tripId: string; data: unknown } | null>,
  labels: ['Slot 1', 'Slot 2', 'Slot 3'],
  saveToSlot: vi.fn(),
};

const mockToastStoreState = {
  pushToast: vi.fn(),
};

describe('TripToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.tripId = '123456';
    mockStoreState.tripName = 'Summer Trip';
    mockStoreState.globalMarkup = 50;
    mockStoreState.isDirty = false;
    mockStoreState.getSnapshot.mockReturnValue({
      tripId: '123456',
      tripName: 'Summer Trip',
      globalMarkup: 50,
      couples: [],
      nonPayingTravellers: [],
      costs: [],
      exchangeRates: [],
      theme: 'light',
      region: 'Europe',
      targetCurrency: 'USD',
    });

    mockSaveStoreState.slots = [null, null, null];
    mockSaveStoreState.saveToSlot.mockReturnValue(true);
    mockToastStoreState.pushToast.mockReset();

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
    );

    (useSaveSlotStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockSaveStoreState) => unknown) => selector(mockSaveStoreState),
    );

    (useToastStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockToastStoreState) => unknown) => selector(mockToastStoreState),
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

  it('shows update-save action when a related slot exists', () => {
    mockSaveStoreState.slots = [
      {
        tripId: '123456',
        data: {
          ...mockStoreState.getSnapshot(),
          tripName: 'Older Version',
        },
      },
      null,
      null,
    ];

    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /New Trip/i }));

    expect(screen.getByRole('button', { name: 'Update Save & Start Fresh' })).toBeInTheDocument();
  });

  it('updates matching save slot then resets when using update-save action', () => {
    const snapshot = mockStoreState.getSnapshot();
    mockSaveStoreState.slots = [
      {
        tripId: '123456',
        data: {
          ...snapshot,
          tripName: 'Older Version',
        },
      },
      null,
      null,
    ];

    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: /New Trip/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Update Save & Start Fresh' }));

    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledWith(0, snapshot);
    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
  });
});
