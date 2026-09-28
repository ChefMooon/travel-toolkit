/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SaveDataPanel from '@/components/SaveDataPanel/SaveDataPanel';
import { importWorkbook } from '@/lib/xlsx/importWorkbook';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import type { ExportableSnapshot } from '@/lib/xlsx/types';
import type { TripSnapshot } from '@/store/types';

vi.mock('@/lib/xlsx/importWorkbook', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/xlsx/importWorkbook')>();
  return {
    ...actual,
    importWorkbook: vi.fn(),
  };
});

const baseSnapshot: TripSnapshot = {
  tripId: '111111',
  tripName: 'Current trip',
  globalMarkup: 66,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  theme: 'light',
  region: 'Europe',
  targetCurrency: 'USD',
};

const savedSnapshot: TripSnapshot = {
  ...baseSnapshot,
  tripId: '222222',
  tripName: 'Saved trip',
};

const importedSnapshot: ExportableSnapshot = {
  ...baseSnapshot,
  tripId: '333333',
  tripName: 'Imported trip',
};

function getSlotActions(slotIndex: number) {
  const heading = screen.getByRole('heading', { name: `Slot ${slotIndex + 1}` });
  const section = heading.closest('section');
  if (!section) {
    throw new Error(`Could not find slot ${slotIndex + 1} section`);
  }
  return within(section);
}

function renderPanel(props: {
  onSaveComplete?: () => void;
  onCancelSaveContinuation?: () => void;
} = {}) {
  return render(<SaveDataPanel open onClose={vi.fn()} {...props} />);
}

describe('SaveDataPanel', () => {
  beforeEach(() => {
    useSaveSlotStore.setState({
      slots: [null, null, null],
      labels: ['Slot 1', 'Slot 2', 'Slot 3'],
    });
    useTripStore.getState().loadSnapshot(baseSnapshot);
    useTripStore.getState().markClean();
    useToastStore.getState().clearToasts();
    vi.mocked(importWorkbook).mockResolvedValue({ snapshot: importedSnapshot, warnings: [] });
  });

  it('calls the completion callback once after saving to an empty slot without a duplicate toast', () => {
    const onSaveComplete = vi.fn(() => {
      useToastStore.getState().pushToast({
        type: 'success',
        title: 'Trip saved for new trip',
        message: 'The current trip is ready to be replaced.',
      });
    });

    renderPanel({ onSaveComplete });
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Save Here' }));

    expect(onSaveComplete).toHaveBeenCalledTimes(1);
    expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(baseSnapshot);
    expect(useTripStore.getState().isDirty).toBe(false);
    expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual([
      'Trip saved for new trip',
    ]);
  });

  it('calls the completion callback only after a confirmed overwrite succeeds', () => {
    useSaveSlotStore.getState().saveToSlot(0, {
      ...baseSnapshot,
      tripName: 'Older version',
    });
    const onSaveComplete = vi.fn();

    renderPanel({ onSaveComplete });
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));

    expect(onSaveComplete).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));

    expect(onSaveComplete).toHaveBeenCalledTimes(1);
    expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(baseSnapshot);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('does not call the completion callback or save when an overwrite is cancelled', () => {
    const olderSnapshot = { ...baseSnapshot, tripName: 'Older version' };
    useSaveSlotStore.getState().saveToSlot(0, olderSnapshot);
    const onSaveComplete = vi.fn();

    renderPanel({ onSaveComplete });
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));

    const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

    expect(onSaveComplete).not.toHaveBeenCalled();
    expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(olderSnapshot);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('does not call the completion callback or show success when the save is rejected', () => {
    useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
    const onSaveComplete = vi.fn();

    renderPanel({ onSaveComplete });
    fireEvent.click(getSlotActions(1).getByRole('button', { name: 'Save Here' }));

    expect(onSaveComplete).not.toHaveBeenCalled();
    expect(useSaveSlotStore.getState().slots[1]).toBeNull();
    expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual([
      'Duplicate trip ID',
    ]);
  });

  it('keeps the regular success notification when no completion callback is supplied', () => {
    renderPanel();
    fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Save Here' }));

    expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(baseSnapshot);
    expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['Trip saved']);
  });

  it.each(['load', 'import'] as const)(
    'cancels the pending continuation before %s replaces the workspace and keeps it cancelled for later saves',
    async (replacementAction) => {
      const onSaveComplete = vi.fn();
      const onCancelSaveContinuation = vi.fn(() => {
        expect(useTripStore.getState().tripId).toBe(baseSnapshot.tripId);
      });

      if (replacementAction === 'load') {
        useSaveSlotStore.getState().saveToSlot(0, savedSnapshot);
      }

      renderPanel({ onSaveComplete, onCancelSaveContinuation });

      if (replacementAction === 'load') {
        fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Load' }));
        expect(useTripStore.getState().tripId).toBe(savedSnapshot.tripId);
        useToastStore.getState().clearToasts();

        fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Overwrite' }));
        const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
        fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));
      } else {
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
          expect(useTripStore.getState().tripId).toBe(importedSnapshot.tripId);
        });
        useToastStore.getState().clearToasts();

        fireEvent.click(getSlotActions(0).getByRole('button', { name: 'Save Here' }));
      }

      expect(onCancelSaveContinuation).toHaveBeenCalledTimes(1);
      expect(useTripStore.getState().tripId).not.toBe(baseSnapshot.tripId);
      expect(onSaveComplete).not.toHaveBeenCalled();
      expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['Trip saved']);
    }
  );
});
