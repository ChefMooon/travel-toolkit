import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CurrencyRegionSelector from './CurrencyRegionSelector';
import { useCurrencyStore } from '@/store/currencyStore';

describe('CurrencyRegionSelector', () => {
  beforeEach(() => {
    useCurrencyStore.setState({ region: 'Europe' });
  });

  it('shows and updates the stored region using the shared select', () => {
    render(<CurrencyRegionSelector />);
    const select = screen.getByRole('combobox', { name: 'Currency region' });
    expect(select).toHaveTextContent('Europe');
    fireEvent.click(select);
    fireEvent.click(screen.getByRole('option', { name: 'Asia' }));
    expect(useCurrencyStore.getState().region).toBe('Asia');
  });
});
