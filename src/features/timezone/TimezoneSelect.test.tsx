/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import TimezoneSelect from '@/features/timezone/TimezoneSelect';

afterEach(() => vi.useRealTimers());

describe('TimezoneSelect', () => {
  it('FE-TZ-007a renders a large list of IANA timezone options', () => {
    render(
      <TimezoneSelect
        value="UTC"
        onChange={vi.fn()}
        placeholder="Select timezone"
        searchable={false}
      />,
    );

    const localTimezoneSelect = screen.getByRole('combobox');
    expect(localTimezoneSelect).toBeInstanceOf(HTMLButtonElement);
    expect(screen.queryByLabelText('Search timezones')).not.toBeInTheDocument();
    fireEvent.click(localTimezoneSelect);
    expect(screen.getAllByRole('option').length).toBeGreaterThan(50);
    expect(localTimezoneSelect).toHaveTextContent('UTC');
  });

  it('FE-TZ-007b typing in the search input narrows the timezone list', () => {
    render(<TimezoneSelect value="UTC" onChange={vi.fn()} searchable />);

    fireEvent.change(screen.getByLabelText('Search timezones'), {
      target: { value: 'Tokyo' },
    });

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Asia/Tokyo');
    expect(screen.getByRole('listbox')).toHaveStyle({ position: 'fixed' });
  });

  it('FE-TZ-007c clicking a result calls onChange with the timezone value', () => {
    const onChange = vi.fn();
    render(<TimezoneSelect value="" onChange={onChange} searchable />);

    fireEvent.change(screen.getByLabelText('Search timezones'), {
      target: { value: 'New York' },
    });
    fireEvent.click(screen.getByRole('option', { name: /America\/New York/ }));

    expect(onChange).toHaveBeenCalledWith('America/New_York');
    expect(screen.getByLabelText('Search timezones')).toHaveValue('');
  });

  it('supports selecting the active result with the keyboard', () => {
    const onChange = vi.fn();
    render(<TimezoneSelect value="" onChange={onChange} searchable />);

    const search = screen.getByLabelText('Search timezones');
    fireEvent.change(search, { target: { value: 'Tokyo' } });
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('Asia/Tokyo');
    expect(search).toHaveValue('');
  });

  it('shows an empty state when the query has no matches', () => {
    render(<TimezoneSelect value="" onChange={vi.fn()} searchable />);

    fireEvent.change(screen.getByLabelText('Search timezones'), {
      target: { value: 'not-a-timezone' },
    });

    expect(screen.getByRole('status')).toHaveTextContent('No timezones match');
  });

  it('closes the results and clears the active option with Escape', () => {
    render(<TimezoneSelect value="" onChange={vi.fn()} searchable />);

    const search = screen.getByLabelText('Search timezones');
    fireEvent.change(search, { target: { value: 'Tokyo' } });
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Escape' });

    expect(search).toHaveValue('');
    expect(search).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('keeps the results open during scrollbar interaction and closes on outside pointer down', () => {
    render(<TimezoneSelect value="" onChange={vi.fn()} searchable />);

    const search = screen.getByLabelText('Search timezones');
    fireEvent.change(search, { target: { value: 'UTC' } });
    const listbox = screen.getByRole('listbox');

    fireEvent.pointerDown(listbox);
    fireEvent.blur(search);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.pointerUp(window);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('refreshes mounted offsets after focus crosses a DST boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T06:59:00Z'));
    render(<TimezoneSelect value="America/New_York" onChange={vi.fn()} searchable={false} />);

    expect(screen.getByRole('combobox')).toHaveTextContent('America/New York (UTC-05:00)');

    vi.setSystemTime(new Date('2026-03-08T07:01:00Z'));
    fireEvent.focus(window);

    expect(screen.getByRole('combobox')).toHaveTextContent('America/New York (UTC-04:00)');
  });

  it('refreshes mounted offsets at the next minute boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T06:59:30Z'));
    render(<TimezoneSelect value="America/New_York" onChange={vi.fn()} searchable={false} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('America/New York (UTC-05:00)');

    vi.setSystemTime(new Date('2026-03-08T07:00:00Z'));
    act(() => vi.advanceTimersByTime(30_050));

    expect(screen.getByRole('combobox')).toHaveTextContent('America/New York (UTC-04:00)');
  });
});
