/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegionSelector from '@/components/RegionSelector';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

import { useTripStore } from '@/store/tripStore';

const mockStoreState = {
  region: 'Europe',
  setRegion: vi.fn(),
};

describe('RegionSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(screen.getByRole('heading', { name: 'Region', level: 2 })).toBeInTheDocument();
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
});
