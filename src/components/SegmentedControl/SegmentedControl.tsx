import { type CSSProperties, type KeyboardEvent, type ReactNode, useRef } from 'react';
import Tooltip from '@/components/Tooltip';

export type SegmentedControlSemantics = 'radio' | 'native-radio' | 'pressed';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  /** Visible text. Omit for icon-only options and provide `ariaLabel` instead. */
  label?: ReactNode;
  /** Accessible name; required when the option has no visible text. */
  ariaLabel?: string;
  /** Supplemental hover/focus text (button semantics only). */
  tooltip?: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  /**
   * `radio`: ARIA radiogroup of buttons with roving focus; arrows select.
   * `native-radio`: visually hidden `input[type=radio]` inside labels.
   * `pressed`: group of toggle buttons with `aria-pressed`; no arrow keys.
   */
  semantics: SegmentedControlSemantics;
  options: ReadonlyArray<SegmentedControlOption<T>>;
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Radio group name (native-radio only). */
  name?: string;
  /** Show the sliding selection indicator. */
  indicator?: boolean;
  /** Column count used below 600px; options wrap onto rows. */
  narrowColumns?: number;
  size?: 'sm' | 'md';
  className?: string;
}

type SegmentedStyle = CSSProperties & Record<`--seg-${string}`, number>;

export default function SegmentedControl<T extends string = string>({
  semantics,
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  name,
  indicator = true,
  narrowColumns,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const showIndicator = indicator && selectedIndex >= 0;

  const style: SegmentedStyle = { '--seg-count': options.length };
  if (showIndicator) style['--seg-index'] = selectedIndex;
  if (narrowColumns) {
    style['--seg-cols'] = narrowColumns;
    style['--seg-rows'] = Math.ceil(options.length / narrowColumns);
    if (showIndicator) {
      style['--seg-col'] = selectedIndex % narrowColumns;
      style['--seg-row'] = Math.floor(selectedIndex / narrowColumns);
    }
  }

  const handleRadioKeyDown = (index: number, event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index + options.length - 1) % options.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = options.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextOption = options[nextIndex];
    if (!nextOption) return;

    onChange(nextOption.value);
    buttonRefs.current[nextIndex]?.focus();
  };

  const role = semantics === 'radio'
    ? 'radiogroup'
    : semantics === 'pressed'
      ? 'group'
      : ariaLabel || ariaLabelledBy ? 'radiogroup' : undefined;

  return (
    <div
      className={['segmented', className].filter(Boolean).join(' ')}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      data-size={size}
      data-indicator={showIndicator ? '' : undefined}
      data-narrow={narrowColumns ? '' : undefined}
      style={style}
    >
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        const content = (
          <>
            {option.icon}
            {option.label !== undefined && <span className="segmented-option-label">{option.label}</span>}
          </>
        );

        if (semantics === 'native-radio') {
          return (
            <label key={option.value} className="segmented-option" data-selected={selected ? '' : undefined}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                aria-label={option.ariaLabel}
                onChange={() => onChange(option.value)}
              />
              {content}
            </label>
          );
        }

        const button = semantics === 'radio'
          ? (
            <button
              key={option.value}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
              className="segmented-option"
              data-selected={selected ? '' : undefined}
              role="radio"
              aria-label={option.ariaLabel}
              aria-checked={selected}
              tabIndex={selected || (selectedIndex < 0 && index === 0) ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleRadioKeyDown(index, event)}
            >
              {content}
            </button>
          )
          : (
            <button
              key={option.value}
              type="button"
              className="segmented-option"
              data-selected={selected ? '' : undefined}
              aria-label={option.ariaLabel}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
            >
              {content}
            </button>
          );

        return option.tooltip
          ? <Tooltip key={option.value} content={option.tooltip}>{button}</Tooltip>
          : button;
      })}
    </div>
  );
}
