/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrencyTool from '@/features/currency/CurrencyTool';

vi.mock('@/features/currency/useCurrencySnapshot', () => ({
  useCurrencySnapshot: vi.fn(),
}));

vi.mock('@/features/currency/useCurrencyMetadata', () => ({
  useCurrencyMetadata: vi.fn(),
}));

vi.mock('@/features/currency/useCurrencyProviders', () => ({
  useCurrencyProviders: vi.fn(),
}));

vi.mock('@/features/currency/CurrencyRegionSelector', () => ({
  default: () => <div data-testid="region-selector" />,
}));

import { useCurrencyStore } from '@/store/currencyStore';

import { useCurrencySnapshot } from '@/features/currency/useCurrencySnapshot';
import { useCurrencyMetadata } from '@/features/currency/useCurrencyMetadata';
import { useCurrencyProviders } from '@/features/currency/useCurrencyProviders';

// Europe region: getAvailableCurrencies('Europe') = ['CAD', 'EUR', 'GBP', 'USD']
// Default: base = 'CAD', target = 'USD' (USD is preferred when available)
const mockRates = {
  CAD: 1,
  EUR: 0.68,
  GBP: 0.57,
  USD: 0.74,
};

const mockMeta = {
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  USD: { name: 'US Dollar', symbol: '$' },
};

const mockProviders = [
  {
    key: 'ECB',
    name: 'European Central Bank',
    url: 'https://ecb.europa.eu',
    currencies: ['CAD', 'EUR', 'GBP', 'USD'],
  },
  {
    key: 'BOC',
    name: 'Bank of Canada',
    url: 'https://bankofcanada.ca',
    currencies: ['CAD', 'USD'],
  },
];

const successQuery = {
  data: { base: 'CAD', updatedAt: '2026-03-26', rates: mockRates },
  isPending: false,
  isError: false,
  refetch: vi.fn(),
};

const pendingQuery = { data: undefined, isPending: true, isError: false, refetch: vi.fn() };
const errorQuery = { data: undefined, isPending: false, isError: true, refetch: vi.fn() };

const successMeta = { data: mockMeta, isPending: false, isError: false };
const successProviders = { data: mockProviders, isPending: false, isError: false };
const idleMeta = { data: undefined, isPending: false, isError: false };
const idleProviders = { data: undefined, isPending: false, isError: false };

describe('CurrencyTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Seed the real Zustand store with the values the tests expect:
    // Europe region: getAvailableCurrencies('Europe') = ['CAD', 'EUR', 'GBP', 'USD']
    // base = 'CAD' (first in list), target = 'USD'
    useCurrencyStore.setState({ region: 'Europe', amount: '100', baseCurrency: 'CAD', targetCurrency: 'USD' });
    (useCurrencySnapshot as ReturnType<typeof vi.fn>).mockReturnValue(successQuery);
    (useCurrencyMetadata as ReturnType<typeof vi.fn>).mockReturnValue(successMeta);
    (useCurrencyProviders as ReturnType<typeof vi.fn>).mockReturnValue(successProviders);
  });

  it('FE-CUR-001 renders amount input and base/target dropdowns with default values', () => {
    render(<CurrencyTool />);

    expect(screen.getByRole('spinbutton')).toHaveValue(100);

    // CurrencyRegionSelector is mocked — only base + target selects are in the DOM
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue('CAD');
    expect(selects[1]).toHaveValue('USD');
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

    expect(screen.getByText('1 CAD')).toBeInTheDocument();
    expect(screen.getByText(/0\.7400/)).toBeInTheDocument();
    expect(screen.getByText('CA$100.00')).toBeInTheDocument();
    expect(screen.getByText('$74.00')).toBeInTheDocument();
  });

  it('FE-CUR-005 changing the target currency updates the displayed conversion', () => {
    render(<CurrencyTool />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1]!, { target: { value: 'GBP' } });

    expect(screen.getByText(/0\.5700/)).toBeInTheDocument();
    expect(screen.getByText('£57.00')).toBeInTheDocument();
  });

  it('FE-CUR-006 negative amount input is treated as zero without crashing', () => {
    render(<CurrencyTool />);

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-50' } });

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('FE-CUR-007 swap button swaps from and to currencies', () => {
    render(<CurrencyTool />);

    const selects = screen.getAllByRole('combobox');
    expect(selects[0]).toHaveValue('CAD');
    expect(selects[1]).toHaveValue('USD');

    fireEvent.click(screen.getByRole('button', { name: 'Swap from and to currencies' }));

    expect(selects[0]).toHaveValue('USD');
    expect(selects[1]).toHaveValue('CAD');
  });

  it('FE-CUR-008 dropdowns show full currency names from metadata', () => {
    render(<CurrencyTool />);

    const selects = screen.getAllByRole('combobox');
    const baseSelect = selects[0]!;
    expect(baseSelect.querySelector('option[value="CAD"]')?.textContent).toBe(
      'CAD — Canadian Dollar',
    );
    expect(baseSelect.querySelector('option[value="EUR"]')?.textContent).toBe('EUR — Euro');
  });

  it('FE-CUR-009 relevant providers toggle shows/hides provider rows', () => {
    render(<CurrencyTool />);

    // Toggle button is visible with correct label
    const toggle = screen.getByRole('button', { name: /Sources for CAD/i });
    expect(toggle).toBeInTheDocument();

    // Provider rows are hidden by default
    expect(screen.queryByRole('link', { name: /European Central Bank/i })).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(toggle);
    expect(screen.getByRole('link', { name: /European Central Bank/i })).toBeInTheDocument();

    // BOC covers CAD + USD, which is the default pair
    expect(screen.getByRole('link', { name: /Bank of Canada/i })).toBeInTheDocument();
  });

  it('FE-CUR-010 sources toggle arrow changes on open/close', () => {
    render(<CurrencyTool />);

    const toggle = screen.getByRole('button', { name: /Sources for CAD/i });
    expect(toggle.textContent).toContain('▸');

    fireEvent.click(toggle);
    expect(toggle.textContent).toContain('▾');

    fireEvent.click(toggle);
    expect(toggle.textContent).toContain('▸');
  });

  it('FE-CUR-012 dropdowns show raw code when metadata is unavailable', () => {
    (useCurrencyMetadata as ReturnType<typeof vi.fn>).mockReturnValue(idleMeta);
    render(<CurrencyTool />);

    const selects = screen.getAllByRole('combobox');
    expect(selects[0]!.querySelector('option[value="CAD"]')?.textContent).toBe('CAD');
  });

  it('FE-CUR-013 sources toggle not rendered when no relevant providers', () => {
    (useCurrencyProviders as ReturnType<typeof vi.fn>).mockReturnValue(idleProviders);
    render(<CurrencyTool />);

    expect(screen.queryByRole('button', { name: /Sources for/i })).not.toBeInTheDocument();
  });
});
