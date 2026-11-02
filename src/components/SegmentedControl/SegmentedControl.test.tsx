import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl from './SegmentedControl';
import type { SegmentedControlOption, SegmentedControlSemantics } from './SegmentedControl';

const OPTIONS: SegmentedControlOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

function Harness({
  semantics,
  options = OPTIONS,
  initial = 'a',
  onChange,
  narrowColumns,
  indicator,
}: {
  semantics: SegmentedControlSemantics;
  options?: SegmentedControlOption[];
  initial?: string;
  onChange?: (value: string) => void;
  narrowColumns?: number;
  indicator?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <SegmentedControl
      semantics={semantics}
      aria-label="Letters"
      name="letters"
      options={options}
      value={value}
      narrowColumns={narrowColumns}
      indicator={indicator}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('SegmentedControl radio semantics', () => {
  it('renders a radiogroup of radios with aria-checked and roving tabindex', () => {
    render(<Harness semantics="radio" initial="b" />);
    expect(screen.getByRole('radiogroup', { name: 'Letters' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.textContent)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(radios.map((radio) => radio.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('makes the first option tabbable when nothing is selected', () => {
    render(<Harness semantics="radio" initial="zzz" />);
    expect(screen.getAllByRole('radio').map((radio) => radio.tabIndex)).toEqual([0, -1, -1]);
  });

  it('selects and focuses with arrow keys, wrapping at both ends', () => {
    const onChange = vi.fn();
    render(<Harness semantics="radio" initial="c" onChange={onChange} />);
    const radios = screen.getAllByRole('radio');

    fireEvent.keyDown(radios[2]!, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('a');
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveFocus();

    fireEvent.keyDown(radios[0]!, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('c');
    expect(radios[2]).toHaveFocus();

    fireEvent.keyDown(radios[2]!, { key: 'ArrowDown' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(radios[0]!, { key: 'ArrowUp' });
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    expect(radios[2]).toHaveFocus();
  });

  it('jumps to the ends with Home and End', () => {
    render(<Harness semantics="radio" initial="b" />);
    const radios = screen.getAllByRole('radio');

    fireEvent.keyDown(radios[1]!, { key: 'End' });
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
    expect(radios[2]).toHaveFocus();

    fireEvent.keyDown(radios[2]!, { key: 'Home' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveFocus();
  });

  it('ignores unrelated keys and selects on click', () => {
    const onChange = vi.fn();
    render(<Harness semantics="radio" onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0]!, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(radios[1]!);
    expect(onChange).toHaveBeenCalledWith('b');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps roles, names and roving focus when options have tooltips', () => {
    const options: SegmentedControlOption[] = [
      { value: 'a', ariaLabel: 'Alpha option', tooltip: 'Use alpha', icon: <svg aria-hidden="true" /> },
      { value: 'b', ariaLabel: 'Bravo option', tooltip: 'Use bravo', icon: <svg aria-hidden="true" /> },
    ];
    render(<Harness semantics="radio" options={options} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual(['Alpha option', 'Bravo option']);

    fireEvent.keyDown(radios[0]!, { key: 'ArrowRight' });
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Use bravo');
    expect(radios[1]).toHaveAccessibleDescription('Use bravo');
  });
});

describe('SegmentedControl native-radio semantics', () => {
  it('renders named native radios labelled by their visible text', () => {
    const onChange = vi.fn();
    render(<Harness semantics="native-radio" onChange={onChange} />);
    const bravo = screen.getByRole('radio', { name: 'Bravo' });
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    expect(bravo).not.toBeChecked();
    expect(bravo).toHaveAttribute('name', 'letters');
    expect(bravo).toHaveAttribute('type', 'radio');

    fireEvent.click(bravo);
    expect(onChange).toHaveBeenCalledWith('b');
    expect(bravo).toBeChecked();
    expect(bravo.closest('.segmented-option')).toHaveAttribute('data-selected');
  });
});

describe('SegmentedControl pressed semantics', () => {
  it('renders a group of aria-pressed buttons without arrow-key handling', () => {
    const onChange = vi.fn();
    render(<Harness semantics="pressed" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Letters' })).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
    expect(buttons.every((button) => !button.hasAttribute('tabindex'))).toBe(true);

    fireEvent.keyDown(buttons[0]!, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(buttons[2]!);
    expect(onChange).toHaveBeenCalledWith('c');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('SegmentedControl pressed semantics extras', () => {
  it('keeps names, aria-pressed and tooltip descriptions with tooltips', () => {
    const options: SegmentedControlOption[] = [
      { value: 'a', label: 'Alpha', tooltip: 'Use alpha' },
      { value: 'b', label: 'Bravo', tooltip: 'Use bravo' },
    ];
    render(<Harness semantics="pressed" options={options} />);
    const bravo = screen.getByRole('button', { name: 'Bravo' });
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(bravo);
    expect(bravo).toHaveAttribute('aria-pressed', 'true');
    fireEvent.focus(bravo);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Use bravo');
    expect(bravo).toHaveAccessibleDescription('Use bravo');
  });

  it('renders the selection on the option itself when indicator is off', () => {
    const onChange = vi.fn();
    const { container } = render(<Harness semantics="pressed" indicator={false} onChange={onChange} />);
    const root = container.querySelector('.segmented') as HTMLElement;
    expect(root).not.toHaveAttribute('data-indicator');
    expect(root.style.getPropertyValue('--seg-index')).toBe('');
    expect(container.querySelectorAll('[data-selected]')).toHaveLength(1);

    // Re-clicking the selected option still reports it.
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith('a');

    fireEvent.click(screen.getByRole('button', { name: 'Bravo' }));
    expect(screen.getByRole('button', { name: 'Bravo' })).toHaveAttribute('data-selected');
    expect(container.querySelectorAll('[data-selected]')).toHaveLength(1);
  });
});

describe('SegmentedControl styling hooks', () => {
  it('marks the selected option and exposes index custom properties', () => {
    const { container } = render(<Harness semantics="radio" initial="c" />);
    const root = container.querySelector('.segmented') as HTMLElement;
    expect(root).toHaveAttribute('data-indicator');
    expect(root.style.getPropertyValue('--seg-count')).toBe('3');
    expect(root.style.getPropertyValue('--seg-index')).toBe('2');
    const selected = container.querySelectorAll('[data-selected]');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Charlie');

    fireEvent.click(screen.getByRole('radio', { name: 'Alpha' }));
    expect(root.style.getPropertyValue('--seg-index')).toBe('0');
  });

  it('exposes column and row positions for narrow layouts', () => {
    const options = [...OPTIONS, { value: 'd', label: 'Delta' }];
    const { container } = render(<Harness semantics="native-radio" options={options} initial="c" narrowColumns={2} />);
    const root = container.querySelector('.segmented') as HTMLElement;
    expect(root).toHaveAttribute('data-narrow');
    expect(root.style.getPropertyValue('--seg-cols')).toBe('2');
    expect(root.style.getPropertyValue('--seg-rows')).toBe('2');
    expect(root.style.getPropertyValue('--seg-col')).toBe('0');
    expect(root.style.getPropertyValue('--seg-row')).toBe('1');
  });

  it('drops the indicator when no option matches the value', () => {
    const { container } = render(<Harness semantics="radio" initial="zzz" />);
    const root = container.querySelector('.segmented') as HTMLElement;
    expect(root).not.toHaveAttribute('data-indicator');
    expect(root.style.getPropertyValue('--seg-index')).toBe('');
    expect(container.querySelector('[data-selected]')).toBeNull();
  });
});
