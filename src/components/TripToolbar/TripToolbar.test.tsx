/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import TripToolbar from '@/components/TripToolbar';
import { importWorkbook } from '@/lib/xlsx/importWorkbook';
import { useTripStore } from '@/store/tripStore';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import {
  SAVE_SLOT_SCHEMA_VERSION,
  type SaveSlot,
  type TripSnapshot,
} from '@/store/types';
import type { ExportableSnapshot } from '@/lib/xlsx/types';

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

vi.mock('@/lib/xlsx/importWorkbook', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/xlsx/importWorkbook')>();
  return {
    ...actual,
    importWorkbook: vi.fn(),
  };
});

const baseSnapshot: TripSnapshot = {
  tripId: '123456',
  tripName: 'Summer Trip',
  globalMarkup: 50,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'USD',
};

const savedSnapshot: TripSnapshot = {
  ...baseSnapshot,
  tripId: '654321',
  tripName: 'Saved Trip',
};

const importedSnapshot: ExportableSnapshot = {
  ...baseSnapshot,
  tripId: '333333',
  tripName: 'Imported Trip',
};

let activeSnapshot = baseSnapshot;

const mockStoreState = {
  tripId: baseSnapshot.tripId,
  setTripId: vi.fn(),
  tripName: baseSnapshot.tripName,
  setTripName: vi.fn(),
  globalMarkup: baseSnapshot.globalMarkup,
  setGlobalMarkup: vi.fn(),
  isDirty: false,
  dateDraftError: '',
  resetTrip: vi.fn(),
  getSnapshot: vi.fn(() => activeSnapshot),
  loadSnapshot: vi.fn<(snapshot: TripSnapshot) => void>(),
  markClean: vi.fn(),
};
(useTripStore as unknown as { getState: () => typeof mockStoreState }).getState = () => mockStoreState;

const mockSaveStoreState: {
  slots: Array<SaveSlot | null>;
  labels: string[];
  saveToSlot: ReturnType<typeof vi.fn<(slotIndex: number, snapshot: TripSnapshot) => boolean>>;
  loadFromSlot: ReturnType<typeof vi.fn<(slotIndex: number) => TripSnapshot | null>>;
  clearSlot: ReturnType<typeof vi.fn<(slotIndex: number) => void>>;
  swapSlots: ReturnType<typeof vi.fn<(firstSlotIndex: number, secondSlotIndex: number) => void>>;
  renameSlot: ReturnType<typeof vi.fn<(slotIndex: number, label: string) => void>>;
} = {
  slots: [null, null, null],
  labels: ['Slot 1', 'Slot 2', 'Slot 3'],
  saveToSlot: vi.fn<(slotIndex: number, snapshot: TripSnapshot) => boolean>(),
  loadFromSlot: vi.fn<(slotIndex: number) => TripSnapshot | null>(),
  clearSlot: vi.fn<(slotIndex: number) => void>(),
  swapSlots: vi.fn<(firstSlotIndex: number, secondSlotIndex: number) => void>(),
  renameSlot: vi.fn<(slotIndex: number, label: string) => void>(),
};

const mockToastStoreState = {
  pushToast: vi.fn(),
};

function createSlot(snapshot: TripSnapshot, slotIndex: number): SaveSlot {
  return {
    slotIndex,
    schemaVersion: SAVE_SLOT_SCHEMA_VERSION,
    label: `Slot ${slotIndex + 1}`,
    tripId: snapshot.tripId,
    tripName: snapshot.tripName,
    savedAt: new Date().toISOString(),
    coupleCount: snapshot.couples.length,
    costCount: snapshot.costs.length,
    targetCurrency: snapshot.targetCurrency,
    data: snapshot,
  };
}

function getSlotActions(slotIndex: number) {
  const heading = screen.getByRole('heading', { name: `Slot ${slotIndex + 1}` });
  const section = heading.closest('section');
  if (!section) {
    throw new Error(`Could not find slot ${slotIndex + 1} section`);
  }
  return within(section);
}

