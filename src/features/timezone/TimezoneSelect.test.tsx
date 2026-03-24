/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimezoneSelect from '@/features/timezone/TimezoneSelect';

describe('TimezoneSelect', () => {
  it('FE-TZ-007a renders a large list of IANA timezone options', () => {
    render(
      <TimezoneSelect
        value="UTC"
        onChange={vi.fn()}
        placeholder="Select timezone"
        searchable
      />,
    );

    const options = screen.getByRole('combobox').querySelectorAll('option');
    expect(options.length).toBeGreaterThan(50);
  });

  it('FE-TZ-007b typing in the search input narrows the timezone list', () => {
    render(<TimezoneSelect value="UTC" onChange={vi.fn()} searchable />);

    const initialCount = screen.getByRole('combobox').querySelectorAll('option').length;

    fireEvent.change(screen.getByLabelText('Search timezones'), {
      target: { value: 'Tokyo' },
    });

    const filteredCount = screen.getByRole('combobox').querySelectorAll('option').length;
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  it('FE-TZ-007c selecting an option calls onChange with the timezone value', () => {
    const onChange = vi.fn();
    render(<TimezoneSelect value="" onChange={onChange} searchable />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'America/New_York' },
    });

    expect(onChange).toHaveBeenCalledWith('America/New_York');
  });
});
