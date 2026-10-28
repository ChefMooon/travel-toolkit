import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TripCostPage from './TripCostPage';
import { useTripStore } from '@/store/tripStore';

vi.mock('@/App', () => ({ default: () => <input aria-label="Trip text" /> }));
vi.mock('@/components/TripToolbar', () => ({ default: () => null }));
vi.mock('@tanstack/react-router', () => ({ Link: ({ to, search, children, ...props }: React.ComponentProps<'a'> & { to: string; search?: { fromTrip?: boolean } }) => <a href={search?.fromTrip ? `${to}?fromTrip=true` : to} {...props}>{children}</a> }));

afterEach(() => act(() => useTripStore.getState().resetTrip()));

describe('Trip Cost history shortcuts', () => {
  it('shows a countdown from the committed trip dates and hides it without a start date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const { rerender } = render(<TripCostPage />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => useTripStore.getState().setTripDates(dateOnly, ''));
    rerender(<TripCostPage />);
    expect(screen.getByRole('status')).toHaveTextContent('1 day until departure');
    expect(screen.getByRole('link', { name: 'Open travel countdown' })).toHaveAttribute('href', '/countdown?fromTrip=true');
    const today = new Date();
    const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    act(() => useTripStore.getState().setTripDates(formatDate(yesterday), formatDate(today)));
    rerender(<TripCostPage />);
    expect(screen.getByRole('status')).toHaveTextContent('Last day of your trip');
    expect(screen.queryByText('0 days remaining')).not.toBeInTheDocument();
    act(() => useTripStore.getState().setTripDates('', ''));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open travel countdown' })).not.toBeInTheDocument();
    expect(screen.getByText('Last day of your trip').closest('.trip-countdown-transition')).toHaveAttribute('data-visible', 'false');
    act(() => useTripStore.getState().setTripDates(dateOnly, ''));
    expect(screen.getByRole('status')).toHaveTextContent('1 day until departure');
  });

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
