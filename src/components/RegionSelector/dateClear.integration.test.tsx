import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RegionSelector from './RegionSelector';
import { useTripStore } from '@/store/tripStore';

afterEach(() => act(() => useTripStore.getState().resetTrip()));

describe('Trip Information date clear buttons', () => {
  it('clears a committed end date and then the start date', () => {
    act(() => useTripStore.getState().setTripDates('2028-02-01', '2028-02-10'));
    render(<RegionSelector />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear end date' }));
    expect(useTripStore.getState().tripEndDate).toBe('');
    expect(screen.getByLabelText('End date')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Clear start date' }));
    expect(useTripStore.getState().tripStartDate).toBe('');
    expect(screen.getByLabelText('Start date')).toHaveFocus();
  });

  it('preserves committed dates and shows validation if the start is cleared first', () => {
    act(() => useTripStore.getState().setTripDates('2028-02-01', '2028-02-10'));
    render(<RegionSelector />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear start date' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a trip start date before the end date.');
    expect(useTripStore.getState().tripStartDate).toBe('2028-02-01');
    expect(useTripStore.getState().tripEndDate).toBe('2028-02-10');
    fireEvent.click(screen.getByRole('button', { name: 'Clear end date' }));
    expect(useTripStore.getState().tripStartDate).toBe('');
    expect(useTripStore.getState().tripEndDate).toBe('');
  });
});
