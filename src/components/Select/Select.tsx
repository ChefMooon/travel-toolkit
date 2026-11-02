import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { getViewport, nextActiveIndex, selectPlacement, usePopoverPosition } from '@/components/Popover';

interface SelectProps {
  id?: string;
  value: string;
  options: readonly string[];
  getOptionLabel?: (value: string) => string;
  onChange: (value: string) => void;
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  'data-testid'?: string;
}

export default function Select({ id, value, options, onChange, getOptionLabel = (option) => option, className = '', style, disabled = false, ...attrs }: SelectProps) {
  const generatedId = useId();
  const controlId = id ?? `select-${generatedId}`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  // Keep the portal out of document flow before its first measurement so it
  // cannot introduce a page scrollbar and change the trigger's width.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef('');
  const typeaheadTimer = useRef<number | undefined>(undefined);
  const activeId = `${controlId}-option-${options.indexOf(active)}`;
  const placement = usePopoverPosition<CSSProperties>({ open, initial: { position: 'fixed', visibility: 'hidden' }, deps: [options.length],
    compute: () => { const rect = triggerRef.current?.getBoundingClientRect(); return rect && selectPlacement(rect, getViewport(), options.length); } });

  useLayoutEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !listRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useEffect(() => () => window.clearTimeout(typeaheadTimer.current), []);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useEffect(() => { if (!options.includes(active)) setActive(options.includes(value) ? value : options[0] ?? ''); }, [active, options, value]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>(`#${CSS.escape(activeId)}`);
    if (!list || !option) return;
    const listRect = list.getBoundingClientRect();
    const optionRect = option.getBoundingClientRect();
    if (optionRect.top < listRect.top) list.scrollTop -= listRect.top - optionRect.top;
    else if (optionRect.bottom > listRect.bottom) list.scrollTop += optionRect.bottom - listRect.bottom;
  }, [open, activeId]);

  const openAt = (next = value) => { if (disabled || options.length === 0) return; setActive(options.includes(next) ? next : options[0] ?? ''); setOpen(true); };
  const commit = (next: string) => { if (disabled || !options.includes(next)) { setOpen(false); return; } onChange(next); setActive(next); setOpen(false); triggerRef.current?.focus(); };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const index = Math.max(0, options.indexOf(open ? active : value));
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key === 'Escape') { if (open) event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (open) commit(active); else openAt(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!open) openAt();
      const nextIndex = nextActiveIndex(event.key, { current: index, count: options.length, wrap: true, homeEnd: true }) ?? -1;
      setActive(options[nextIndex] ?? ''); return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeahead.current += event.key.toLocaleLowerCase();
      window.clearTimeout(typeaheadTimer.current);
      typeaheadTimer.current = window.setTimeout(() => { typeahead.current = ''; }, 700);
      const match = options.find((option) => getOptionLabel(option).toLocaleLowerCase().startsWith(typeahead.current));
      if (match) { event.preventDefault(); setActive(match); if (!open) setOpen(true); }
    }
  };

  return <>
    <button ref={triggerRef} id={controlId} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
      aria-controls={`${controlId}-listbox`} aria-activedescendant={open ? activeId : undefined} aria-label={attrs['aria-label']}
      data-testid={attrs['data-testid']} className={`shared-select ${className}`} style={style} onKeyDown={keyDown}
      onBlur={() => setOpen(false)} onClick={() => open ? setOpen(false) : openAt()}>
      <span className="shared-select-value">{getOptionLabel(value)}</span><ChevronDown aria-hidden="true" size={14} />
    </button>
    {open && createPortal(<div ref={listRef} id={`${controlId}-listbox`} role="listbox" aria-labelledby={controlId}
      className="shared-select-listbox" style={placement}>
      {options.map((option, index) => <button key={option} id={`${controlId}-option-${index}`} type="button" role="option" tabIndex={-1}
        aria-selected={option === value} className={`shared-select-option${option === active ? ' is-active' : ''}`}
        onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActive(option)} onClick={() => commit(option)}>
        <span>{getOptionLabel(option)}</span>{option === value && <Check size={14} aria-hidden="true" />}
      </button>)}
    </div>, document.body)}
  </>;
}
