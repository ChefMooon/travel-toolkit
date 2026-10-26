import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { COST_ENTRY_TYPES } from '@/store/types';
import Tooltip from '@/components/Tooltip';

interface CostTypePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  optionsId: string;
  groupLabel: string;
  id?: string;
  label?: string;
  form?: boolean;
}

export default function CostTypePicker({ value, onChange, optionsId, groupLabel, id, label, form = false }: CostTypePickerProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = COST_ENTRY_TYPES.find((entry) => entry.id === value);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(150, form ? rect.width : 150), window.innerWidth - 16);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const flip = below < 270 && above > below;
      setPosition({ position: 'fixed', left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        width, maxHeight: Math.max(0, flip ? above : below), overflowY: 'auto',
        ...(flip ? { top: 'auto', bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4, bottom: 'auto' }) });
    };
    const dismiss = (event: MouseEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', keydown);
    };
  }, [open, form]);

  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return <>
    <div className={`type-popover-container${form ? ' type-picker-form' : ''}`}>
      <Tooltip content={selected ? `Change type: ${selected.type_name}` : 'Change type'}>
        <button ref={triggerRef} id={id} type="button"
          className={`type-trigger-btn${selected ? '' : ' is-empty'}${form ? ' type-picker-form-trigger' : ''}`}
          style={selected ? { '--cost-type-color': selected.color } as CSSProperties : undefined}
          aria-label={label ?? (form ? `Type: ${selected?.type_name ?? 'None'}` : undefined)} aria-expanded={open} aria-controls={optionsId}
          onBlur={(event) => { if (!menuRef.current?.contains(event.relatedTarget as Node)) setOpen(false); }}
          onClick={() => setOpen((current) => !current)}>
          {selected ? <><span aria-hidden="true">{selected.symbol}</span><span className="type-trigger-label">{selected.type_name}</span></> : 'Set type'}
        </button>
      </Tooltip>
    </div>
    {createPortal(<div ref={menuRef} id={optionsId} className="popover split-popover type-picker-menu"
      role="group" aria-label={groupLabel} hidden={!open}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== triggerRef.current) setOpen(false);
      }}
      style={{ ...position, display: open ? 'flex' : 'none' }}>
      <button type="button" className={`popover-item${!value ? ' selected' : ''}`} aria-pressed={!value} onClick={() => choose(null)}>✕ None</button>
      {COST_ENTRY_TYPES.map((entry) => {
        const isSelected = value === entry.id;
        return <button key={entry.id} type="button" className="popover-item" aria-pressed={isSelected}
          style={{ backgroundColor: isSelected ? entry.color + '33' : entry.color + '20', color: isSelected ? entry.color : undefined, fontWeight: isSelected ? 800 : undefined }}
          onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = entry.color + '40'; }}
          onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = isSelected ? entry.color + '33' : entry.color + '20'; }}
          onClick={() => choose(entry.id)}>{entry.symbol} {entry.type_name}</button>;
      })}
    </div>, document.body)}
  </>;
}
