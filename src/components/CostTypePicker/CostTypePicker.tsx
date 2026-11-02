import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { COST_ENTRY_TYPES } from '@/store/types';
import Tooltip from '@/components/Tooltip';
import { costTypePlacement, getViewport, usePopoverPosition } from '@/components/Popover';
import { useTranslation } from 'react-i18next';
import '@/i18n';

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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = COST_ENTRY_TYPES.find((entry) => entry.id === value);
  const position = usePopoverPosition<CSSProperties>({ open, initial: {}, deps: [form],
    compute: () => { const rect = triggerRef.current?.getBoundingClientRect(); return rect && costTypePlacement(rect, getViewport(), form); } });

  useLayoutEffect(() => {
    if (!open) return;
    const dismiss = (event: MouseEvent) => {
      if (!triggerRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', keydown);
    };
  }, [open]);

  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return <>
    <div className={`type-popover-container${form ? ' type-picker-form' : ''}`}>
      <Tooltip content={selected ? t('changeCostTypeTooltip', { type: t(`costType_${selected.id}`, { defaultValue: selected.type_name }) }) : t('changeType')}>
        <button ref={triggerRef} id={id} type="button"
          className={`type-trigger-btn${selected ? '' : ' is-empty'}${form ? ' type-picker-form-trigger' : ''}`}
          style={selected ? { '--cost-type-color': selected.color } as CSSProperties : undefined}
          aria-label={label ?? (form ? t('typeValue', { type: selected ? t(`costType_${selected.id}`, { defaultValue: selected.type_name }) : t('none') }) : undefined)} aria-expanded={open} aria-controls={optionsId}
          onBlur={(event) => { if (!menuRef.current?.contains(event.relatedTarget as Node)) setOpen(false); }}
          onClick={() => setOpen((current) => !current)}>
          {selected ? <><span aria-hidden="true">{selected.symbol}</span><span className="type-trigger-label">{t(`costType_${selected.id}`, { defaultValue: selected.type_name })}</span></> : t('setType')}
        </button>
      </Tooltip>
    </div>
    {createPortal(<div ref={menuRef} id={optionsId} className="popover split-popover type-picker-menu"
      role="group" aria-label={groupLabel} hidden={!open}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== triggerRef.current) setOpen(false);
      }}
      style={{ ...position, display: open ? 'flex' : 'none' }}>
      <button type="button" className={`popover-item${!value ? ' selected' : ''}`} aria-pressed={!value} onClick={() => choose(null)}>✕ {t('none')}</button>
      {COST_ENTRY_TYPES.map((entry) => {
        const isSelected = value === entry.id;
        return <button key={entry.id} type="button" className="popover-item" aria-pressed={isSelected}
          style={{ backgroundColor: isSelected ? entry.color + '33' : entry.color + '20', color: isSelected ? entry.color : undefined, fontWeight: isSelected ? 800 : undefined }}
          onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = entry.color + '40'; }}
          onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = isSelected ? entry.color + '33' : entry.color + '20'; }}
          onClick={() => choose(entry.id)}>{entry.symbol} {t(`costType_${entry.id}`, { defaultValue: entry.type_name })}</button>;
      })}
    </div>, document.body)}
  </>;
}
