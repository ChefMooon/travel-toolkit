import { forwardRef, useRef, type ComponentPropsWithoutRef } from 'react';
import Tooltip from '@/components/Tooltip';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';

type NumericInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  shiftSteps?: number;
  acceleratedSteps?: number;
};

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  { className = '', readOnly, disabled, onBlur, onKeyDown, shiftSteps = 100, acceleratedSteps = 1000, ...props }, forwardedRef,
) {
  const { t } = useTranslation();
  const localRef = useRef<HTMLInputElement>(null);
  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const step = (direction: 'up' | 'down', count = 1) => {
    const input = localRef.current;
    if (!input || disabled || readOnly) return;
    try {
      direction === 'up' ? input.stepUp(count) : input.stepDown(count);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } catch {
      // Native stepUp/stepDown can throw for invalid step attributes.
    }
  };

  return (
    <span
      className={`numeric-input${disabled ? ' is-disabled' : ''}`}
      onBlur={(event) => {
        const wrapper = event.currentTarget;
        const relatedTarget = event.relatedTarget as Node | null;
        const commitBlur = () => onBlur?.(event as unknown as React.FocusEvent<HTMLInputElement>);
        if (relatedTarget) {
          if (!wrapper.contains(relatedTarget)) commitBlur();
        } else {
          window.setTimeout(() => {
            if (!wrapper.contains(document.activeElement)) commitBlur();
          }, 0);
        }
      }}
    >
      <Tooltip content={t('numericStepperHelp', { shiftSteps: formatNumber(shiftSteps), acceleratedSteps: formatNumber(acceleratedSteps) })}>
        <input {...props} className={`${className} numeric-input-field`.trim()} ref={setRef} type="number" readOnly={readOnly} disabled={disabled} onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || disabled || readOnly || event.altKey) return;
          const direction = event.key === 'ArrowUp' || event.key === 'PageUp' ? 'up' : event.key === 'ArrowDown' || event.key === 'PageDown' ? 'down' : null;
          if (!direction) return;
          const count = event.shiftKey ? ((event.ctrlKey || event.metaKey) ? acceleratedSteps : shiftSteps) : (event.key === 'PageUp' || event.key === 'PageDown') && !event.ctrlKey && !event.metaKey ? 10 : 0;
          if (!count) return;
          event.preventDefault();
          step(direction, count);
        }} />
      </Tooltip>
      <span className="numeric-input-controls">
        <button type="button" aria-label={t('numericIncrease', { label: props['aria-label'] ?? t('numericValue') })} disabled={disabled || readOnly} onPointerDown={(event) => event.preventDefault()} onClick={(event) => step('up', event.shiftKey ? (event.ctrlKey || event.metaKey ? acceleratedSteps : shiftSteps) : 1)}>
          <svg viewBox="0 0 12 8" focusable="false"><path d="m2 6 4-4 4 4" /></svg>
        </button>
        <button type="button" aria-label={t('numericDecrease', { label: props['aria-label'] ?? t('numericValue') })} disabled={disabled || readOnly} onPointerDown={(event) => event.preventDefault()} onClick={(event) => step('down', event.shiftKey ? (event.ctrlKey || event.metaKey ? acceleratedSteps : shiftSteps) : 1)}>
          <svg viewBox="0 0 12 8" focusable="false"><path d="m2 2 4 4 4-4" /></svg>
        </button>
      </span>
    </span>
  );
});

export default NumericInput;
