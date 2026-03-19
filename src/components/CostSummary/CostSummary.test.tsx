/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CostSummary from '@/components/CostSummary';
import type { Couple, CostEntry, ExchangeRate } from '@/store/types';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/components/CoupleCard', () => ({
  default: ({ summary }: { summary: { coupleId: string; coupleName: string } }) => (
    <div data-testid="couple-card">{summary.coupleName}:{summary.coupleId}</div>
  ),
}));

import { useTripStore } from '@/store/tripStore';

const mockStoreState: {
  couples: Couple[];
  costs: CostEntry[];
  globalMarkup: number;
  exchangeRates: ExchangeRate[];
} = {
  couples: [],
  costs: [],
  globalMarkup: 66,
  exchangeRates: [],
};

describe('CostSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.couples = [];
    mockStoreState.costs = [];
    mockStoreState.globalMarkup = 66;
    mockStoreState.exchangeRates = [];

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );
  });

  it('FE-SUM-001 renders empty state when no summary data exists', () => {
    render(<CostSummary />);

    expect(screen.getByText('No summary yet')).toBeInTheDocument();
    expect(screen.getByText('Add groups and costs to see the breakdown')).toBeInTheDocument();
  });

  it('FE-SUM-002 renders group and currency counts in the header', () => {
    mockStoreState.couples = [
      { id: 'c1', name: 'Group 1', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
      { id: 'c2', name: 'Group 2', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
    ];
    mockStoreState.costs = [
      {
        id: 'cost-1',
        name: 'Hotel',
        currency: 'USD',
        value: 100,
        markupOverride: null,
        splitType: 'shared',
        assignedCoupleIds: [],
        sortOrder: 0,
      },
      {
        id: 'cost-2',
        name: 'Dinner',
        currency: 'EUR',
        value: 50,
        markupOverride: null,
        splitType: 'shared',
        assignedCoupleIds: [],
        sortOrder: 1,
      },
    ];

    render(<CostSummary />);

    expect(screen.getByText(/2 groups/i)).toBeInTheDocument();
    expect(screen.getByText(/2 currencies/i)).toBeInTheDocument();
  });

  it('FE-SUM-003 renders one CoupleCard for each couple summary', () => {
    mockStoreState.couples = [
      { id: 'c1', name: 'Group 1', colorIndex: 1, iconIndex: 1, sortOrder: 0 },
      { id: 'c2', name: 'Group 2', colorIndex: 2, iconIndex: 2, sortOrder: 1 },
    ];
    mockStoreState.costs = [
      {
        id: 'cost-1',
        name: 'Hotel',
        currency: 'USD',
        value: 100,
        markupOverride: null,
        splitType: 'shared',
        assignedCoupleIds: [],
        sortOrder: 0,
      },
    ];

    render(<CostSummary />);

    const cards = screen.getAllByTestId('couple-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Group 1:c1')).toBeInTheDocument();
    expect(screen.getByText('Group 2:c2')).toBeInTheDocument();
  });
});