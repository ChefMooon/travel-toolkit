/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Topbar from '@/components/Topbar';

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

vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

import { useTripStore } from '@/store/tripStore';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';

const mockStoreState = {
  tripId: '123456',
  tripName: 'Spring Trip',
  setTripName: vi.fn(),
  globalMarkup: 66,
  setGlobalMarkup: vi.fn(),
  theme: 'light' as 'light' | 'dark',
  setTheme: vi.fn(),
  isDirty: false,
  getSnapshot: vi.fn(),
  resetTrip: vi.fn(),
};

const mockSaveStoreState = {
  slots: [null, null, null] as Array<{ tripId: string; data: unknown } | null>,
  labels: ['Slot 1', 'Slot 2', 'Slot 3'],
  saveToSlot: vi.fn(),
};

const mockToastStoreState = {
  pushToast: vi.fn(),
};

describe('Topbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.tripName = 'Spring Trip';
    mockStoreState.globalMarkup = 66;
    mockStoreState.theme = 'light';
    mockStoreState.isDirty = false;
    mockStoreState.getSnapshot.mockReturnValue({
      tripId: '123456',
      tripName: 'Spring Trip',
      globalMarkup: 66,
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
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );

    (useSaveSlotStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockSaveStoreState) => unknown) => selector(mockSaveStoreState),
    );

    (useToastStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockToastStoreState) => unknown) => selector(mockToastStoreState),
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

    const saveSlotsButton = screen.getByRole('button', { name: 'Open save slots' });
    expect(saveSlotsButton).not.toHaveAttribute('title');
    fireEvent.focus(saveSlotsButton);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Save slots');

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

    render(<Topbar />);

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

    render(<Topbar />);

    fireEvent.click(screen.getByRole('button', { name: /New Trip/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Update Save & Start Fresh' }));

    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledWith(0, snapshot);
    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
  });
});