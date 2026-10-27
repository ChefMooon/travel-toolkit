import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SettingsMenu from './SettingsMenu';
import { useSettingsStore } from '@/store/settingsStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { useTripStore } from '@/store/tripStore';

describe('SettingsMenu', () => {
  beforeEach(() => {
    useSettingsStore.setState({ measurementSystem: 'metric', clockFormat: '12h', preferredCurrency: 'USD', language: 'en' });
  });

  it('exposes global settings and keeps the language English-only', () => {
    useCurrencyStore.setState({ region: 'Europe', amount: '12', baseCurrency: 'EUR', targetCurrency: 'GBP' });
    useTripStore.setState({ region: 'Europe', targetCurrency: 'EUR' });
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.click(screen.getByLabelText('Measurements'));
    fireEvent.click(screen.getByRole('option', { name: 'Imperial' }));
    fireEvent.click(screen.getByLabelText('Clock format'));
    fireEvent.click(screen.getByRole('option', { name: '24 hour' }));
    fireEvent.click(screen.getByLabelText('Preferred currency'));
    fireEvent.click(screen.getByRole('option', { name: 'CAD' }));
    expect(useSettingsStore.getState()).toMatchObject({ measurementSystem: 'imperial', clockFormat: '24h', preferredCurrency: 'CAD' });
    expect(useCurrencyStore.getState()).toMatchObject({ region: 'Europe', amount: '12', baseCurrency: 'EUR', targetCurrency: 'GBP' });
    expect(useTripStore.getState()).toMatchObject({ region: 'Europe', targetCurrency: 'EUR' });
    expect(screen.getByLabelText('Language')).toBeDisabled();
    expect(screen.getByLabelText('Language')).toHaveTextContent('English');
  });

  it('dismisses the open dropdown before the settings panel on Escape', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const control = screen.getByLabelText('Measurements');
    fireEvent.click(control);
    fireEvent.keyDown(control, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(control).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<SettingsMenu />);
    const trigger = screen.getByRole('button', { name: 'Settings' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('Measurements')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
