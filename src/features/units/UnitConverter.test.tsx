import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UnitConverter from './UnitConverter';

describe('UnitConverter', () => {
  it('selects a measurement and updates the conversion units', () => {
    render(<UnitConverter />);
    expect(screen.getByRole('radio', { name: 'Temperature' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Distance' }));
    expect(screen.getByRole('radio', { name: 'Distance' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'From unit' })).toHaveTextContent('Kilometers');
    expect(screen.getByRole('combobox', { name: 'To unit' })).toHaveTextContent('Miles');
    expect(screen.getByText(/0.6213711922/)).toBeInTheDocument();
  });
});
