import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CountdownPage from './CountdownPage';
import { useTripStore } from '@/store/tripStore';

describe('Travel Countdown page', () => {
  it('copies trip dates on request without editing the trip', () => {
    useTripStore.getState().setTripDates('2999-01-01', '2999-01-05');
    render(<CountdownPage fromTrip />);
    expect(screen.getByLabelText('Start date')).toHaveValue('2999-01-01');
    expect(screen.getByLabelText('End date (optional)')).toHaveValue('2999-01-05');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2998-12-31' } });
    expect(useTripStore.getState().tripStartDate).toBe('2999-01-01');
    useTripStore.getState().resetTrip();
  });
  it('starts empty and calculates from its own selected date without a trip store', () => {
    render(<CountdownPage />);
    expect(screen.getByText('Choose your trip start date to see the countdown.')).toBeInTheDocument();
    const start = screen.getByLabelText('Start date');
    fireEvent.change(start, { target: { value: '2999-01-01' } });
    expect(screen.getByText(/days? until your trip/)).toBeInTheDocument();
    expect(screen.getByLabelText('End date (optional)')).toHaveValue('');
  });

  it('retains end dates when a changed start makes them invalid', () => {
    render(<CountdownPage />);
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2999-01-01' } });
    fireEvent.change(screen.getByLabelText('End date (optional)'), { target: { value: '2999-01-03' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2999-01-04' } });
    expect(screen.getByLabelText('End date (optional)')).toHaveValue('2999-01-03');
    expect(screen.getByRole('alert')).toHaveTextContent('End date must be on or after the start date.');
    expect(screen.getByText('Correct the trip dates to see a countdown.')).toBeInTheDocument();
  });

  it('shows validation instead of an empty or stale countdown when only an end date is entered', () => {
    render(<CountdownPage />);
    fireEvent.change(screen.getByLabelText('End date (optional)'), { target: { value: '2999-01-03' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a trip start date before the end date.');
    expect(screen.getByText('Correct the trip dates to see a countdown.')).toBeInTheDocument();
    expect(screen.queryByText('Choose your trip start date to see the countdown.')).not.toBeInTheDocument();
  });

  it('reports the final trip day instead of zero days remaining', () => {
    const now = new Date();
    const dateOnly = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    render(<CountdownPage />);
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: dateOnly(yesterday) } });
    fireEvent.change(screen.getByLabelText('End date (optional)'), { target: { value: dateOnly(now) } });
    expect(screen.getByText(/Last day of your trip/)).toBeInTheDocument();
    expect(screen.queryByText(/0 days remaining/)).not.toBeInTheDocument();
  });
});
