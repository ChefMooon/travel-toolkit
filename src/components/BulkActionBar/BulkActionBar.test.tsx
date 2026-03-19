/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkActionBar from '@/components/BulkActionBar';

describe('BulkActionBar', () => {
  it('FE-BULK-001 does not render when selectedCount is zero', () => {
    const { container } = render(
      <BulkActionBar
        selectedCount={0}
        onApply={vi.fn()}
        onClear={vi.fn()}
        bulkCurrency="USD"
        onBulkCurrencyChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('FE-BULK-002 renders selected count when one or more rows are selected', () => {
    render(
      <BulkActionBar
        selectedCount={3}
        onApply={vi.fn()}
        onClear={vi.fn()}
        bulkCurrency="USD"
        onBulkCurrencyChange={vi.fn()}
      />
    );

    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it('FE-BULK-003 notifies currency change', () => {
    const onBulkCurrencyChange = vi.fn();

    render(
      <BulkActionBar
        selectedCount={2}
        onApply={vi.fn()}
        onClear={vi.fn()}
        bulkCurrency="USD"
        onBulkCurrencyChange={onBulkCurrencyChange}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'EUR' } });

    expect(onBulkCurrencyChange).toHaveBeenCalledWith('EUR');
  });

  it('FE-BULK-004 applies selected currency on Apply click', () => {
    const onApply = vi.fn();

    render(
      <BulkActionBar
        selectedCount={2}
        onApply={onApply}
        onClear={vi.fn()}
        bulkCurrency="MXN"
        onBulkCurrencyChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledWith('MXN');
  });

  it('FE-BULK-005 clears selection on clear click', () => {
    const onClear = vi.fn();

    render(
      <BulkActionBar
        selectedCount={2}
        onApply={vi.fn()}
        onClear={onClear}
        bulkCurrency="USD"
        onBulkCurrencyChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});