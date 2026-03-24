/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyTool from '@/features/currency/CurrencyTool';

vi.mock('@/features/currency/useCurrencySnapshot', () => ({
  useCurrencySnapshot: vi.fn(),
}));

import { useCurrencySnapshot } from '@/features/currency/useCurrencySnapshot';

const mockRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  JPY: 149.2,
  AUD: 1.53,
};

const successQuery = {
  data: { updatedAt: 'Updated moments ago', rates: mockRates },
  isPending: false,
  isError: false,
  refetch: vi.fn(),
};

const pendingQuery = {
  data: undefined,
  isPending: true,
  isError: false,
  refetch: vi.fn(),
};

const errorQuery = {
  data: undefined,
  isPending: false,
  isError: true,
  refetch: vi.fn(),
};

describe('CurrencyTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useCurrencySnapshot as ReturnType<typeof vi.fn>).mockReturnValue(successQuery);
  });

  it('FE-CUR-001 renders amount input and base/target dropdowns with default values', () => {
    render(<CurrencyTool />);

    expect(screen.getByRole('spinbutton')).toHaveValue(100);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue('USD');
    expect(selects[1]).toHaveValue('EUR');
  });

  it('FE-CUR-002 shows loading status while query is pending', () => {
    (useCurrencySnapshot as ReturnType<typeof vi.fn>).mockReturnValue(pendingQuery);
    render(<CurrencyTool />);

    expect(screen.getByText('Loading rates...')).toBeInTheDocument();
  });

  it('FE-CUR-003 shows error message and retry button when query fails', () => {
    (useCurrencySnapshot as ReturnType<typeof vi.fn>).mockReturnValue(errorQuery);
    render(<CurrencyTool />);

    expect(screen.getByText(/Unable to load rates/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('FE-CUR-004 displays rate line and formatted conversion after successful load', () => {
    render(<CurrencyTool />);

    // Rate snapshot line: "1 USD = 0.9200 EUR"
    expect(screen.getByText('1 USD')).toBeInTheDocument();
    expect(screen.getByText(/0\.9200/)).toBeInTheDocument();

    // Conversion totals: $100.00 → €92.00
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('€92.00')).toBeInTheDocument();
  });

  it('FE-CUR-005 changing the target currency updates the displayed conversion', () => {
    render(<CurrencyTool />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1]!, { target: { value: 'GBP' } });

    expect(screen.getByText(/0\.7800/)).toBeInTheDocument();
    expect(screen.getByText('£78.00')).toBeInTheDocument();
  });

  it('FE-CUR-006 negative amount input is treated as zero without crashing', () => {
    render(<CurrencyTool />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-50' } });

    expect(screen.getByText('€0.00')).toBeInTheDocument();
  });
});
