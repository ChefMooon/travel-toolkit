/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CostSummary from '@/components/CostSummary';
import type { Couple, CostEntry, ExchangeRate } from '@/store/types';
import type { Region } from '@/store/types';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/components/CoupleCard', () => ({
  default: ({ summary }: { summary: { coupleId: string; coupleName: string } }) => (
    <div data-testid="couple-card">{summary.coupleName}:{summary.coupleId}</div>
  ),
}));

vi.mock('@/features/currency/useTripRates', () => ({
  useTripRates: vi.fn(),
}));

import { useTripStore } from '@/store/tripStore';
import { useTripRates } from '@/features/currency/useTripRates';

const mockStoreState: {
  couples: Couple[];
  costs: CostEntry[];
  globalMarkup: number;
  exchangeRates: ExchangeRate[];
  region: Region;
  targetCurrency: string;
  hydrateExchangeRates: ReturnType<typeof vi.fn>;
  setTargetCurrency: ReturnType<typeof vi.fn>;
} = {
  couples: [],
  costs: [],
  globalMarkup: 66,
  exchangeRates: [],
  region: 'Europe',
  targetCurrency: 'USD',
  hydrateExchangeRates: vi.fn(),
  setTargetCurrency: vi.fn(),
};

describe('CostSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.couples = [];
    mockStoreState.costs = [];
    mockStoreState.globalMarkup = 66;
    mockStoreState.exchangeRates = [];
    mockStoreState.region = 'Europe';
    mockStoreState.targetCurrency = 'USD';

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
    );

    (useTripRates as ReturnType<typeof vi.fn>).mockReturnValue({
      isPending: false,
      isError: false,
      data: null,
      refetch: vi.fn(),
    });
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

  it('FE-SUM-004 disclaimer renders when useTripRates has data', () => {
    (useTripRates as ReturnType<typeof vi.fn>).mockReturnValue({
      isPending: false,
      isError: false,
      data: { rates: {}, updatedAt: '2026-03-26', fetchedAt: new Date().toISOString() },
      refetch: vi.fn(),
    });
    render(<CostSummary />);
    expect(screen.getByTestId('rates-disclaimer')).toBeInTheDocument();
  });

  it('FE-SUM-005 target currency dropdown triggers setTargetCurrency', () => {
    render(<CostSummary />);
    const select = screen.getByTestId('target-currency-select');
    fireEvent.change(select, { target: { value: 'EUR' } });
    expect(mockStoreState.setTargetCurrency).toHaveBeenCalledWith('EUR');
  });

  it('FE-SUM-006 hydrateExchangeRates is called when query data arrives', async () => {
    const rates = { EUR: 0.91, GBP: 0.77 };
    (useTripRates as ReturnType<typeof vi.fn>).mockReturnValue({
      isPending: false,
      isError: false,
      data: { rates, updatedAt: '2026-03-26', fetchedAt: new Date().toISOString() },
      refetch: vi.fn(),
    });
    render(<CostSummary />);
    expect(mockStoreState.hydrateExchangeRates).toHaveBeenCalledWith(rates);
  });

  it('FE-SUM-007 loading indicator renders while useTripRates is pending', () => {
    (useTripRates as ReturnType<typeof vi.fn>).mockReturnValue({
      isPending: true,
      isError: false,
      data: null,
      refetch: vi.fn(),
    });
    render(<CostSummary />);
    expect(screen.getByTestId('rates-loading')).toBeInTheDocument();
  });

  it('FE-SUM-008 inline error and Retry button render when useTripRates errors', () => {
    const refetch = vi.fn();
    (useTripRates as ReturnType<typeof vi.fn>).mockReturnValue({
      isPending: false,
      isError: true,
      data: null,
      refetch,
    });
    render(<CostSummary />);
    expect(screen.getByTestId('rates-error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });
});