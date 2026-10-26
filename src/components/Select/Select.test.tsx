import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Select from './Select';

describe('Select', () => {
  it('opens from the trigger and commits a listbox option', () => {
    const onChange = vi.fn();
    render(<Select aria-label="Currency" value="CAD" options={['CAD', 'EUR', 'USD']} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'EUR' }));
    expect(onChange).toHaveBeenCalledWith('EUR');
    expect(trigger).toHaveTextContent('CAD'); // controlled value remains parent-owned
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows option labels while retaining raw values for selection and typeahead', () => {
    const onChange = vi.fn();
    const labels: Record<string, string> = { CAD: 'CAD — Canadian Dollar', EUR: 'EUR — Euro' };
    render(<Select aria-label="Currency" value="CAD" options={['CAD', 'EUR']} getOptionLabel={(value) => labels[value] ?? value} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    expect(trigger).toHaveTextContent('CAD — Canadian Dollar');
    fireEvent.keyDown(trigger, { key: 'e' });
    expect(screen.getByRole('option', { name: 'EUR — Euro' })).toHaveClass('is-active');
    fireEvent.click(screen.getByRole('option', { name: 'EUR — Euro' }));
    expect(onChange).toHaveBeenCalledWith('EUR');
  });

  it('supports keyboard navigation, typeahead, escape, and tab dismissal', () => {
    const onChange = vi.fn();
    render(<Select aria-label="Region" value="Europe" options={['Europe', 'Asia', 'Africa']} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Region' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-activedescendant');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('Africa');
    fireEvent.keyDown(trigger, { key: 'a' });
    expect(screen.getByRole('option', { name: 'Asia' })).toHaveClass('is-active');
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Tab' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('keeps options out of the tab order and restores trigger focus after selection', () => {
    const onChange = vi.fn();
    render(<><Select aria-label="Currency" value="CAD" options={['CAD', 'EUR']} onChange={onChange} /><button>Next</button></>);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    fireEvent.click(trigger);
    const option = screen.getByRole('option', { name: 'EUR' });
    expect(option).toHaveAttribute('tabindex', '-1');
    fireEvent.mouseDown(option);
    fireEvent.click(option);
    expect(trigger).toHaveFocus();
  });

  it('tracks the current value when closed and refuses to open when disabled', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Select aria-label="Currency" value="CAD" options={['CAD', 'EUR']} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    rerender(<Select aria-label="Currency" value="EUR" options={['EUR', 'GBP']} onChange={onChange} />);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('-option-1'));
    rerender(<Select aria-label="Currency" value="EUR" options={['EUR', 'GBP']} onChange={onChange} disabled />);
    expect(trigger).toBeDisabled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('dismisses on outside pointer and trigger blur', () => {
    render(<><Select aria-label="Currency" value="CAD" options={['CAD', 'EUR']} onChange={vi.fn()} /><button>Outside</button></>);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    fireEvent.blur(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('moves the active option back into the updated option set', () => {
    const { rerender } = render(<Select aria-label="Currency" value="CAD" options={['CAD', 'EUR']} onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('-option-1'));
    rerender(<Select aria-label="Currency" value="CAD" options={['CAD', 'GBP']} onChange={vi.fn()} />);
    expect(trigger).toHaveAttribute('aria-activedescendant', expect.stringContaining('-option-0'));
  });

  it('clamps the listbox horizontally and flips it above a low trigger', () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 240 });
    const { unmount } = render(<Select aria-label="Currency" value="CAD" options={['CAD', 'EUR']} onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 280, y: 200, left: 280, top: 200, right: 334, bottom: 228, width: 54, height: 28,
      toJSON: () => ({}),
    });
    fireEvent.click(trigger);
    const listbox = screen.getByRole('listbox');
    expect(listbox.style.width).toBe('100px');
    expect(listbox.style.left).toBe('212px');
    expect(listbox.style.bottom).toBe('44px');
    unmount();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalHeight });
  });

  it('keeps the listbox out of document flow during its initial measurement', () => {
    render(<Select aria-label="Timezone" value="Toronto" options={['Toronto', 'London']} onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox', { name: 'Timezone' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(() => {
      const listbox = screen.getByRole('listbox', { hidden: true });
      expect(listbox.style.position).toBe('fixed');
      expect(listbox.style.visibility).toBe('hidden');
      return { x: 20, y: 20, left: 20, top: 20, right: 320, bottom: 64, width: 300, height: 44, toJSON: () => ({}) };
    });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox').style.width).toBe('300px');
  });

  it('scrolls only the listbox to reveal the active option', () => {
    const oldScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const { unmount } = render(<Select aria-label="Currency" value="CAD" options={['CAD', 'EUR']} onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    fireEvent.click(trigger);
    const listbox = screen.getByRole('listbox');
    const option = screen.getByRole('option', { name: 'EUR' });
    listbox.scrollTop = 0;
    vi.spyOn(listbox, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 100, left: 0, top: 100, right: 100, bottom: 150, width: 100, height: 50, toJSON: () => ({}),
    });
    vi.spyOn(option, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 140, left: 0, top: 140, right: 100, bottom: 172, width: 100, height: 32, toJSON: () => ({}),
    });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(listbox.scrollTop).toBe(22);
    expect(scrollIntoView).not.toHaveBeenCalled();
    unmount();
    if (oldScrollIntoView) HTMLElement.prototype.scrollIntoView = oldScrollIntoView;
    else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
  });
});
