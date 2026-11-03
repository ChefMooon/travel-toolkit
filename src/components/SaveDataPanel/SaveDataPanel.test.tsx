/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SaveDataPanel from '@/components/SaveDataPanel/SaveDataPanel';
import ToastViewport from '@/components/ToastViewport';
import { exportWorkbook } from '@/lib/xlsx/exportWorkbook';
import { buildExportFilename } from '@/lib/xlsx/filename';
import { importWorkbook } from '@/lib/xlsx/importWorkbook';
import { clearImportedTripGuard, markImportedTripMatchesSlot, shouldConfirmFirstSave } from '@/store/importedTripGuard';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import type { ExportableSnapshot } from '@/lib/xlsx/types';
import type { TripSnapshot } from '@/store/types';
import { clearSlotDetailsCache } from './useSlotDetails';

vi.mock('@/lib/xlsx/importWorkbook', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/xlsx/importWorkbook')>();
  return {
    ...actual,
    importWorkbook: vi.fn(),
  };
});

vi.mock('@/lib/xlsx/exportWorkbook', () => ({
  exportWorkbook: vi.fn(),
}));

const baseSnapshot: TripSnapshot = {
  tripId: '111111',
  tripName: 'Current trip',
  globalMarkup: 66,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
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

const otherSnapshot: TripSnapshot = {
  ...baseSnapshot,
  tripId: '444444',
  tripName: 'Other trip',
};

const sanitized = (snapshot: TripSnapshot) => ({ ...snapshot, tripStartDate: '', tripEndDate: '' });

function card(slotIndex: number) {
  const element = document.querySelector<HTMLElement>(`[data-slot-index="${slotIndex}"]`);
  if (!element) {
    throw new Error(`Could not find the slot ${slotIndex + 1} card`);
  }
  return within(element);
}

function header() {
  return within(document.querySelector<HTMLElement>('.save-panel-header')!);
}

function openMenu(slotIndex: number, label = `Slot ${slotIndex + 1}`) {
  fireEvent.click(card(slotIndex).getByRole('button', { name: `More actions for ${label}` }));
  return screen.getByRole('menu', { name: `${label} actions` });
}

function toastTitles() {
  return useToastStore.getState().toasts.map((toast) => toast.title);
}

function renderPanel(props: {
  onSaveComplete?: () => void;
  onCancelSaveContinuation?: () => void;
  onClose?: () => void;
  mode?: 'browse' | 'pick';
} = {}) {
  return render(<SaveDataPanel open onClose={props.onClose ?? vi.fn()} {...props} />);
}

describe('SaveDataPanel', () => {
  beforeEach(() => {
    useSettingsStore.getState().setThemePreference('system');
    useSettingsStore.getState().setExportSchema('single-sheet');
    useSettingsStore.getState().setExportFilenamePreset('tripId');
    useSettingsStore.getState().setExportIncludeDate(true);
    useSettingsStore.getState().setImportExchangeRateMode('hybrid');
    clearImportedTripGuard();
    useSaveSlotStore.setState({
      slots: [null, null, null],
      labels: ['Slot 1', 'Slot 2', 'Slot 3'],
    });
    useTripStore.getState().loadSnapshot(baseSnapshot);
    useTripStore.getState().markClean();
    useTripStore.setState({ dateDraftError: '' });
    useToastStore.getState().clearToasts();
    vi.mocked(importWorkbook).mockReset();
    vi.mocked(importWorkbook).mockResolvedValue({ snapshot: importedSnapshot, warnings: [] });
    vi.mocked(exportWorkbook).mockReset();
    vi.mocked(exportWorkbook).mockResolvedValue(undefined);
  });

  it('closes only the nested settings dialog on Escape', () => {
    const onClose = vi.fn();
    render(<SaveDataPanel open onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const settingsButton = screen.getByRole('button', { name: 'Import / Export Settings' });
    settingsButton.focus();
    fireEvent.click(settingsButton);
    expect(screen.getByRole('dialog', { name: 'Import / Export Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close settings' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Import / Export Settings' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import / Export Settings' })).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();
  });

  describe('save continuation', () => {
    it('calls the completion callback once after saving to an empty slot without a duplicate toast', () => {
      const onSaveComplete = vi.fn(() => {
        useToastStore.getState().pushToast({
          type: 'success',
          title: 'Trip saved for new trip',
          message: 'The current trip is ready to be replaced.',
        });
      });

      renderPanel({ onSaveComplete });
      fireEvent.click(card(0).getByRole('button', { name: 'Save current trip here' }));

      expect(onSaveComplete).toHaveBeenCalledTimes(1);
      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(baseSnapshot));
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(toastTitles()).toEqual(['Trip saved for new trip']);
    });

    it('calls the completion callback once after a quick save to the home slot, without the Undo toast', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...baseSnapshot, tripName: 'Older version' });
      const onSaveComplete = vi.fn();

      renderPanel({ onSaveComplete });
      fireEvent.click(card(0).getByRole('button', { name: 'Save' }));

      expect(onSaveComplete).toHaveBeenCalledTimes(1);
      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(baseSnapshot));
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('calls the completion callback only after a confirmed overwrite succeeds', () => {
      useSaveSlotStore.getState().saveToSlot(0, otherSnapshot);
      const onSaveComplete = vi.fn();

      renderPanel({ onSaveComplete });
      fireEvent.click(header().getByRole('button', { name: 'Save…' }));
      fireEvent.click(card(0).getByRole('button', { name: 'Overwrite…' }));

      expect(onSaveComplete).not.toHaveBeenCalled();
      expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(otherSnapshot.tripId);
      const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
      expect(confirmation).toHaveAccessibleDescription('Slot 1 holds “Other trip”. Replace it with “Current trip”?');
      fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));

      expect(onSaveComplete).toHaveBeenCalledTimes(1);
      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(baseSnapshot));
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('fires the completion callback exactly once, and only after confirming the first save over an imported trip slot', () => {
      // The panel cancels its own continuation when it imports, so the guard is armed directly: the
      // live trip stands for one imported earlier whose ID already sits in Slot 1.
      useSaveSlotStore.getState().saveToSlot(0, { ...baseSnapshot, tripName: 'Older version' });
      markImportedTripMatchesSlot(baseSnapshot.tripId);
      const onSaveComplete = vi.fn();

      const { rerender } = renderPanel({ onSaveComplete });
      fireEvent.click(header().getByRole('button', { name: 'Save' }));

      const confirmation = screen.getByRole('dialog', { name: 'Overwrite Slot 1 with the imported trip?' });
      expect(onSaveComplete).not.toHaveBeenCalled();
      expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Older version');

      fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));
      expect(onSaveComplete).toHaveBeenCalledTimes(1);
      expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe(baseSnapshot.tripName);
      expect(screen.queryByRole('dialog', { name: 'Overwrite Slot 1 with the imported trip?' })).not.toBeInTheDocument();
      // The continuation owns the outcome: no Undo toast alongside it.
      expect(useToastStore.getState().toasts).toHaveLength(0);

      // Re-rendering does not replay it.
      rerender(<SaveDataPanel open onClose={vi.fn()} onSaveComplete={onSaveComplete} />);
      expect(onSaveComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call the completion callback or save when an overwrite is cancelled', () => {
      useSaveSlotStore.getState().saveToSlot(0, otherSnapshot);
      const onSaveComplete = vi.fn();

      renderPanel({ onSaveComplete });
      fireEvent.click(header().getByRole('button', { name: 'Save…' }));
      fireEvent.click(card(0).getByRole('button', { name: 'Overwrite…' }));

      const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
      fireEvent.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

      expect(onSaveComplete).not.toHaveBeenCalled();
      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(otherSnapshot));
      expect(useToastStore.getState().toasts).toHaveLength(0);
      // Still picking: the overwrite can be retried.
      expect(card(0).getByRole('button', { name: 'Overwrite…' })).toBeInTheDocument();
    });

    it('does not call the completion callback or show success when the save is rejected as a duplicate', () => {
      const olderVersion = { ...baseSnapshot, tripName: 'Older version' };
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      const onSaveComplete = vi.fn();

      renderPanel({ onSaveComplete, mode: 'pick' });
      fireEvent.click(card(1).getByRole('button', { name: 'Overwrite…' }));
      // The trip lands in another slot while the confirm is open (a genuine duplicate at write time).
      act(() => { useSaveSlotStore.getState().saveToSlot(0, olderVersion); });
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Overwrite slot data?' })).getByRole('button', { name: 'Confirm' }));

      const duplicate = screen.getByRole('dialog', { name: 'This trip is already in Slot 1' });
      expect(onSaveComplete).not.toHaveBeenCalled();
      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(olderVersion));
      expect(useSaveSlotStore.getState().slots[1]?.data).toEqual(sanitized(otherSnapshot));
      expect(useToastStore.getState().toasts).toHaveLength(0);

      fireEvent.click(within(duplicate).getByRole('button', { name: 'Cancel' }));
      expect(onSaveComplete).not.toHaveBeenCalled();
      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(olderVersion));
      expect(useSaveSlotStore.getState().slots[1]?.data).toEqual(sanitized(otherSnapshot));
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('keeps the regular success notification when no completion callback is supplied', () => {
      renderPanel();
      fireEvent.click(card(0).getByRole('button', { name: 'Save current trip here' }));

      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(baseSnapshot));
      expect(toastTitles()).toEqual(['Trip saved']);
    });

    it('does not complete the continuation for a copy of another slot', () => {
      useSaveSlotStore.getState().saveToSlot(0, otherSnapshot);
      const onSaveComplete = vi.fn();

      renderPanel({ onSaveComplete });
      fireEvent.click(within(openMenu(0)).getByRole('menuitem', { name: 'Save as copy…' }));
      fireEvent.click(card(1).getByRole('button', { name: 'Save a copy here' }));

      expect(useSaveSlotStore.getState().slots[1]?.tripName).toBe('Other trip (copy)');
      expect(onSaveComplete).not.toHaveBeenCalled();
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
          fireEvent.click(card(0).getByRole('button', { name: 'Load' }));
          expect(useTripStore.getState().tripId).toBe(savedSnapshot.tripId);
          useToastStore.getState().clearToasts();

          // Edit the loaded trip, then quick-save it back to its home slot.
          act(() => useTripStore.getState().setGlobalMarkup(12));
          fireEvent.click(card(0).getByRole('button', { name: 'Save' }));
          expect(useSaveSlotStore.getState().slots[0]?.data.globalMarkup).toBe(12);
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
          fireEvent.click(within(screen.getByRole('dialog', { name: 'Import trip from file?' })).getByRole('button', { name: 'Import' }));

          await waitFor(() => {
            expect(useTripStore.getState().tripId).toBe(importedSnapshot.tripId);
          });
          useToastStore.getState().clearToasts();

          fireEvent.click(card(0).getByRole('button', { name: 'Save current trip here' }));
          expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(importedSnapshot.tripId);
        }

        expect(onCancelSaveContinuation).toHaveBeenCalledTimes(1);
        expect(useTripStore.getState().tripId).not.toBe(baseSnapshot.tripId);
        expect(useSettingsStore.getState().themePreference).toBe('system');
        expect(onSaveComplete).not.toHaveBeenCalled();
        expect(toastTitles()).toEqual(['Trip saved']);
      }
    );
  });

  describe('cards', () => {
    it('shows a home card with quick save, other trips with Load, and empty slots with a save action', () => {
      const dated = { ...baseSnapshot, tripStartDate: '2026-06-04', tripEndDate: '2026-06-16' };
      useTripStore.getState().loadSnapshot(dated);
      useSaveSlotStore.getState().saveToSlot(0, dated);
      useSaveSlotStore.getState().saveToSlot(1, {
        ...otherSnapshot,
        couples: [{ id: 'c1', name: 'A', colorIndex: 1, iconIndex: 1, sortOrder: 0 }],
        nonPayingTravellers: [{ id: 'n1', label: 'Kid', coupleId: 'c1' }],
      });
      renderPanel();

      expect(card(0).getByText('Active trip')).toBeInTheDocument();
      expect(card(0).getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-disabled', 'true');
      expect(card(0).getByText('Jun 4 – 16, 2026')).toBeInTheDocument();
      expect(card(0).getByText('TT-01')).toBeInTheDocument();
      expect(card(0).getByText('111111')).toBeInTheDocument();
      expect(card(0).getByText('Local')).toBeInTheDocument();
      expect(card(0).getByRole('heading', { name: 'Slot 1: Current trip' })).toBeInTheDocument();

      expect(card(1).getByText('Boarding pass')).toBeInTheDocument();
      expect(card(1).getByRole('button', { name: 'Load' })).toBeInTheDocument();
      expect(card(1).getByText('1 group')).toBeInTheDocument();
      expect(card(1).getByText('1 child')).toBeInTheDocument();
      expect(card(1).queryByText('Dates')).not.toBeInTheDocument();
      expect(card(1).getByText('Home currency USD, trip currency USD')).toBeInTheDocument();

      expect(card(2).getByText('TT-03')).toBeInTheDocument();
      expect(card(2).getByText('—')).toBeInTheDocument();
      // The live trip has a home, so an empty slot offers a copy rather than a second save.
      expect(card(2).getByRole('button', { name: 'Save a copy here' })).toBeInTheDocument();
    });

    it('asks before loading over unsaved work even when the dirty flag is clear', () => {
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      // Content that was never saved (e.g. after a reload) counts as unsaved work.
      act(() => {
        useTripStore.getState().loadSnapshot({ ...baseSnapshot, couples: [{ id: 'c1', name: 'A', colorIndex: 1, iconIndex: 1, sortOrder: 0 }] });
      });
      expect(useTripStore.getState().isDirty).toBe(false);
      renderPanel();

      fireEvent.click(card(1).getByRole('button', { name: 'Load' }));
      const confirmation = screen.getByRole('dialog', { name: 'Load saved trip?' });
      expect(useTripStore.getState().tripId).toBe(baseSnapshot.tripId);
      fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));
      expect(useTripStore.getState().tripId).toBe(otherSnapshot.tripId);
    });

    it('renames the home trip together with the live trip without marking a clean trip dirty', () => {
      useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
      const savedAt = useSaveSlotStore.getState().slots[0]!.savedAt;
      renderPanel();

      fireEvent.click(card(0).getByRole('button', { name: 'Current trip' }));
      const input = card(0).getByRole('textbox', { name: 'Trip name' });
      fireEvent.change(input, { target: { value: '  Lisbon  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Lisbon');
      expect(useSaveSlotStore.getState().slots[0]?.savedAt).toBe(savedAt);
      expect(useTripStore.getState().tripName).toBe('Lisbon');
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(screen.getByRole('status')).toHaveTextContent('All changes saved (Slot 1)');
      expect(card(0).getByRole('button', { name: 'Lisbon' })).toHaveFocus();
    });

    it('renames both when the live trip is dirty and leaves it dirty', () => {
      useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
      act(() => useTripStore.getState().setGlobalMarkup(10));
      renderPanel();

      fireEvent.click(card(0).getByRole('button', { name: 'Current trip' }));
      const input = card(0).getByRole('textbox', { name: 'Trip name' });
      fireEvent.change(input, { target: { value: 'Lisbon' } });
      fireEvent.blur(input);

      expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Lisbon');
      expect(useTripStore.getState().tripName).toBe('Lisbon');
      expect(useTripStore.getState().isDirty).toBe(true);
    });

    it('renames another slot’s trip without touching the live trip', () => {
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      renderPanel();

      fireEvent.click(card(1).getByRole('button', { name: 'Other trip' }));
      const input = card(1).getByRole('textbox', { name: 'Trip name' });
      fireEvent.change(input, { target: { value: 'Porto' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(useSaveSlotStore.getState().slots[1]?.tripName).toBe('Porto');
      expect(useTripStore.getState().tripName).toBe('Current trip');
    });
  });

  describe('quick save', () => {
    it('saves to the home slot from the header with an Undo toast that restores the older version', () => {
      const olderVersion = { ...baseSnapshot, tripName: 'Older version' };
      useSaveSlotStore.getState().saveToSlot(0, olderVersion);
      act(() => useTripStore.getState().setGlobalMarkup(10));
      renderPanel();
      expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');

      fireEvent.click(header().getByRole('button', { name: 'Save' }));

      expect(useSaveSlotStore.getState().slots[0]?.data.globalMarkup).toBe(10);
      expect(useTripStore.getState().isDirty).toBe(false);
      expect(screen.getByRole('status')).toHaveTextContent('All changes saved (Slot 1)');
      const [toast] = useToastStore.getState().toasts;
      expect(toast).toMatchObject({ title: 'Trip saved', message: 'Saved to Slot 1.', action: { label: 'Undo' } });

      act(() => toast!.action!.onAction());

      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(olderVersion));
      // The restored slot differs from the live trip again, so the edits read as unsaved.
      expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');
      expect(card(0).getByRole('button', { name: 'Save' })).not.toHaveAttribute('aria-disabled');
      // isDirty (used by the unsaved-changes guard) agrees with the status again.
      expect(useTripStore.getState().isDirty).toBe(true);
    });

    it('reports an already saved trip instead of writing again', () => {
      useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
      const before = useSaveSlotStore.getState().slots;
      renderPanel();

      fireEvent.click(header().getByRole('button', { name: 'Save' }));

      expect(useSaveSlotStore.getState().slots).toBe(before);
      expect(useToastStore.getState().toasts[0]).toMatchObject({ title: 'No changes to save', message: 'Already saved to Slot 1.' });
    });

    it('enters pick mode from the header when the trip has no home slot', () => {
      renderPanel();
      fireEvent.click(header().getByRole('button', { name: 'Save…' }));

      expect(screen.getByText('Choose a slot for “Current trip”')).toBeInTheDocument();
      expect(card(0).getByRole('button', { name: 'Save here' })).toHaveFocus();
      fireEvent.click(card(1).getByRole('button', { name: 'Save here' }));

      expect(useSaveSlotStore.getState().slots[1]?.tripId).toBe(baseSnapshot.tripId);
      expect(screen.queryByText('Choose a slot for “Current trip”')).not.toBeInTheDocument();
      expect(toastTitles()).toEqual(['Trip saved']);
    });

    it.each(['header', 'card'] as const)(
      'asks once before the first %s quick save over the slot an import matched',
      async (from) => {
        useSaveSlotStore.getState().saveToSlot(0, { ...importedSnapshot, tripName: 'Older import' });
        renderPanel();
        fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['x'], 'trip.xlsx')] } });
        fireEvent.click(within(screen.getByRole('dialog', { name: 'Import trip from file?' })).getByRole('button', { name: 'Import' }));
        await waitFor(() => expect(useTripStore.getState().tripId).toBe(importedSnapshot.tripId));
        useToastStore.getState().clearToasts();
        const save = () => fireEvent.click((from === 'header' ? header() : card(0)).getByRole('button', { name: 'Save' }));

        save();
        const confirmation = screen.getByRole('dialog', { name: 'Overwrite Slot 1 with the imported trip?' });
        expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Older import');
        fireEvent.click(within(confirmation).getByRole('button', { name: 'Cancel' }));
        expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Older import');

        save();
        fireEvent.click(within(screen.getByRole('dialog', { name: 'Overwrite Slot 1 with the imported trip?' })).getByRole('button', { name: 'Confirm' }));
        expect(useSaveSlotStore.getState().slots[0]?.tripName).toBe('Imported trip');
        expect(shouldConfirmFirstSave(importedSnapshot.tripId)).toBe(false);

        act(() => useTripStore.getState().setGlobalMarkup(5));
        save();
        expect(screen.queryByRole('dialog', { name: 'Overwrite Slot 1 with the imported trip?' })).not.toBeInTheDocument();
        expect(useSaveSlotStore.getState().slots[0]?.data.globalMarkup).toBe(5);
      }
    );
  });

  describe('menu', () => {
    it('labels the trigger, points it at the menu only while open and renders the menu in the layer', () => {
      useSaveSlotStore.getState().saveToSlot(0, otherSnapshot);
      renderPanel();
      const trigger = card(0).getByRole('button', { name: 'More actions for Slot 1' });
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).not.toHaveAttribute('aria-controls');

      const menu = openMenu(0);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('aria-controls', menu.id);
      expect(menu.closest('.save-panel-layer')).not.toBeNull();
      expect(menu.closest('.save-panel-list')).toBeNull();
      expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
        'Rename slot', 'Export this trip', 'Move…', 'Save as copy…', 'Clear slot',
      ]);

      fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    });

    it('offers only Rename slot for an empty slot and opens the seat editor from it', () => {
      renderPanel();
      const menu = openMenu(2);
      expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Rename slot']);

      fireEvent.click(within(menu).getByRole('menuitem', { name: 'Rename slot' }));
      const input = card(2).getByRole('textbox', { name: 'Slot name' });
      expect(input).toHaveFocus();
      fireEvent.change(input, { target: { value: 'Weekend' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(useSaveSlotStore.getState().labels[2]).toBe('Weekend');
      expect(card(2).getByRole('button', { name: 'More actions for Weekend' })).toBeInTheDocument();
    });

    it('clears a slot only after the confirmation', () => {
      useSaveSlotStore.getState().saveToSlot(0, otherSnapshot);
      renderPanel();
      fireEvent.click(within(openMenu(0)).getByRole('menuitem', { name: 'Clear slot' }));

      const confirmation = screen.getByRole('dialog', { name: 'Clear this slot?' });
      expect(useSaveSlotStore.getState().slots[0]).not.toBeNull();
      fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));

      expect(useSaveSlotStore.getState().slots[0]).toBeNull();
      expect(toastTitles()).toEqual(['Slot cleared']);
    });

    it('opens the export popover with that slot as the source', () => {
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      renderPanel();
      fireEvent.click(within(openMenu(1)).getByRole('menuitem', { name: 'Export this trip' }));

      const popover = screen.getByRole('dialog', { name: 'Export to spreadsheet' });
      expect(within(popover).getByRole('combobox', { name: 'Source' })).toHaveTextContent('Slot 2 · Other trip');
    });
  });

  describe('move', () => {
    beforeEach(() => {
      useSaveSlotStore.getState().saveToSlot(0, savedSnapshot);
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      useSaveSlotStore.getState().renameSlot(0, 'Alpha');
    });

    it('swaps without a confirm, keeps labels with their positions and undoes slots and labels', () => {
      renderPanel();
      const labelsBefore = useSaveSlotStore.getState().labels;
      fireEvent.click(within(openMenu(0, 'Alpha')).getByRole('menuitem', { name: 'Move…' }));

      expect(screen.getByText('Moving “Saved trip”. Choose a slot to swap with. Press Escape to cancel.')).toBeInTheDocument();
      expect(card(0).queryByRole('button', { name: /Swap here/ })).not.toBeInTheDocument();
      expect(card(2).getByRole('button', { name: 'Move here to Slot 3' })).toBeInTheDocument();
      fireEvent.click(card(1).getByRole('button', { name: 'Swap here with Slot 2' }));

      expect(screen.queryByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      const { slots, labels } = useSaveSlotStore.getState();
      expect(slots[0]?.tripId).toBe(otherSnapshot.tripId);
      expect(slots[1]?.tripId).toBe(savedSnapshot.tripId);
      expect(labels).toEqual(['Alpha', 'Slot 2', 'Slot 3']);
      expect(slots[0]?.label).toBe('Alpha');
      expect(slots[1]?.label).toBe('Slot 2');
      expect(card(1).getByRole('button', { name: 'More actions for Slot 2' })).toHaveFocus();

      const [toast] = useToastStore.getState().toasts;
      expect(toast).toMatchObject({ title: 'Slots swapped', message: 'Swapped Alpha and Slot 2.', action: { label: 'Undo' } });
      act(() => toast!.action!.onAction());

      expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(savedSnapshot.tripId);
      expect(useSaveSlotStore.getState().slots[0]?.label).toBe('Alpha');
      expect(useSaveSlotStore.getState().slots[1]?.tripId).toBe(otherSnapshot.tripId);
      expect(useSaveSlotStore.getState().labels).toEqual(labelsBefore);
    });

    it('moves to an empty slot', () => {
      renderPanel();
      fireEvent.click(within(openMenu(0, 'Alpha')).getByRole('menuitem', { name: 'Move…' }));
      fireEvent.click(card(2).getByRole('button', { name: 'Move here to Slot 3' }));

      expect(useSaveSlotStore.getState().slots[0]).toBeNull();
      expect(useSaveSlotStore.getState().slots[2]?.tripId).toBe(savedSnapshot.tripId);
      expect(useToastStore.getState().toasts[0]).toMatchObject({ title: 'Trip moved', message: 'Moved “Saved trip” to Slot 3.' });
    });

    it('refuses the Undo once something else wrote to the slots', () => {
      renderPanel();
      fireEvent.click(within(openMenu(0, 'Alpha')).getByRole('menuitem', { name: 'Move…' }));
      fireEvent.click(card(1).getByRole('button', { name: 'Swap here with Slot 2' }));
      const [toast] = useToastStore.getState().toasts;
      act(() => useSaveSlotStore.getState().renameSlot(2, 'Later'));

      act(() => toast!.action!.onAction());

      expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(otherSnapshot.tripId);
      expect(toastTitles()).toContain('Could not undo');
    });

    it('leaves move mode on Escape (or Cancel) without closing the panel', () => {
      const onClose = vi.fn();
      renderPanel({ onClose });
      fireEvent.click(within(openMenu(0, 'Alpha')).getByRole('menuitem', { name: 'Move…' }));
      const target = card(1).getByRole('button', { name: 'Swap here with Slot 2' });
      expect(target).toHaveFocus();

      fireEvent.keyDown(target, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: /Swap here/ })).not.toBeInTheDocument();
      expect(card(0).getByRole('button', { name: 'More actions for Alpha' })).toHaveFocus();
      expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(savedSnapshot.tripId);

      fireEvent.click(within(openMenu(0, 'Alpha')).getByRole('menuitem', { name: 'Move…' }));
      fireEvent.click(within(document.querySelector<HTMLElement>('.save-panel-banner')!).getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('button', { name: /Swap here/ })).not.toBeInTheDocument();

      fireEvent.keyDown(card(0).getByRole('button', { name: 'More actions for Alpha' }), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows the Undo toast inside the focus-trapped dialog where the keyboard can reach it', () => {
      render(
        <>
          <ToastViewport />
          <SaveDataPanel open onClose={vi.fn()} />
        </>
      );
      fireEvent.click(within(openMenu(0, 'Alpha')).getByRole('menuitem', { name: 'Move…' }));
      fireEvent.click(card(1).getByRole('button', { name: 'Swap here with Slot 2' }));

      const dialog = screen.getByRole('dialog', { name: 'Save Data Slots' });
      const undo = screen.getByRole('button', { name: 'Undo' });
      expect(dialog.contains(undo)).toBe(true);
      expect(undo.closest('.save-panel-toast-host')).not.toBeNull();
      expect(undo).not.toHaveAttribute('tabindex', '-1');
      // Tab from the last control before the toasts wraps through them, not out of the dialog.
      const dismiss = within(dialog).getByRole('button', { name: 'Dismiss notification' });
      dismiss.focus();
      fireEvent.keyDown(dismiss, { key: 'Tab' });
      expect(screen.getByRole('button', { name: 'Close save data panel' })).toHaveFocus();

      fireEvent.click(undo);
      expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(savedSnapshot.tripId);
    });
  });

  describe('pick mode and copies', () => {
    it('saves a copy of a slot from the menu and opens the new card’s name editor', () => {
      useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      const homeBefore = useSaveSlotStore.getState().slots[0];
      renderPanel();

      fireEvent.click(within(openMenu(1)).getByRole('menuitem', { name: 'Save as copy…' }));
      expect(screen.getByText('Choose a slot for a copy of “Other trip”')).toBeInTheDocument();
      expect(card(1).getByText('Copying from here')).toBeInTheDocument();
      expect(card(1).queryByRole('button', { name: /here|Overwrite/ })).not.toBeInTheDocument();
      fireEvent.click(card(2).getByRole('button', { name: 'Save a copy here' }));

      const copy = useSaveSlotStore.getState().slots[2]!;
      expect(copy.tripId).toMatch(/^\d{6}$/);
      expect([baseSnapshot.tripId, otherSnapshot.tripId]).not.toContain(copy.tripId);
      expect(copy.tripName).toBe('Other trip (copy)');
      const editor = card(2).getByRole('textbox', { name: 'Trip name' });
      expect(editor).toHaveFocus();
      expect(editor).toHaveValue('Other trip (copy)');
      expect(useSaveSlotStore.getState().slots[0]).toBe(homeBefore);
      expect(useTripStore.getState().tripId).toBe(baseSnapshot.tripId);
      expect(screen.queryByText(/Choose a slot/)).not.toBeInTheDocument();
    });

    it('copies the live trip when the home card’s Save as copy is used, confirming before covering another trip', () => {
      useSaveSlotStore.getState().saveToSlot(0, baseSnapshot);
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      renderPanel();

      fireEvent.click(within(openMenu(0)).getByRole('menuitem', { name: 'Save as copy…' }));
      expect(screen.getByText('Choose a slot for a copy of “Current trip”')).toBeInTheDocument();
      expect(card(0).getByText('Copying from here')).toBeInTheDocument();
      fireEvent.click(card(1).getByRole('button', { name: 'Overwrite…' }));

      const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
      expect(confirmation).toHaveAccessibleDescription('Slot 2 holds “Other trip”. Replace it with a copy of “Current trip”?');
      fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));

      expect(useSaveSlotStore.getState().slots[1]?.tripName).toBe('Current trip (copy)');
      expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(baseSnapshot.tripId);
      expect(card(1).getByRole('textbox', { name: 'Trip name' })).toHaveFocus();
    });

    it('offers Update here for the home slot and a copy for empty slots when the trip already has a home', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...baseSnapshot, tripName: 'Older version' });
      renderPanel({ mode: 'pick' });

      expect(screen.getByText('This trip is already in Slot 1. Update it there, or save a copy to another slot.')).toBeInTheDocument();
      expect(card(1).getByRole('button', { name: 'Save a copy here' })).toBeInTheDocument();
      fireEvent.click(card(0).getByRole('button', { name: 'Update here' }));

      expect(screen.queryAllByRole('dialog')).toHaveLength(1);
      expect(useSaveSlotStore.getState().slots[0]?.data).toEqual(sanitized(baseSnapshot));
      expect(toastTitles()).toEqual(['Trip saved']);
    });

    it('asks a single copy question before covering another trip when the live trip already has a home', () => {
      const olderVersion = { ...baseSnapshot, tripName: 'Older version' };
      useSaveSlotStore.getState().saveToSlot(0, olderVersion);
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      renderPanel({ mode: 'pick' });

      fireEvent.click(card(1).getByRole('button', { name: 'Overwrite…' }));
      const confirmation = screen.getByRole('dialog', { name: 'Overwrite slot data?' });
      expect(confirmation).toHaveAccessibleDescription('Slot 2 holds “Other trip”. Replace it with a copy of “Current trip”?');
      fireEvent.click(within(confirmation).getByRole('button', { name: 'Confirm' }));

      // No second question: the copy is written straight away and the home slot is untouched.
      expect(screen.queryByRole('dialog', { name: 'This trip is already in Slot 1' })).not.toBeInTheDocument();
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      const { slots } = useSaveSlotStore.getState();
      expect(slots[0]?.data).toEqual(sanitized(olderVersion));
      expect(slots[1]?.tripName).toBe('Current trip (copy)');
      expect(slots[1]?.tripId).not.toBe(baseSnapshot.tripId);
      expect(toastTitles()).toEqual(['Copy saved']);
      expect(card(1).getByRole('textbox', { name: 'Trip name' })).toHaveFocus();
    });

    it.each(['Overwrite Slot 1', 'Save as copy'] as const)(
      'resolves a duplicate save from the "already in Slot 1" dialog: %s',
      (choice) => {
        const olderVersion = { ...baseSnapshot, tripName: 'Older version' };
        useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
        renderPanel({ mode: 'pick' });

        fireEvent.click(card(1).getByRole('button', { name: 'Overwrite…' }));
        // The trip lands in Slot 1 while the confirm is open, so the save is a duplicate when written.
        act(() => { useSaveSlotStore.getState().saveToSlot(0, olderVersion); });
        fireEvent.click(within(screen.getByRole('dialog', { name: 'Overwrite slot data?' })).getByRole('button', { name: 'Confirm' }));
        const duplicate = screen.getByRole('dialog', { name: 'This trip is already in Slot 1' });
        fireEvent.click(within(duplicate).getByRole('button', { name: choice }));

        const { slots } = useSaveSlotStore.getState();
        expect(useTripStore.getState().tripId).toBe(baseSnapshot.tripId);
        if (choice === 'Overwrite Slot 1') {
          expect(slots[0]?.data).toEqual(sanitized(baseSnapshot));
          expect(slots[1]?.data).toEqual(sanitized(otherSnapshot));
          expect(toastTitles()).toEqual(['Trip saved']);
          expect(card(0).getByRole('button', { name: 'More actions for Slot 1' })).toHaveFocus();
        } else {
          expect(slots[0]?.data).toEqual(sanitized(olderVersion));
          expect(slots[1]?.tripName).toBe('Current trip (copy)');
          expect(slots[1]?.tripId).not.toBe(baseSnapshot.tripId);
          expect(card(1).getByRole('textbox', { name: 'Trip name' })).toHaveFocus();
        }
      }
    );

    it.each(['emptied', 'swapped'] as const)(
      'stops picking and warns instead of copying when an Undo %s the source slot',
      (change) => {
        useSaveSlotStore.getState().saveToSlot(0, savedSnapshot);
        if (change === 'swapped') useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
        renderPanel();

        // Move Slot 1 to Slot 2 (a move into the empty slot, or a swap), keeping its Undo toast.
        fireEvent.click(within(openMenu(0)).getByRole('menuitem', { name: 'Move…' }));
        fireEvent.click(card(1).getByRole('button', { name: change === 'emptied' ? 'Move here to Slot 2' : 'Swap here with Slot 2' }));
        const [undoToast] = useToastStore.getState().toasts;
        useToastStore.getState().clearToasts();

        // Copy from Slot 2, which now holds "Saved trip"; then the Undo changes Slot 2 while picking.
        fireEvent.click(within(openMenu(1)).getByRole('menuitem', { name: 'Save as copy…' }));
        expect(screen.getByText('Choose a slot for a copy of “Saved trip”')).toBeInTheDocument();
        act(() => undoToast!.action!.onAction());
        fireEvent.click(card(2).getByRole('button', { name: 'Save a copy here' }));

        expect(useSaveSlotStore.getState().slots[2]).toBeNull();
        expect(screen.queryByText(/Choose a slot for a copy/)).not.toBeInTheDocument();
        expect(useToastStore.getState().toasts).toEqual([
          expect.objectContaining(change === 'emptied'
            ? { type: 'warning', title: 'Slot is empty', message: 'There is no save data in Slot 2.' }
            : { type: 'warning', title: 'Could not save the copy', message: 'Try again, or choose another slot.' }),
        ]);
        expect(card(1).getByRole('button', { name: 'More actions for Slot 2' })).toHaveFocus();
      }
    );

    it('leaves pick mode on Escape before the panel closes', () => {
      const onClose = vi.fn();
      renderPanel({ onClose, mode: 'pick' });
      expect(screen.getByText('Choose a slot for “Current trip”')).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('button', { name: 'Close save data panel' }), { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.queryByText('Choose a slot for “Current trip”')).not.toBeInTheDocument();
      expect(card(0).getByRole('button', { name: 'Save current trip here' })).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('button', { name: 'Close save data panel' }), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('focus after saving to a slot', () => {
    function expectFocusOn(element: HTMLElement) {
      expect(document.activeElement).not.toBe(document.body);
      expect(element).toHaveFocus();
    }

    it('moves to the new card’s menu button after "Save current trip here" replaces the blank card', () => {
      renderPanel();
      fireEvent.click(card(0).getByRole('button', { name: 'Save current trip here' }));

      expect(useSaveSlotStore.getState().slots[0]?.tripId).toBe(baseSnapshot.tripId);
      expectFocusOn(card(0).getByRole('button', { name: 'More actions for Slot 1' }));
    });

    it('moves to the saved card’s menu button after "Save here" in pick mode', () => {
      renderPanel();
      fireEvent.click(header().getByRole('button', { name: 'Save…' }));
      fireEvent.click(card(1).getByRole('button', { name: 'Save here' }));

      expect(useSaveSlotStore.getState().slots[1]?.tripId).toBe(baseSnapshot.tripId);
      expectFocusOn(card(1).getByRole('button', { name: 'More actions for Slot 2' }));
    });

    it('moves to the home card’s menu button after "Update here"', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...baseSnapshot, tripName: 'Older version' });
      renderPanel({ mode: 'pick' });
      fireEvent.click(card(0).getByRole('button', { name: 'Update here' }));

      expectFocusOn(card(0).getByRole('button', { name: 'More actions for Slot 1' }));
    });

    it('moves to the overwritten card’s menu button after a confirmed "Overwrite…"', () => {
      useSaveSlotStore.getState().saveToSlot(1, otherSnapshot);
      renderPanel();
      fireEvent.click(header().getByRole('button', { name: 'Save…' }));
      fireEvent.click(card(1).getByRole('button', { name: 'Overwrite…' }));
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Overwrite slot data?' })).getByRole('button', { name: 'Confirm' }));

      expect(useSaveSlotStore.getState().slots[1]?.tripId).toBe(baseSnapshot.tripId);
      expectFocusOn(card(1).getByRole('button', { name: 'More actions for Slot 2' }));
    });
  });

  describe('shell', () => {
    it('resets per-open state when reopened during the exit animation', () => {
      // Motion allowed, so the closing panel lingers (usePresence) and a reopen lands on it.
      const query = { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
      window.matchMedia = (() => query) as unknown as typeof window.matchMedia;
      try {
        useSaveSlotStore.getState().saveToSlot(0, savedSnapshot);
        const onSaveComplete = vi.fn();
        const onClose = vi.fn();
        const { rerender } = render(<SaveDataPanel open onClose={onClose} onSaveComplete={onSaveComplete} />);

        // Loading cancels the save continuation; also leave an open seat editor, move mode and Export.
        fireEvent.click(card(0).getByRole('button', { name: 'Load' }));
        fireEvent.click(card(2).getByRole('button', { name: 'Slot 3' }));
        expect(card(2).getByRole('textbox', { name: 'Slot name' })).toBeInTheDocument();
        fireEvent.click(within(openMenu(0)).getByRole('menuitem', { name: 'Move…' }));
        fireEvent.click(screen.getByRole('button', { name: 'Export' }));
        expect(screen.getByText(/Choose a slot to swap with/)).toBeInTheDocument();

        rerender(<SaveDataPanel open={false} onClose={onClose} onSaveComplete={onSaveComplete} />);
        expect(document.querySelector('.modal.save-panel')).toHaveAttribute('data-state', 'closing');

        rerender(<SaveDataPanel open onClose={onClose} onSaveComplete={onSaveComplete} />);
        expect(document.querySelector('.modal.save-panel')).toHaveAttribute('data-state', 'open');
        expect(screen.getByRole('button', { name: 'Close save data panel' })).toHaveFocus();
        expect(screen.queryByText(/Choose a slot to swap with/)).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: 'Slot name' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-expanded', 'false');

        // The continuation flag is fresh too: a save completes the continuation again.
        act(() => {
          useTripStore.getState().loadSnapshot(baseSnapshot);
          useTripStore.getState().markClean();
        });
        fireEvent.click(card(1).getByRole('button', { name: 'Save current trip here' }));
        expect(onSaveComplete).toHaveBeenCalledTimes(1);
      } finally {
        delete (window as { matchMedia?: unknown }).matchMedia;
      }
    });

    it.each(['Enter', 'Escape'])('returns focus to the seat button after %s in the seat editor', (key) => {
      renderPanel();
      fireEvent.click(card(1).getByRole('button', { name: 'Slot 2' }));
      const input = screen.getByRole('textbox', { name: 'Slot name' });
      expect(input).toHaveFocus();
      fireEvent.change(input, { target: { value: 'Weekend' } });

      fireEvent.keyDown(input, { key });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      const label = key === 'Enter' ? 'Weekend' : 'Slot 2';
      expect(card(1).getByRole('button', { name: label })).toHaveFocus();
      expect(useSaveSlotStore.getState().labels?.[1]).toBe(label);
      expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
    });

    it('points the Export trigger at the popover only while it is open', () => {
      renderPanel();
      const trigger = screen.getByRole('button', { name: 'Export' });
      expect(trigger).not.toHaveAttribute('aria-controls');

      fireEvent.click(trigger);
      const popover = screen.getByRole('dialog', { name: 'Export to spreadsheet' });
      expect(trigger).toHaveAttribute('aria-controls', popover.id);
      expect(document.getElementById(popover.id)).toBe(popover);

      fireEvent.click(trigger);
      expect(trigger).not.toHaveAttribute('aria-controls');
    });

    it('keeps the header and footer outside the only scrolling list and reports slot usage', () => {
      renderPanel();
      const dialog = screen.getByRole('dialog', { name: 'Save Data Slots' });
      const list = dialog.querySelector('.save-panel-list');
      expect(list).not.toBeNull();
      expect(list?.querySelectorAll('.slot-card')).toHaveLength(3);
      expect(dialog.querySelector('.save-panel-header')?.contains(list ?? null)).toBe(false);
      expect(dialog.querySelector('.save-panel-footer')?.contains(list ?? null)).toBe(false);
      expect(screen.getByText('0 of 3 slots · stored on this device')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Not saved to a slot');

      fireEvent.click(card(0).getByRole('button', { name: 'Save current trip here' }));

      expect(screen.getByText('1 of 3 slots · stored on this device')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('All changes saved (Slot 1)');
    });

    it('locks body scroll while open and restores focus to the opener on close', () => {
      function Harness() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button type="button" onClick={() => setOpen(true)}>Open panel</button>
            <SaveDataPanel open={open} onClose={() => setOpen(false)} />
          </>
        );
      }
      render(<Harness />);
      const opener = screen.getByRole('button', { name: 'Open panel' });
      opener.focus();
      fireEvent.click(opener);

      expect(document.body.style.overflow).toBe('hidden');
      expect(screen.getByRole('button', { name: 'Close save data panel' })).toHaveFocus();

      fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

      expect(screen.queryByRole('dialog', { name: 'Save Data Slots' })).not.toBeInTheDocument();
      expect(opener).toHaveFocus();
      expect(document.body.style.overflow).toBe('');
    });

    // Skipping disabled buttons is covered by the ModalShell tests.
    it('wraps Tab focus between the close button and the footer, keeping the file input out of the trap', () => {
      renderPanel();
      const dialog = screen.getByRole('dialog', { name: 'Save Data Slots' });
      const close = screen.getByRole('button', { name: 'Close save data panel' });
      const footerExport = screen.getByRole('button', { name: 'Export' });
      expect(dialog.contains(document.querySelector('input[type="file"]'))).toBe(false);

      footerExport.focus();
      fireEvent.keyDown(footerExport, { key: 'Tab' });
      expect(close).toHaveFocus();
      fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
      expect(footerExport).toHaveFocus();
    });

    it('marks the export button busy while an export runs', async () => {
      let finishExport: () => void = () => {};
      vi.mocked(exportWorkbook).mockImplementation(() => new Promise<void>((resolve) => { finishExport = resolve; }));
      renderPanel();
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      const popover = screen.getByRole('dialog', { name: 'Export to spreadsheet' });
      const popoverExport = within(popover).getByRole('button', { name: 'Export' });

      fireEvent.click(popoverExport);
      await waitFor(() => expect(popoverExport).toBeDisabled());
      expect(popoverExport).toHaveAttribute('aria-busy', 'true');
      fireEvent.click(popoverExport);

      await act(async () => { finishExport(); });
      expect(exportWorkbook).toHaveBeenCalledTimes(1);
    });
  });

  describe('export popover', () => {
    function openExportPopover() {
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      return screen.getByRole('dialog', { name: 'Export to spreadsheet' });
    }

    it('closes only the popover on Escape and returns focus to its trigger; the next Escape closes the panel', () => {
      const onClose = vi.fn();
      render(<SaveDataPanel open onClose={onClose} />);
      const trigger = screen.getByRole('button', { name: 'Export' });
      const popover = openExportPopover();

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(popover.contains(document.activeElement)).toBe(true);
      fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

      expect(screen.queryByRole('dialog', { name: 'Export to spreadsheet' })).not.toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders the popover outside the scrolling list, ignores presses in its own listbox and closes on outside presses', () => {
      renderPanel();
      const popover = openExportPopover();
      const dialog = screen.getByRole('dialog', { name: 'Save Data Slots' });
      // The layer sits outside the scroller; its wrapper is display: contents, so it lays out as a dialog child.
      expect(popover.parentElement?.classList.contains('save-panel-layer')).toBe(true);
      expect(popover.closest('.save-panel-list')).toBeNull();
      expect(popover.parentElement?.parentElement?.classList.contains('save-panel-content')).toBe(true);
      expect(popover.parentElement?.parentElement?.parentElement).toBe(dialog);

      fireEvent.click(within(popover).getByRole('combobox', { name: 'Source' }));
      const option = screen.getByRole('option', { name: 'Active Trip · Current trip' });
      fireEvent.pointerDown(option);
      expect(screen.getByRole('dialog', { name: 'Export to spreadsheet' })).toBeInTheDocument();

      fireEvent.pointerDown(dialog.querySelector('.save-panel-list')!);
      expect(screen.queryByRole('dialog', { name: 'Export to spreadsheet' })).not.toBeInTheDocument();
    });

    it('takes its defaults from the saved settings and lists filled slots as sources', () => {
      useSettingsStore.getState().setExportSchema('three-sheet');
      useSaveSlotStore.getState().saveToSlot(1, savedSnapshot);
      renderPanel();
      const popover = openExportPopover();

      expect(within(popover).getByRole('radio', { name: /Multi-sheet/ })).toBeChecked();
      fireEvent.click(within(popover).getByRole('combobox', { name: 'Source' }));
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'Active Trip · Current trip',
        'Slot 2 · Saved trip',
      ]);
    });

    it('previews exactly the file name the export writes', async () => {
      renderPanel();
      const popover = openExportPopover();
      const preview = () => popover.querySelector('.export-popover-filename')?.textContent;
      expect(preview()).toMatch(/^111111_\d{4}-\d{2}-\d{2}\.xlsx$/);

      fireEvent.click(within(popover).getByRole('button', { name: 'File name options' }));
      fireEvent.click(within(popover).getByRole('combobox', { name: 'Name from' }));
      fireEvent.click(screen.getByRole('option', { name: 'Custom' }));
      fireEvent.change(within(popover).getByLabelText('Custom name'), { target: { value: 'Summer plan' } });
      fireEvent.click(within(popover).getByRole('checkbox', { name: 'Add date' }));
      expect(preview()).toBe('Summer-plan.xlsx');

      fireEvent.click(within(popover).getByRole('button', { name: 'Export' }));

      await waitFor(() => expect(exportWorkbook).toHaveBeenCalledTimes(1));
      const [snapshot, options, now] = vi.mocked(exportWorkbook).mock.calls[0]!;
      expect(options).toMatchObject({ namePreset: 'custom', customName: 'Summer plan', includeDate: false });
      expect(buildExportFilename(snapshot, options, now)).toBe('Summer-plan.xlsx');
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Export to spreadsheet' })).not.toBeInTheDocument());
      expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['Exported']);
    });

    it('keeps the date-draft guard for the active trip', () => {
      useTripStore.setState({ dateDraftError: 'End date must be on or after the start date.' });
      renderPanel();
      const popover = openExportPopover();
      fireEvent.click(within(popover).getByRole('button', { name: 'Export' }));

      expect(exportWorkbook).not.toHaveBeenCalled();
      expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['Trip dates need attention']);
    });
  });

  describe('import', () => {
    function pickFile(name = 'trip.xlsx') {
      const fileInput = document.querySelector('input[type="file"]');
      if (!(fileInput instanceof HTMLInputElement)) throw new Error('Could not find the import file input');
      fireEvent.change(fileInput, { target: { files: [new File(['workbook'], name)] } });
    }

    it('opens the file picker straight from the footer Import button', () => {
      const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
      try {
        renderPanel();
        fireEvent.click(screen.getByRole('button', { name: 'Import' }));
        expect(click).toHaveBeenCalledTimes(1);
        expect(click.mock.contexts[0]).toBe(document.querySelector('input[type="file"]'));
        expect(screen.queryByRole('dialog', { name: 'Import trip from file?' })).not.toBeInTheDocument();
      } finally {
        click.mockRestore();
      }
    });

    it('confirms with the file name and the saved default rate mode, then applies the chosen mode', async () => {
      useSettingsStore.getState().setImportExchangeRateMode('keep-imported');
      vi.mocked(importWorkbook).mockResolvedValue({
        snapshot: { ...importedSnapshot, exchangeRates: [{ currency: 'EUR', rateToUSD: 1.1, isOverridden: true }] },
        warnings: [],
      });
      renderPanel();
      pickFile('lisbon.xlsx');

      const confirmation = screen.getByRole('dialog', { name: 'Import trip from file?' });
      expect(within(confirmation).getByText('lisbon.xlsx')).toBeInTheDocument();
      expect(within(confirmation).getByRole('radiogroup', { name: 'Exchange rates' })).toBeInTheDocument();
      expect(within(confirmation).getByRole('radio', { name: /Keep imported rates/ })).toBeChecked();
      expect(within(confirmation).queryByText('Importing will replace the current workspace trip data.')).not.toBeInTheDocument();
      expect(importWorkbook).not.toHaveBeenCalled();

      fireEvent.click(within(confirmation).getByRole('radio', { name: /Refresh with live/ }));
      fireEvent.click(within(confirmation).getByRole('button', { name: 'Import' }));

      await waitFor(() => expect(useTripStore.getState().tripId).toBe(importedSnapshot.tripId));
      expect(useTripStore.getState().exchangeRates).toEqual([{ currency: 'EUR', rateToUSD: 1.1, isOverridden: false }]);
      expect(screen.queryByRole('dialog', { name: 'Import trip from file?' })).not.toBeInTheDocument();
      expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['Trip imported']);
    });

    it('cancelling the confirm step imports nothing', () => {
      renderPanel();
      pickFile();
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Import trip from file?' })).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog', { name: 'Import trip from file?' })).not.toBeInTheDocument();
      expect(importWorkbook).not.toHaveBeenCalled();
      expect(useTripStore.getState().tripId).toBe(baseSnapshot.tripId);
    });

    it('shows the replace warning when there is unsaved work', () => {
      useTripStore.getState().setTripName('Edited trip');
      expect(useTripStore.getState().isDirty).toBe(true);
      renderPanel();
      pickFile();

      const confirmation = screen.getByRole('dialog', { name: 'Import and overwrite current trip?' });
      expect(confirmation).toHaveAccessibleDescription('Importing will replace the current workspace trip data.');
    });

    it('ignores a second import while one is running and marks both buttons busy', async () => {
      let finish: (value: Awaited<ReturnType<typeof importWorkbook>>) => void = () => {};
      vi.mocked(importWorkbook).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
      renderPanel();
      pickFile();
      const confirmation = screen.getByRole('dialog', { name: 'Import trip from file?' });
      const confirm = within(confirmation).getByRole('button', { name: 'Import' });

      fireEvent.click(confirm);
      fireEvent.click(confirm);
      await waitFor(() => expect(importWorkbook).toHaveBeenCalledTimes(1));
      expect(confirm).toBeDisabled();
      expect(confirm).toHaveAttribute('aria-busy', 'true');
      const footerImport = screen.getByRole('button', { name: 'Import', hidden: true, description: /Opens a file picker/ });
      expect(footerImport).toBeDisabled();
      expect(footerImport).toHaveAttribute('aria-busy', 'true');
      fireEvent.click(confirm);

      await act(async () => { finish({ snapshot: importedSnapshot, warnings: [] }); });

      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Import trip from file?' })).not.toBeInTheDocument());
      expect(importWorkbook).toHaveBeenCalledTimes(1);
      expect(footerImport).not.toBeDisabled();
      expect(footerImport).toHaveFocus();
    });

    it('keeps focus inside the confirm dialog while every control is disabled', async () => {
      let finish: (value: Awaited<ReturnType<typeof importWorkbook>>) => void = () => {};
      vi.mocked(importWorkbook).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
      renderPanel();
      pickFile();
      const confirmation = screen.getByRole('dialog', { name: 'Import trip from file?' });
      const confirm = within(confirmation).getByRole('button', { name: 'Import' });
      confirm.focus();

      fireEvent.click(confirm);
      await waitFor(() => expect(confirm).toBeDisabled());
      expect(confirmation).toHaveFocus();
      fireEvent.keyDown(confirmation, { key: 'Tab' });
      expect(confirmation).toHaveFocus();

      await act(async () => { finish({ snapshot: importedSnapshot, warnings: [] }); });
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Import trip from file?' })).not.toBeInTheDocument());
    });

    it('checks the slots as they are once the workbook is read, not when the import started', async () => {
      let finish: (value: Awaited<ReturnType<typeof importWorkbook>>) => void = () => {};
      vi.mocked(importWorkbook).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
      renderPanel();
      pickFile();
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Import trip from file?' })).getByRole('button', { name: 'Import' }));
      await waitFor(() => expect(importWorkbook).toHaveBeenCalledTimes(1));

      // The matching slot appears while the file is still being parsed.
      act(() => {
        expect(useSaveSlotStore.getState().saveToSlot(2, { ...importedSnapshot, tripName: 'Older import' })).toBe(true);
      });
      await act(async () => { finish({ snapshot: importedSnapshot, warnings: [] }); });

      await waitFor(() => expect(useTripStore.getState().tripId).toBe(importedSnapshot.tripId));
      expect(shouldConfirmFirstSave(importedSnapshot.tripId)).toBe(true);
    });

    it('flags an imported trip whose ID is already stored in a slot', async () => {
      useSaveSlotStore.getState().saveToSlot(2, { ...importedSnapshot, tripName: 'Older import' });
      renderPanel();
      pickFile();
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Import trip from file?' })).getByRole('button', { name: 'Import' }));

      await waitFor(() => expect(useTripStore.getState().tripId).toBe(importedSnapshot.tripId));
      expect(shouldConfirmFirstSave(importedSnapshot.tripId)).toBe(true);
    });

    it('does not flag an imported trip that is not stored in any slot', async () => {
      renderPanel();
      pickFile();
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Import trip from file?' })).getByRole('button', { name: 'Import' }));

      await waitFor(() => expect(useTripStore.getState().tripId).toBe(importedSnapshot.tripId));
      expect(shouldConfirmFirstSave(importedSnapshot.tripId)).toBe(false);
    });
  });

  describe('details drawer', () => {
    const richSnapshot = (tripId: string, tripName: string): TripSnapshot => ({
      ...baseSnapshot,
      tripId,
      tripName,
      targetCurrency: 'USD',
      couples: [{ id: 'c1', name: 'Rivera family', colorIndex: 1, iconIndex: 1, sortOrder: 0 }],
      costs: [{ id: 'k1', name: 'Hotel', currency: 'USD', value: 100, markupOverride: 0, splitType: 'shared', assignedCoupleIds: [], sortOrder: 0, type: 'accommodation' }],
    });
    const toggle = (slotIndex: number) => card(slotIndex).getByRole('button', { name: 'Details' });
    const drawerOf = (slotIndex: number) => document.querySelector<HTMLElement>(`[data-slot-index="${slotIndex}"] .slot-drawer`)!;

    beforeEach(() => {
      clearSlotDetailsCache();
      useSaveSlotStore.getState().saveToSlot(0, richSnapshot('222222', 'Saved trip'));
      useSaveSlotStore.getState().saveToSlot(1, richSnapshot('444444', 'Other trip'));
    });

    it('shows each filled card its total and no Details button on an empty slot', async () => {
      renderPanel();
      expect(await card(0).findByText('$100.00')).toBeInTheDocument();
      expect(await card(1).findByText('$100.00')).toBeInTheDocument();
      expect(card(2).queryByRole('button', { name: 'Details' })).not.toBeInTheDocument();
    });

    it('opens one drawer at a time and shows cached content on reopen', async () => {
      renderPanel();
      await card(0).findByText('$100.00');
      fireEvent.click(toggle(0));
      expect(drawerOf(0)).toHaveClass('is-open');
      expect(toggle(0)).toHaveAttribute('aria-expanded', 'true');
      expect(within(drawerOf(0)).getByText('Total · USD')).toBeInTheDocument();

      fireEvent.click(toggle(1));
      expect(drawerOf(0)).not.toHaveClass('is-open');
      expect(drawerOf(1)).toHaveClass('is-open');
      expect(drawerOf(0)).toHaveAttribute('inert');

      // Reopening shows the cached content at once, never a skeleton.
      fireEvent.click(toggle(1));
      fireEvent.click(toggle(1));
      expect(drawerOf(1).querySelector('.slot-drawer-body')).toHaveAttribute('data-state', 'ready');
      expect(drawerOf(1).querySelector('.slot-drawer-skeleton')).toHaveAttribute('aria-hidden', 'true');
    });

    it('closes the drawer first on Escape, returns focus to its toggle, and only then closes the panel', async () => {
      const onClose = vi.fn();
      renderPanel({ onClose });
      await card(0).findByText('$100.00');
      fireEvent.click(toggle(0));
      const hide = within(drawerOf(0)).getByRole('button', { name: 'Hide' });
      expect(hide).toHaveFocus();

      fireEvent.keyDown(hide, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
      expect(drawerOf(0)).not.toHaveClass('is-open');
      expect(toggle(0)).toHaveFocus();

      fireEvent.keyDown(toggle(0), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes every drawer when move or pick mode starts', async () => {
      renderPanel();
      await card(0).findByText('$100.00');
      fireEvent.click(toggle(0));
      expect(drawerOf(0)).toHaveClass('is-open');
      fireEvent.click(within(openMenu(0)).getByRole('menuitem', { name: 'Move…' }));
      expect(drawerOf(0)).not.toHaveClass('is-open');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      fireEvent.click(toggle(1));
      expect(drawerOf(1)).toHaveClass('is-open');
      fireEvent.click(within(openMenu(1)).getByRole('menuitem', { name: 'Save as copy…' }));
      expect(drawerOf(1)).not.toHaveClass('is-open');
      expect(document.querySelectorAll('.slot-drawer.is-open')).toHaveLength(0);
    });

    // Reachable layers: the drawer only makes its own card's content inert, so the stub's seat editor
    // and the "..." menu stay usable above an open drawer. Starting move/pick mode closes drawers and
    // popovers and makes the tickets inert, so those layers never coexist with an editor, menu or
    // drawer; the second chain covers the layers that can (popover over move mode).
    it('peels one layer per Escape: editor, then menu, then drawer, then the panel', async () => {
      const onClose = vi.fn();
      renderPanel({ onClose });
      await card(0).findByText('$100.00');
      fireEvent.click(toggle(0));
      expect(drawerOf(0)).toHaveClass('is-open');

      // Layer 1: the seat editor, over the open drawer.
      fireEvent.click(card(0).getByRole('button', { name: 'Slot 1' }));
      const input = screen.getByRole('textbox', { name: 'Slot name' });
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(drawerOf(0)).toHaveClass('is-open');
      expect(onClose).not.toHaveBeenCalled();

      // Layer 2: the menu, over the open drawer.
      const menu = openMenu(0);
      fireEvent.keyDown(document.activeElement ?? menu, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(drawerOf(0)).toHaveClass('is-open');
      expect(onClose).not.toHaveBeenCalled();

      // Layer 3: the drawer (Escape from inside it, where focus is while it is open).
      fireEvent.keyDown(within(drawerOf(0)).getByRole('button', { name: 'Hide' }), { key: 'Escape' });
      expect(drawerOf(0)).not.toHaveClass('is-open');
      expect(screen.getByRole('dialog', { name: 'Save Data Slots' })).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      // Last: the panel.
      fireEvent.keyDown(toggle(0), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('peels one layer per Escape: popover, then move mode, then the panel', () => {
      const onClose = vi.fn();
      renderPanel({ onClose });
      fireEvent.click(within(openMenu(0)).getByRole('menuitem', { name: 'Move…' }));
      expect(screen.getByRole('button', { name: /Swap here/ })).toBeInTheDocument();

      // The header Export popover is the one popover reachable during move mode.
      fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      const popover = screen.getByRole('dialog', { name: 'Export to spreadsheet' });
      fireEvent.keyDown(document.activeElement ?? popover, { key: 'Escape' });
      expect(screen.queryByRole('dialog', { name: 'Export to spreadsheet' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Swap here/ })).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(screen.getByRole('button', { name: /Swap here/ }), { key: 'Escape' });
      expect(screen.queryByRole('button', { name: /Swap here/ })).not.toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(screen.getByRole('button', { name: 'Close save data panel' }), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
