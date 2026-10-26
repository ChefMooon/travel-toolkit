import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import NumericInput from './NumericInput';

function ControlledInput(props: { onBlur?: () => void }) {
  const [value, setValue] = useState('1.00');
  return <NumericInput aria-label="Quantity" step="0.25" min="0" max="2" value={value} onChange={(event) => setValue(event.target.value)} onBlur={props.onBlur} />;
}

describe('NumericInput', () => {
  it('retains native number semantics and provides themed step buttons', () => {
    render(<ControlledInput />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveAttribute('step', '0.25');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '2');
    expect(screen.getByRole('spinbutton').parentElement).toHaveClass('numeric-input');
  });

  it('steps the controlled value and uses pointer interaction without blurring or submitting', () => {
    const onBlur = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={onSubmit}><ControlledInput onBlur={onBlur} /><button type="submit">Save</button></form>);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    act(() => input.focus());
    const increment = screen.getByRole('button', { name: 'Increase Quantity' });
    const pointer = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    act(() => { increment.dispatchEvent(pointer); });
    expect(pointer.defaultPrevented).toBe(true);
    fireEvent.click(increment);
    expect(input).toHaveValue(1.25);
    fireEvent.change(input, { target: { value: '1.75' } });
    fireEvent.click(increment);
    expect(input).toHaveValue(2);
    fireEvent.click(increment);
    expect(input).toHaveValue(2);
    expect(onBlur).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps keyboard editing native and respects readOnly and disabled state', () => {
    render(<NumericInput aria-label="Locked" value="1" onChange={() => {}} step="0.1" readOnly />);
    expect(screen.getByRole('spinbutton', { name: 'Locked' })).toHaveAttribute('readonly');
    expect(screen.getByRole('spinbutton').parentElement!.querySelectorAll('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Increase Locked' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease Locked' })).toBeDisabled();
  });

  it('exposes keyboard-focusable named step buttons', () => {
    render(<ControlledInput />);
    const increase = screen.getByRole('button', { name: 'Increase Quantity' });
    const decrease = screen.getByRole('button', { name: 'Decrease Quantity' });
    expect(increase).toHaveAttribute('type', 'button');
    expect(increase).not.toHaveAttribute('tabindex', '-1');
    act(() => increase.focus());
    fireEvent.keyDown(increase, { key: 'Enter' });
    fireEvent.click(increase);
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue(1.25);
    expect(decrease).toBeInTheDocument();
  });

  it('applies larger keyboard and pointer steps without exceeding bounds', () => {
    function Amount() {
      const [value, setValue] = useState('5');
      return <NumericInput aria-label="Amount" step="0.01" min="0" max="20" value={value} onChange={(event) => setValue(event.target.value)} />;
    }
    render(<Amount />);
    const input = screen.getByRole('spinbutton', { name: 'Amount' });
    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });
    expect(input).toHaveValue(6);
    fireEvent.keyDown(input, { key: 'ArrowDown', shiftKey: true, ctrlKey: true });
    expect(input).toHaveValue(0);
    fireEvent.keyDown(input, { key: 'PageUp' });
    expect(input).toHaveValue(0.1);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Amount' }), { shiftKey: true, metaKey: true });
    expect(input).toHaveValue(10.1);
  });

  it('uses field-specific accelerated step sizes', () => {
    function Markup() {
      const [value, setValue] = useState('50');
      return <NumericInput aria-label="Markup" step="0.1" shiftSteps={10} acceleratedSteps={100} value={value} onChange={(event) => setValue(event.target.value)} />;
    }
    render(<Markup />);
    const input = screen.getByRole('spinbutton', { name: 'Markup' });
    fireEvent.keyDown(input, { key: 'ArrowUp', shiftKey: true });
    expect(input).toHaveValue(51);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease Markup' }), { shiftKey: true, ctrlKey: true });
    expect(input).toHaveValue(41);
  });
});
