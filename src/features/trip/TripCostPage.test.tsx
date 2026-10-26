import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TripCostPage from './TripCostPage';
import { useTripStore } from '@/store/tripStore';

vi.mock('@/App', () => ({ default: () => <input aria-label="Trip text" /> }));
vi.mock('@/components/TripToolbar', () => ({ default: () => null }));

afterEach(() => useTripStore.getState().resetTrip());

describe('Trip Cost history shortcuts', () => {
  it('supports Ctrl and Command undo and redo, including Ctrl+Y', () => {
    render(<TripCostPage />);
    useTripStore.getState().setTripName('Changed');
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(useTripStore.getState().tripName).not.toBe('Changed');
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    expect(useTripStore.getState().tripName).toBe('Changed');
    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    expect(useTripStore.getState().tripName).not.toBe('Changed');
    fireEvent.keyDown(window, { key: 'Z', metaKey: true, shiftKey: true });
    expect(useTripStore.getState().tripName).toBe('Changed');
  });

  it('leaves text editing and dialogs to their own keyboard handling', () => {
    render(<TripCostPage />);
    useTripStore.getState().setTripName('Changed');
    expect(fireEvent.keyDown(screen.getByLabelText('Trip text'), { key: 'z', ctrlKey: true })).toBe(true);
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    expect(fireEvent.keyDown(window, { key: 'z', ctrlKey: true })).toBe(true);
    dialog.remove();
    expect(useTripStore.getState().tripName).toBe('Changed');
  });
});
