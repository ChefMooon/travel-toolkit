import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import Tooltip from '@/components/Tooltip';
import Select from '@/components/Select/Select';
import NumericInput from '@/components/NumericInput/NumericInput';
import { isValidDateOnly } from './dateUtils';
import { useTranslation } from 'react-i18next';
import { activeLocale } from '@/i18n/format';

type Props = { id: string; label: string; value: string; onChange: (value: string) => void; invalid?: boolean; describedBy?: string; showToday?: boolean };
type View = { year: number; month: number };
const pad = (n: number) => String(n).padStart(2, '0');
const fromParts = (y: number, m: number, d: number) => `${String(y).padStart(4, '0')}-${pad(m)}-${pad(d)}`;
const dateAt = (year: number, month: number, day: number) => {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, day);
  return date;
};
const monthView = (view: View, amount: number) => {
  const date = dateAt(view.year, view.month + amount, 1);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
};

export default function DatePicker({ id, label, value, onChange, invalid, describedBy, showToday = false }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const initialDate = isValidDateOnly(value) ? new Date(`${value}T00:00:00Z`) : new Date();
  const [view, setView] = useState<View>(() => ({ year: isValidDateOnly(value) ? initialDate.getUTCFullYear() : initialDate.getFullYear(), month: isValidDateOnly(value) ? initialDate.getUTCMonth() : initialDate.getMonth() }));
  const [yearDraft, setYearDraft] = useState(() => String(isValidDateOnly(value) ? initialDate.getUTCFullYear() : initialDate.getFullYear()));
  const [focusDay, setFocusDay] = useState(() => isValidDateOnly(value) ? Number(value.slice(-2)) : new Date().getDate());
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({ position: 'fixed', visibility: 'hidden' });
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);
  const keepHeaderFocus = useRef(false);
  const monthLabel = new Intl.DateTimeFormat(activeLocale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dateAt(view.year, view.month, 1));
  const days = useMemo(() => {
    const first = dateAt(view.year, view.month, 1).getUTCDay();
    const count = dateAt(view.year, view.month + 1, 0).getUTCDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1), ...Array((7 - ((first + count) % 7)) % 7).fill(null)];
  }, [view]);
  const setCalendarMonth = (next: View, day = focusDay) => {
    pendingFocus.current = true;
    setView(next);
    setYearDraft(String(next.year));
    const maxDay = dateAt(next.year, next.month + 1, 0).getUTCDate();
    setFocusDay(Math.min(day, maxDay));
  };
  const measurePopup = useCallback(() => {
    const anchor = trigger.current?.getBoundingClientRect();
    const panel = popup.current;
    if (!anchor || !panel) return;
    const margin = 12;
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);
    const mobileNav = document.querySelector<HTMLElement>('.mobile-nav');
    const navRect = mobileNav?.getBoundingClientRect();
    const navVisible = !!navRect && navRect.height > 0 && navRect.top < viewportBottom;
    const fallbackNavTop = window.innerWidth <= 767 ? viewportBottom - 58 : viewportBottom;
    const usableBottom = Math.min(viewportBottom, navVisible ? navRect.top : fallbackNavTop);
    const usableHeight = Math.max(0, usableBottom - viewportTop - margin * 2);
    const width = Math.max(0, Math.min(300, window.innerWidth - margin * 2));
    const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - width - margin));
    const height = Math.min(panel.scrollHeight, usableHeight);
    const below = usableBottom - anchor.bottom - 6;
    const above = anchor.top - viewportTop - 6;
    const top = below >= height || below >= above ? Math.min(anchor.bottom + 6, usableBottom - height - margin) : Math.max(viewportTop + margin, anchor.top - height - 6);
    setPopupStyle({ position: 'fixed', left, top, width, maxHeight: usableHeight, overflowY: 'auto' });
  }, []);
  useLayoutEffect(() => {
    if (open) measurePopup();
  }, [open, measurePopup]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      const listbox = target instanceof Element ? target.closest('[role="listbox"]') : null;
      if (listbox?.id === `${id}-month-listbox`) return;
      if (!root.current?.contains(target) && !popup.current?.contains(target)) setOpen(false);
    };
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', keys);
    window.addEventListener('resize', measurePopup);
    window.addEventListener('scroll', measurePopup, true);
    window.visualViewport?.addEventListener('resize', measurePopup);
    window.visualViewport?.addEventListener('scroll', measurePopup);
    const frame = requestAnimationFrame(measurePopup);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', keys); window.removeEventListener('resize', measurePopup); window.removeEventListener('scroll', measurePopup, true); window.visualViewport?.removeEventListener('resize', measurePopup); window.visualViewport?.removeEventListener('scroll', measurePopup); };
  }, [open, measurePopup, id]);
  useEffect(() => {
    if (!open || !grid.current) return;
    if (keepHeaderFocus.current) { keepHeaderFocus.current = false; return; }
    if (pendingFocus.current) pendingFocus.current = false;
    grid.current.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus({ preventScroll: true });
  }, [open, view, focusDay]);
  const choose = (day: number) => { onChange(fromParts(view.year, view.month + 1, day)); setOpen(false); trigger.current?.focus(); };
  const handleGridKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let offset = 0;
    if (event.key === 'ArrowRight') offset = 1;
    else if (event.key === 'ArrowLeft') offset = -1;
    else if (event.key === 'ArrowDown') offset = 7;
    else if (event.key === 'ArrowUp') offset = -7;
    else if (event.key === 'Home') offset = -dateAt(view.year, view.month, focusDay).getUTCDay();
    else if (event.key === 'End') offset = 6 - dateAt(view.year, view.month, focusDay).getUTCDay();
    else if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      const next = monthView(view, event.key === 'PageDown' ? (event.shiftKey ? 12 : 1) : (event.shiftKey ? -12 : -1));
      setCalendarMonth(next);
      return;
    } else return;
    event.preventDefault();
    const date = dateAt(view.year, view.month, focusDay + offset);
    const next = { year: date.getUTCFullYear(), month: date.getUTCMonth() };
    if (next.year !== view.year || next.month !== view.month) setCalendarMonth(next, date.getUTCDate());
    else { setFocusDay(date.getUTCDate()); grid.current?.querySelector<HTMLButtonElement>(`[data-day="${date.getUTCDate()}"]`)?.focus({ preventScroll: true }); }
  };
  const now = new Date();
  const today = `${String(now.getFullYear()).padStart(4, '0')}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(activeLocale(), { month: 'long', timeZone: 'UTC' }).format(dateAt(2024, month, 1)));
  const weekdays = Array.from({ length: 7 }, (_, day) => new Intl.DateTimeFormat(activeLocale(), { weekday: 'narrow', timeZone: 'UTC' }).format(dateAt(2024, 0, day + 7)));
  const formatHintId = `${id}-format-hint`;
  const describedByIds = [describedBy, formatHintId].filter(Boolean).join(' ');
  return <div className="date-picker" ref={root}>
    <div className="date-picker-label-row"><label className="date-picker-label" htmlFor={id}>{label}</label><Tooltip content={t('dateFormatHint')} showOnClick><button type="button" className="date-picker-info" aria-label={t('formatInformation', { label })}><Info size={14} aria-hidden="true" /></button></Tooltip></div>
    <div className="date-picker-control">
      <input ref={input} id={id} type="text" inputMode="numeric" autoComplete="off" placeholder={t('dateFormatPlaceholder')} aria-label={label} aria-invalid={invalid || undefined} aria-describedby={describedByIds} value={value} onChange={(event) => onChange(event.target.value)} />
      {value && <button type="button" className="date-picker-clear" aria-label={t('clearDate', { label: label.toLowerCase() })} onClick={() => { setOpen(false); onChange(''); input.current?.focus(); }}><X size={16} aria-hidden="true" /></button>}
      <button ref={trigger} type="button" className="date-picker-trigger" aria-label={t('chooseDate', { label: label.toLowerCase() })} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-calendar`} onClick={() => {
        if (!open && isValidDateOnly(value)) { const date = new Date(`${value}T00:00:00Z`); const next = { year: date.getUTCFullYear(), month: date.getUTCMonth() }; setView(next); setFocusDay(Number(value.slice(-2))); }
        setOpen(!open);
      }}><CalendarDays size={18} aria-hidden="true" /></button>
    </div>
    <span id={formatHintId} className="sr-only">{t('dateFormatHint')}</span>
    {open && createPortal(<div id={`${id}-calendar`} ref={popup} className="date-picker-popover" style={popupStyle} role="dialog" aria-label={t('calendarFor', { date: label })}>
      <div className="date-picker-header">
        <button type="button" aria-label={t('previousMonth')} onClick={() => setCalendarMonth(monthView(view, -1))}><ChevronLeft size={18} /></button>
        <span className="sr-only" aria-live="polite">{monthLabel}</span>
        <div className="date-picker-month-year" aria-live="polite">
          <label className="sr-only" htmlFor={`${id}-month`}>{t('chooseMonth')}</label><Select id={`${id}-month`} aria-label={t('chooseMonth')} className="date-picker-month" value={String(view.month)} options={monthNames.map((_, month) => String(month))} getOptionLabel={(month) => monthNames[Number(month)] ?? ''} onChange={(month) => setCalendarMonth({ ...view, month: Number(month) })} />
          <label className="sr-only" htmlFor={`${id}-year`}>{t('chooseYear')}</label><NumericInput id={`${id}-year`} aria-label={t('chooseYear')} min="1" max="9999" step="1" shiftSteps={10} acceleratedSteps={100} value={yearDraft} onChange={(event) => { const text = event.target.value; setYearDraft(text); const year = Number(text); if (Number.isInteger(year) && year >= 1 && year <= 9999 && year !== view.year) { keepHeaderFocus.current = true; setFocusDay((day) => Math.min(day, dateAt(year, view.month + 1, 0).getUTCDate())); setView((current) => ({ ...current, year })); } }} onBlur={() => { const year = Number(yearDraft); if (!yearDraft || !Number.isInteger(year) || year < 1 || year > 9999) setYearDraft(String(view.year)); }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
        </div>
        <button type="button" aria-label={t('nextMonth')} onClick={() => setCalendarMonth(monthView(view, 1))}><ChevronRight size={18} /></button>
      </div>
      <div className="date-picker-weekdays" aria-hidden="true">{weekdays.map((day, index) => <span key={index}>{day}</span>)}</div>
      <div className="date-picker-grid" role="grid" aria-label={monthLabel} aria-rowcount={days.length / 7} ref={grid} onKeyDown={handleGridKey}>
        {Array.from({ length: days.length / 7 }, (_, row) => <div role="row" className="date-picker-row" key={row}>
          {days.slice(row * 7, row * 7 + 7).map((day, col) => <div role="gridcell" key={col} aria-selected={day ? value === fromParts(view.year, view.month + 1, day) : undefined}>
            {day ? <button type="button" data-day={day} tabIndex={day === focusDay ? 0 : -1} aria-label={new Intl.DateTimeFormat(activeLocale(), { dateStyle: 'full', timeZone: 'UTC' }).format(dateAt(view.year, view.month, day))} aria-current={fromParts(view.year, view.month + 1, day) === today ? 'date' : undefined} onFocus={() => setFocusDay(day)} onClick={() => choose(day)}>{day}</button> : null}
          </div>)}
        </div>)}
      </div>
      {showToday && <div className="date-picker-footer"><button type="button" className="date-picker-today" onClick={() => {
        const current = new Date();
        onChange(fromParts(current.getFullYear(), current.getMonth() + 1, current.getDate()));
        setOpen(false);
        trigger.current?.focus();
      }}>{t('today')}</button></div>}
    </div>, document.body)}
  </div>;
}
