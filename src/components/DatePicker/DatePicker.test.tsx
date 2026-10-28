/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import DatePicker from './DatePicker';

describe('DatePicker calendar accessibility and navigation', () => {
  it('clears a filled date and returns focus to its input', () => {
    function Example() {
      const [value, setValue] = useState('2026-10-15');
      return <DatePicker id="date" label="Start date" value={value} onChange={setValue} />;
    }
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear start date' }));
    expect(screen.getByLabelText('Start date')).toHaveValue('');
    expect(screen.getByLabelText('Start date')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear start date' })).not.toBeInTheDocument();
  });
  it('selects the current local date and restores focus when Today is enabled', () => {
    const onChange = vi.fn();
    render(<DatePicker id="date" label="Start date" value="2020-01-01" onChange={onChange} showToday />);
    const trigger = screen.getByRole('button', { name: 'Choose start date' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    const now = new Date();
    const expected = `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(onChange).toHaveBeenCalledWith(expected);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('uses shared month selection and year step modifiers', () => {
    render(<DatePicker id="date" label="Start date" value="2026-10-15" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose start date' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Choose month' }));
    fireEvent.click(screen.getByRole('option', { name: 'November' }));
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    const increase = screen.getByRole('button', { name: 'Increase Choose year' });
    fireEvent.click(increase);
    expect(screen.getByRole('grid', { name: 'November 2027' })).toBeInTheDocument();
    fireEvent.click(increase, { shiftKey: true });
    expect(screen.getByRole('grid', { name: 'November 2037' })).toBeInTheDocument();
    fireEvent.click(increase, { shiftKey: true, ctrlKey: true });
    expect(screen.getByRole('grid', { name: 'November 2137' })).toBeInTheDocument();
  });

  it('shows date format help on hover and click while preserving the input description', () => {
    render(<DatePicker id="date" label="Start date" value="" onChange={vi.fn()} />);
    const info = screen.getByRole('button', { name: 'Start date format information' });
    fireEvent.pointerEnter(info, { pointerType: 'mouse' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Enter date as YYYY-MM-DD.');
    fireEvent.pointerLeave(info, { pointerType: 'mouse' });
    fireEvent.click(info);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Enter date as YYYY-MM-DD.');
    expect(screen.getByLabelText('Start date')).toHaveAccessibleDescription('Enter date as YYYY-MM-DD.');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('focuses the selected day without scrolling the page', () => {
    const focus = vi.spyOn(HTMLButtonElement.prototype, 'focus');
    render(<DatePicker id="date" label="Start date" value="2028-02-29" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose start date' }));
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    focus.mockRestore();
  });

  it('uses grid rows and gridcells with one roving day tab stop', () => {
    render(<DatePicker id="date" label="Start date" value="2028-02-29" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose start date' }));
    const grid = screen.getByRole('grid', { name: 'February 2028' });
    expect(grid.closest('[role="dialog"]')?.parentElement).toBe(document.body);
    expect(within(grid).getAllByRole('row').length).toBeGreaterThanOrEqual(4);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(within(grid).getAllByRole('row').length * 7);
    const tabbableDays = within(grid).getAllByRole('button').filter((button) => button.getAttribute('tabindex') === '0');
    expect(tabbableDays).toHaveLength(1);
    expect(tabbableDays[0]).toHaveAccessibleName('Tuesday, February 29, 2028');
    expect(within(grid).getByRole('gridcell', { selected: true })).toContainElement(tabbableDays[0]!);
  });

  it('moves focus and view across months, and Shift+PageDown advances a year', () => {
    render(<DatePicker id="date" label="Start date" value="2028-01-31" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choose start date' }));
    const grid = screen.getByRole('grid');
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(screen.getByRole('grid', { name: 'February 2028' })).toBeInTheDocument();
    expect(document.activeElement).toHaveAttribute('data-day', '1');
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'PageDown', shiftKey: true });
    expect(screen.getByRole('grid', { name: 'February 2029' })).toBeInTheDocument();
    expect(document.activeElement).toHaveAttribute('data-day', '1');
  });

  it('restores focus to the calendar trigger on Escape and exposes the input format hint', () => {
    render(<DatePicker id="date" label="Start date" value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText('Start date');
    expect(input).toHaveAccessibleDescription('Enter date as YYYY-MM-DD.');
    const trigger = screen.getByRole('button', { name: 'Choose start date' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('supports direct year selection and places the popup above the fixed mobile navigation', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 812 });
    const mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-nav';
    document.body.append(mobileNav);
    vi.spyOn(mobileNav, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 754, left: 0, right: 375, top: 754, bottom: 812, width: 375, height: 58, toJSON: () => ({}) });
    render(<DatePicker id="date" label="Start date" value="2026-10-15" onChange={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Choose start date' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({ x: 331, y: 700, left: 331, right: 375, top: 700, bottom: 744, width: 44, height: 44, toJSON: () => ({}) });
    fireEvent.click(trigger);
    const popup = screen.getByRole('dialog');
    Object.defineProperty(popup, 'scrollHeight', { configurable: true, value: 281 });
    const year = screen.getByRole('spinbutton', { name: 'Choose year' });
    fireEvent.change(year, { target: { value: '2031' } });
    fireEvent.blur(year);
    expect(screen.getByRole('grid', { name: 'October 2031' })).toBeInTheDocument();
    await waitFor(() => expect(popup).toHaveStyle({ position: 'fixed', left: '63px', top: '413px' }));
    expect(Number.parseFloat(popup.style.top) + 281).toBeLessThanOrEqual(742);
    mobileNav.remove();
  });
});
