/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegionSelector from '@/components/RegionSelector';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

import { useTripStore } from '@/store/tripStore';
import { useDraftStore } from '@/store/draftStore';
vi.mock('@/store/draftStore', () => ({ useDraftStore: vi.fn() }));

const setDraft = vi.fn();
(useDraftStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: { setDraft: typeof setDraft }) => unknown) => selector({ setDraft }));

const mockStoreState = {
  region: 'Europe',
  tripStartDate: '', tripEndDate: '', tripIdentityRevision: 0,
  setRegion: vi.fn(),
  setDateDraftError: vi.fn(),
  setTripDates: vi.fn(),
};
(useTripStore as unknown as { getState: () => typeof mockStoreState }).getState = () => mockStoreState;

describe('RegionSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDraft.mockClear();
    mockStoreState.region = 'Europe';

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );
  });

  it('FE-REG-001 renders the current region value', () => {
    render(<RegionSelector />);

    expect(screen.getByRole('combobox', { name: 'Region' })).toHaveTextContent('Europe');
  });

  it('provides a visible section heading and programmatic label for the region selector', () => {
    render(<RegionSelector />);

    expect(screen.getByRole('heading', { name: 'Trip Information', level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText('Region')).toBe(screen.getByRole('combobox', { name: 'Region' }));
  });

  it('FE-REG-002 renders all region options', () => {
    render(<RegionSelector />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Region' }));
    const options = screen.getAllByRole('option').map((option) => option.textContent);

    expect(options).toEqual([
      'North America',
      'Europe',
      'Asia',
      'Oceania',
      'Americas',
      'Africa',
    ]);
  });

  it('FE-REG-003 updates region through store action', () => {
    render(<RegionSelector />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Region' }));
    fireEvent.click(screen.getByRole('option', { name: 'Asia' }));

    expect(mockStoreState.setRegion).toHaveBeenCalledWith('Asia');
  });

  it('registers an invalid date draft for the navigation guard', () => {
    render(<RegionSelector />);
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2027-03-01' } });
    expect(setDraft).toHaveBeenCalledWith('trip-dates', true);
    expect(mockStoreState.setDateDraftError).toHaveBeenCalledWith('Choose a trip start date before the end date.');
  });

  it('keeps incomplete and impossible typed dates as invalid drafts without committing them', () => {
    render(<RegionSelector />);
    const start = screen.getByLabelText('Start date');
    fireEvent.change(start, { target: { value: '2027-02-' } });
    expect(mockStoreState.setDateDraftError).toHaveBeenCalledWith('Enter a valid trip start date in YYYY-MM-DD format.');
    expect(mockStoreState.setTripDates).not.toHaveBeenCalled();
    fireEvent.change(start, { target: { value: '2027-02-30' } });
    expect(mockStoreState.setTripDates).not.toHaveBeenCalled();
  });

  it('commits valid date-only values and preserves an empty end date', () => {
    render(<RegionSelector />);
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2028-02-29' } });
    expect(mockStoreState.setTripDates).toHaveBeenCalledWith('2028-02-29', '');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2027-02-29' } });
    expect(mockStoreState.setDateDraftError).toHaveBeenCalledWith('Enter a valid trip start date in YYYY-MM-DD format.');
  });

  it('opens the calendar and selects a date', () => {
    render(<RegionSelector />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose start date' }));
    expect(screen.getByRole('dialog', { name: 'Start date calendar' })).toBeInTheDocument();
    const today = new Date();
    const firstDay = screen.getByRole('dialog').querySelector<HTMLButtonElement>('[data-day="1"]')!;
    fireEvent.click(firstDay);
    const expected = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-01`;
    expect(mockStoreState.setTripDates).toHaveBeenCalledWith(expected, '');
  });
});
