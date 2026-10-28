import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import UnitConverter from './UnitConverter';
import { activateLanguage } from '@/i18n';

describe('UnitConverter', () => {
  beforeEach(async () => {
    await activateLanguage('en');
  });

  it('selects a measurement and updates the conversion units', () => {
    render(<UnitConverter />);
    expect(screen.getByRole('radio', { name: 'Temperature' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Distance' }));
    expect(screen.getByRole('radio', { name: 'Distance' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'From unit' })).toHaveTextContent('Kilometers');
    expect(screen.getByRole('combobox', { name: 'To unit' })).toHaveTextContent('Miles');
    expect(screen.getByText(/0.6213711922/)).toBeInTheDocument();
  });

  it('localizes displayed values while preserving numeric input semantics', async () => {
    await act(async () => { await activateLanguage('fr-CA'); });
    render(<UnitConverter />);
    expect(screen.getByRole('heading', { name: 'Convertisseur d’unités' })).toBeInTheDocument();
    const amount = screen.getByRole('spinbutton', { name: 'Quantité' });
    fireEvent.change(amount, { target: { value: '1.5' } });
    expect(amount).toHaveValue(1.5);
    expect(screen.getByText(/34,7/)).toBeInTheDocument();
    await act(async () => { await activateLanguage('en'); });
  });
});