function startSaveAndNewTrip() {
  fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));
  expect(screen.getByRole('dialog', { name: 'Start a new trip?' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save & Start New Trip' }));
  expect(screen.queryByRole('dialog', { name: 'Start a new trip?' })).not.toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
}

describe('TripToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeSnapshot = baseSnapshot;
    mockStoreState.tripId = baseSnapshot.tripId;
    mockStoreState.tripName = baseSnapshot.tripName;
    mockStoreState.globalMarkup = baseSnapshot.globalMarkup;
    mockStoreState.isDirty = false;
    mockStoreState.dateDraftError = '';
    mockStoreState.getSnapshot.mockImplementation(() => activeSnapshot);
    mockStoreState.loadSnapshot.mockImplementation((snapshot) => {
      activeSnapshot = snapshot;
      mockStoreState.tripId = snapshot.tripId;
      mockStoreState.tripName = snapshot.tripName;
    });

    mockSaveStoreState.slots = [null, null, null];
    mockSaveStoreState.labels = ['Slot 1', 'Slot 2', 'Slot 3'];
    mockSaveStoreState.saveToSlot.mockImplementation((slotIndex, snapshot) => {
      const duplicateIndex = mockSaveStoreState.slots.findIndex(
        (slot, index) => index !== slotIndex && slot?.tripId === snapshot.tripId
      );
      if (duplicateIndex >= 0) {
        mockToastStoreState.pushToast({
          type: 'warning',
          title: 'Duplicate trip ID',
          message: `Trip ID ${snapshot.tripId} is already saved.`,
        });
        return false;
      }

      mockSaveStoreState.slots[slotIndex] = createSlot(snapshot, slotIndex);
      return true;
    });
    mockSaveStoreState.loadFromSlot.mockImplementation(
      (slotIndex) => mockSaveStoreState.slots[slotIndex]?.data ?? null
    );
    mockSaveStoreState.clearSlot.mockReset();
    mockSaveStoreState.swapSlots.mockReset();
    mockSaveStoreState.renameSlot.mockReset();
    mockToastStoreState.pushToast.mockReset();

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );
    Object.assign(useTripStore, { getState: () => mockStoreState });

    (useSaveSlotStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockSaveStoreState) => unknown) => selector(mockSaveStoreState)
    );
    (useToastStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockToastStoreState) => unknown) => selector(mockToastStoreState)
    );

    vi.mocked(importWorkbook).mockResolvedValue({ snapshot: importedSnapshot, warnings: [] });
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

  it('keeps markup editing active while tabbing to and activating its step button', () => {
    render(<TripToolbar />);
    fireEvent.click(screen.getByRole('button', { name: /Markup/i }));
    const input = screen.getByLabelText('Global markup percentage');
    const increase = screen.getByRole('button', { name: 'Increase Global markup percentage' });
    act(() => input.focus());
    fireEvent.blur(input, { relatedTarget: increase });
    expect(input).toBeInTheDocument();
    expect(mockStoreState.setGlobalMarkup).not.toHaveBeenCalled();
    act(() => increase.focus());
    fireEvent.keyDown(increase, { key: 'ArrowUp' });
    fireEvent.click(increase);
    expect(input).toHaveValue(50.1);
    expect(mockStoreState.setGlobalMarkup).not.toHaveBeenCalled();
    fireEvent.blur(increase, { relatedTarget: document.body });
    expect(mockStoreState.setGlobalMarkup).toHaveBeenCalledWith(50.1);
  });

  it('shows the saved slot when the current snapshot is saved, even if the dirty flag is set', () => {
    mockSaveStoreState.slots[0] = createSlot(baseSnapshot, 0);
    mockStoreState.isDirty = true;

    render(<TripToolbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));

    expect(screen.getByText(/This trip is saved in Slot 1/)).toBeInTheDocument();
    expect(screen.getByText(/There are no unsaved changes/)).toBeInTheDocument();
  });

  it('hides the redundant save action and labels the reset action when the trip is already saved', () => {
    mockSaveStoreState.slots[0] = createSlot(baseSnapshot, 0);

    render(<TripToolbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));

    expect(screen.getByRole('button', { name: /^Start New Trip$/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save & Start New Trip' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start Fresh Without Saving' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Start New Trip$/ }));

    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();
  });

  it('identifies the last saved slot when the active snapshot has changed', () => {
    mockSaveStoreState.slots[0] = createSlot(baseSnapshot, 0);
    activeSnapshot = { ...baseSnapshot, tripName: 'Current Draft' };
    mockStoreState.isDirty = false;

    render(<TripToolbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));

    expect(screen.getByText(/This trip has unsaved changes/)).toBeInTheDocument();
    expect(screen.getByText(/last saved version is in Slot 1/)).toBeInTheDocument();
  });

  it('refreshes the save status each time the New Trip decision is opened', () => {
    render(<TripToolbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));

    expect(screen.getByText(/This trip has not been saved to a slot/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    mockSaveStoreState.slots[0] = createSlot(baseSnapshot, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));

    expect(screen.getByText(/This trip is saved in Slot 1/)).toBeInTheDocument();
  });

  it('offers Save & Start New Trip for trips without a matching save and opens only the save manager', () => {
    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));

    expect(screen.getByRole('dialog', { name: 'Start a new trip?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save & Start New Trip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Fresh Without Saving' })).toBeInTheDocument();
    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save & Start New Trip' }));

    expect(screen.queryByRole('dialog', { name: 'Start a new trip?' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();
    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
  });

  it('starts fresh only after the explicit no-save confirmation', () => {
    render(<TripToolbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start Fresh Without Saving' }));

    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();
  });

  it('warns before discarding an invalid date draft when starting fresh', () => {
    mockStoreState.dateDraftError = 'End date must be on or after the start date.';
    render(<TripToolbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start Fresh Without Saving' }));
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(expect.objectContaining({
      type: 'warning', title: 'Trip dates need attention',
    }));
    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
  });

  it('saves an empty slot before resetting and emits one contextual success notification', () => {
    render(<TripToolbar />);
    startSaveAndNewTrip();

    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Save Here' }));

    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledTimes(1);
    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledWith(0, baseSnapshot);
    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Save Data Slots' })).not.toBeInTheDocument();
    expect(mockToastStoreState.pushToast).toHaveBeenCalledTimes(1);
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Saved and started new trip',
      message: 'Your current trip was saved before starting a new one.',
    });
  });

  it('uses the manager overwrite confirmation for an existing related save', () => {
    mockSaveStoreState.slots[0] = createSlot(
      { ...baseSnapshot, tripName: 'Older Version' },
      0
    );

    render(<TripToolbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Start new trip' }));
    expect(screen.getByRole('button', { name: 'Save & Start New Trip' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update Save & Start Fresh' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save & Start New Trip' }));
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));

    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();
    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));

    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledTimes(1);
    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledWith(0, baseSnapshot);
    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
    expect(mockToastStoreState.pushToast).toHaveBeenCalledTimes(1);
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved and started new trip' })
    );
  });

  it('keeps the manager open and the current trip intact when an overwrite is cancelled', () => {
    mockSaveStoreState.slots[0] = createSlot(
      { ...baseSnapshot, tripName: 'Older Version' },
      0
    );

    render(<TripToolbar />);
    startSaveAndNewTrip();
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));
    const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();
    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    expect(mockToastStoreState.pushToast).not.toHaveBeenCalled();

    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Overwrite slot data?' })).getByRole('button', {
        name: 'Confirm',
      })
    );
    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledTimes(1);
    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
  });

  it('does not reset when the store rejects a save to a different slot for a duplicate trip ID', () => {
    mockSaveStoreState.slots[0] = createSlot(
      { ...baseSnapshot, tripName: 'Older Version' },
      0
    );

    render(<TripToolbar />);
    startSaveAndNewTrip();
    fireEvent.click(getSlotActions(1).getByRole('button', { name: 'Save Here' }));

    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledWith(1, baseSnapshot);
    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Duplicate trip ID' })
    );
  });

  it('returns to the New Trip decision on manager close and requires an explicit fresh choice to re-arm', () => {
    render(<TripToolbar />);
    startSaveAndNewTrip();

    fireEvent.click(screen.getByRole('button', { name: 'Close save data panel' }));
    expect(screen.queryByRole('dialog', { name: 'Save Data Slots' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Start a new trip?' })).toBeInTheDocument();
    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    expect(mockSaveStoreState.saveToSlot).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save & Start New Trip' }));
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Save Here' }));

    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledTimes(1);
    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
  });

  it('keeps ordinary Save Data Slots use save-only after closing and cancelling a New Trip flow', () => {
    render(<TripToolbar />);

    startSaveAndNewTrip();
    fireEvent.click(screen.getByRole('button', { name: 'Close save data panel' }));
    expect(screen.getByRole('dialog', { name: 'Start a new trip?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open save slots' }));
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Save Here' }));

    expect(mockSaveStoreState.saveToSlot).toHaveBeenCalledTimes(1);
    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Trip saved' })
    );
    expect(mockToastStoreState.pushToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved and started new trip' })
    );
  });

  it('keeps the manager open and cancels the continuation after loading another trip', () => {
    mockSaveStoreState.slots[0] = createSlot(savedSnapshot, 0);

    render(<TripToolbar />);
    startSaveAndNewTrip();
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Load' }));

    expect(mockStoreState.loadSnapshot).toHaveBeenCalledWith(savedSnapshot);
    expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    mockToastStoreState.pushToast.mockClear();

    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));
    const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));

    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Trip saved' })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close save data panel' }));
    expect(screen.getByRole('dialog', { name: 'Start a new trip?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save & Start New Trip' }));
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Overwrite slot data?' })).getByRole('button', {
        name: 'Confirm',
      })
    );

    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved and started new trip' })
    );
  });

  it('keeps the manager open and cancels the continuation after importing another trip', async () => {
    render(<TripToolbar />);
    startSaveAndNewTrip();

    const fileInput = document.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Could not find the import file input');
    }
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['workbook'], 'trip.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })],
      },
    });

    await waitFor(() => {
      expect(mockStoreState.loadSnapshot).toHaveBeenCalledWith({
        ...importedSnapshot,
      });
    });
    expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    mockToastStoreState.pushToast.mockClear();

    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Save Here' }));

    expect(mockStoreState.resetTrip).not.toHaveBeenCalled();
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Trip saved' })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close save data panel' }));
    expect(screen.getByRole('dialog', { name: 'Start a new trip?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save & Start New Trip' }));
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Overwrite slot data?' })).getByRole('button', {
        name: 'Confirm',
      })
    );

    expect(mockStoreState.resetTrip).toHaveBeenCalledTimes(1);
    expect(mockToastStoreState.pushToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved and started new trip' })
    );
  });
});
