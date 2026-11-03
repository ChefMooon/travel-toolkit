/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { clearImportedTripGuard, markImportedTripMatchesSlot } from '@/store/importedTripGuard';
import { useSaveSlotStore } from '@/store/saveSlotStore';
import { useToastStore } from '@/store/toastStore';
import { useTripStore } from '@/store/tripStore';
import type { TripSnapshot } from '@/store/types';
import SaveSplitButton from './SaveSplitButton';

const live: TripSnapshot = {
  tripId: '111111',
  tripName: 'Live trip',
  globalMarkup: 0,
  couples: [],
  nonPayingTravellers: [],
  costs: [],
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'EUR',
};

const toasts = () => useToastStore.getState().toasts;
const slots = () => useSaveSlotStore.getState().slots;
const mainButton = () => within(screen.getByRole('group', { name: 'Save slots' })).getAllByRole('button')[0]!;
const chevron = () => screen.getByRole('button', { name: 'Open save slots' });
const dots = () => document.querySelectorAll('.save-split-dot');

function renderButton(panelOpen = false) {
  const onOpenPanel = vi.fn();
  const view = render(<SaveSplitButton panelOpen={panelOpen} onOpenPanel={onOpenPanel} />);
  return { onOpenPanel, ...view };
}

describe('SaveSplitButton', () => {
  beforeEach(() => {
    clearImportedTripGuard();
    useSaveSlotStore.setState({ slots: [null, null, null], labels: ['Slot 1', 'Slot 2', 'Slot 3'] });
    useTripStore.getState().loadSnapshot(live);
    useTripStore.getState().markClean();
    useTripStore.setState({ dateDraftError: '' });
    useToastStore.getState().clearToasts();
  });

  describe('with a home slot', () => {
    it('quick-saves in one click with an Undo toast, clears the dot, and Undo brings it back', () => {
      useSaveSlotStore.getState().saveToSlot(1, { ...live, tripName: 'Older' });
      act(() => useTripStore.getState().setTripName('Live trip, edited'));
      const { onOpenPanel } = renderButton();

      const main = screen.getByRole('button', { name: 'Save to Slot 2' });
      expect(main).toBe(mainButton());
      expect(main).toHaveTextContent('Save');
      expect(main).toHaveAccessibleDescription(expect.stringContaining('Unsaved changes'));
      expect(dots()).toHaveLength(1);

      fireEvent.click(main);

      expect(slots()[1]?.tripName).toBe('Live trip, edited');
      expect(onOpenPanel).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      const [toast] = toasts();
      expect(toast).toMatchObject({ title: 'Trip saved', message: 'Saved to Slot 2.', action: { label: 'Undo' } });
      expect(dots()).toHaveLength(0);
      expect(main).not.toHaveAccessibleDescription(expect.stringContaining('Unsaved changes'));

      act(() => toast!.action!.onAction());

      expect(slots()[1]?.tripName).toBe('Older');
      expect(useTripStore.getState().isDirty).toBe(true);
      expect(dots()).toHaveLength(1);
      expect(onOpenPanel).not.toHaveBeenCalled();
    });

    it('says the trip is already saved without writing when nothing changed', () => {
      useSaveSlotStore.getState().saveToSlot(0, live);
      const before = slots();
      renderButton();

      const main = screen.getByRole('button', { name: 'Save to Slot 1' });
      expect(main).not.toBeDisabled();
      expect(main).not.toHaveAttribute('aria-disabled');
      expect(dots()).toHaveLength(0);

      fireEvent.click(main);

      expect(slots()).toBe(before);
      expect(toasts()).toHaveLength(1);
      expect(toasts()[0]).toMatchObject({ title: 'No changes to save', message: 'Already saved to Slot 1.' });
    });

    it('shows one dot when the live trip differs from its slot even though nothing is dirty', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      expect(useTripStore.getState().isDirty).toBe(false);
      renderButton();

      expect(dots()).toHaveLength(1);
      expect(screen.getAllByText('Unsaved changes')).toHaveLength(1);
    });

    it('uses the custom slot label in the name', () => {
      useSaveSlotStore.setState({ labels: ['Slot 1', 'Paris', 'Slot 3'] });
      useSaveSlotStore.getState().saveToSlot(1, live);
      renderButton();

      expect(screen.getByRole('button', { name: 'Save to Paris' })).toBeInTheDocument();
    });

    it('asks once before the first save over the slot an import matched, and again after Undo', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      markImportedTripMatchesSlot(live.tripId);
      renderButton();

      fireEvent.click(screen.getByRole('button', { name: 'Save to Slot 1' }));
      const dialog = screen.getByRole('dialog', { name: 'Overwrite Slot 1 with the imported trip?' });
      expect(slots()[0]?.tripName).toBe('Older');

      fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(slots()[0]?.tripName).toBe('Live trip');
      const [toast] = toasts();
      expect(toast).toMatchObject({ title: 'Trip saved', action: { label: 'Undo' } });

      act(() => toast!.action!.onAction());
      expect(slots()[0]?.tripName).toBe('Older');

      fireEvent.click(screen.getByRole('button', { name: 'Save to Slot 1' }));
      expect(screen.getByRole('dialog', { name: 'Overwrite Slot 1 with the imported trip?' })).toBeInTheDocument();
      expect(slots()[0]?.tripName).toBe('Older');
    });

    it('does not write when the import overwrite is cancelled', () => {
      useSaveSlotStore.getState().saveToSlot(0, { ...live, tripName: 'Older' });
      markImportedTripMatchesSlot(live.tripId);
      renderButton();

      fireEvent.click(screen.getByRole('button', { name: 'Save to Slot 1' }));
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(slots()[0]?.tripName).toBe('Older');
      expect(toasts()).toHaveLength(0);
    });
  });

  describe('without a home slot', () => {
    it('opens the panel to pick a slot', () => {
      act(() => useTripStore.getState().setTripName('Unsaved'));
      const { onOpenPanel } = renderButton();

      const main = screen.getByRole('button', { name: 'Save to a slot…' });
      expect(main).toHaveTextContent('Save…');
      expect(dots()).toHaveLength(1);

      fireEvent.click(main);

      expect(onOpenPanel).toHaveBeenCalledWith('pick');
      expect(slots()).toEqual([null, null, null]);
      expect(toasts()).toHaveLength(0);
    });

    it('shows no dot for a pristine new trip', () => {
      act(() => useTripStore.getState().resetTrip());
      renderButton();

      expect(dots()).toHaveLength(0);
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    });
  });

  describe('chevron and semantics', () => {
    it('opens the panel to browse and reflects whether it is open', () => {
      const { onOpenPanel, rerender } = renderButton();

      expect(chevron()).toHaveAttribute('aria-haspopup', 'dialog');
      expect(chevron()).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(chevron());
      expect(onOpenPanel).toHaveBeenCalledWith('browse');

      rerender(<SaveSplitButton panelOpen onOpenPanel={onOpenPanel} />);
      expect(chevron()).toHaveAttribute('aria-expanded', 'true');
    });

    it('is a named group of two native buttons, main first, both in the tab order', () => {
      renderButton();

      const buttons = within(screen.getByRole('group', { name: 'Save slots' })).getAllByRole('button');
      expect(buttons).toEqual([mainButton(), chevron()]);
      for (const button of buttons) {
        expect(button).toHaveAttribute('type', 'button');
        expect(button).not.toHaveAttribute('tabindex');
        act(() => button.focus());
        expect(button).toHaveFocus();
      }
    });
  });
});
