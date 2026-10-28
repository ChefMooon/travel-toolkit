import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { buildTimezoneOptions, type TimezoneOption } from './timezones';
import Select from '@/components/Select/Select';
import { useTranslation } from 'react-i18next';
import { activeLocale } from '@/i18n/format';

let cachedOptions: { minute: number; locale: string; options: TimezoneOption[] } | null = null;

function getAllOptions(now = Date.now(), locale = activeLocale()): TimezoneOption[] {
  const minute = Math.floor(now / 60_000);
  if (!cachedOptions || cachedOptions.minute !== minute || cachedOptions.locale !== locale) {
    cachedOptions = { minute, locale, options: buildTimezoneOptions(new Date(now), locale) };
  }

  return cachedOptions.options;
}

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  placeholder?: string;
  searchable?: boolean;
  addedTimezones?: string[];
}

interface PopoverPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export default function TimezoneSelect({
  value,
  onChange,
  placeholder,
  searchable = true,
  addedTimezones = [],
}: TimezoneSelectProps) {
  const { t } = useTranslation();
  const selectPlaceholder = placeholder ?? t('zoneSelectTimezone');
  const [query, setQuery] = useState('');
  const locale = activeLocale();
  const [options, setOptions] = useState(() => getAllOptions(Date.now(), locale));
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const pointerDownOnResultsRef = useRef(false);
  const listboxId = useId();

  useEffect(() => {
    let timer = 0;
    const refresh = () => {
      setOptions(getAllOptions(Date.now(), locale));
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, 60_000 - (Date.now() % 60_000) + 20);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    refresh();
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [locale]);

  const filtered = useMemo(() => {
    const allOptions = options;

    if (!searchable) return allOptions;

    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return allOptions;

    return allOptions.filter(
      (option) =>
        option.tz.toLocaleLowerCase(locale).includes(normalized) ||
        option.label.toLocaleLowerCase(locale).includes(normalized) ||
        option.localizedLabel.toLocaleLowerCase(locale).includes(normalized) ||
        option.offset.toLocaleLowerCase(locale).includes(normalized)
    );
  }, [options, query, searchable, locale]);

  const showResults = searchable && isOpen && query.trim().length > 0;

  useEffect(() => {
    const clearPointerState = () => {
      pointerDownOnResultsRef.current = false;
    };

    window.addEventListener('pointerup', clearPointerState);
    window.addEventListener('pointercancel', clearPointerState);
    return () => {
      window.removeEventListener('pointerup', clearPointerState);
      window.removeEventListener('pointercancel', clearPointerState);
    };
  }, []);

  useEffect(() => {
    if (!showResults) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (inputRef.current?.contains(target) || resultsRef.current?.contains(target)) return;

      pointerDownOnResultsRef.current = false;
      setIsOpen(false);
      setActiveIndex(-1);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
  }, [showResults]);

  useLayoutEffect(() => {
    if (!showResults) return;

    const updatePosition = () => {
      const input = inputRef.current;
      if (!input) return;

      const rect = input.getBoundingClientRect();
      const edge = 12;
      const gap = 6;
      const availableBelow = Math.max(0, window.innerHeight - rect.bottom - gap - edge);
      const availableAbove = Math.max(0, rect.top - gap - edge);
      const opensAbove = availableBelow < 96 && availableAbove > availableBelow;
      const availableHeight = opensAbove ? availableAbove : availableBelow;
      const maxHeight = Math.max(44, Math.min(280, availableHeight));
      const width = Math.min(rect.width, window.innerWidth - edge * 2);

      setPopoverPosition({
        top: opensAbove ? Math.max(edge, rect.top - gap - maxHeight) : rect.bottom + gap,
        left: Math.max(edge, Math.min(rect.left, window.innerWidth - edge - width)),
        width,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showResults]);

  const popoverStyle: CSSProperties = {
    position: 'fixed',
    top: popoverPosition?.top ?? 0,
    left: popoverPosition?.left ?? 0,
    width: popoverPosition?.width ?? 0,
    maxHeight: popoverPosition?.maxHeight ?? 280,
    zIndex: 1001,
  };

  const findEnabledIndex = (start: number, direction: 1 | -1) => {
    for (let index = start; index >= 0 && index < filtered.length; index += direction) {
      const option = filtered[index];
      if (option && !addedTimezones.includes(option.tz)) return index;
    }

    return -1;
  };

  const selectOption = (option: TimezoneOption) => {
    pointerDownOnResultsRef.current = false;
    onChange(option.tz);
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && filtered.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => {
        const next = findEnabledIndex(index + 1, 1);
        return next < 0 ? index : next;
      });
      return;
    }

    if (event.key === 'ArrowUp' && filtered.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => {
        const start = index < 0 ? filtered.length - 1 : index - 1;
        const next = findEnabledIndex(start, -1);
        return next < 0 ? index : next;
      });
      return;
    }

    if (event.key === 'Enter' && showResults && activeIndex >= 0) {
      const option = filtered[activeIndex];
      if (option && !addedTimezones.includes(option.tz)) {
        event.preventDefault();
        selectOption(option);
      }
      return;
    }

    if (event.key === 'Escape' && query.trim()) {
      event.preventDefault();
      event.stopPropagation();
      pointerDownOnResultsRef.current = false;
      setQuery('');
      setActiveIndex(-1);
      setIsOpen(false);
    }
  };

  const searchControl = searchable ? (
    <div className="timezone-search-wrap">
      <input
        ref={inputRef}
        className="tool-input"
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setIsOpen(true);
        }}
        onKeyDown={handleSearchKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          if (pointerDownOnResultsRef.current) return;
          setIsOpen(false);
          setActiveIndex(-1);
        }}
        placeholder={t('zoneSearchTimezones')}
        aria-label={t('zoneSearchTimezones')}
        role="combobox"
        aria-expanded={showResults && filtered.length > 0}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={showResults && filtered.length > 0 ? listboxId : undefined}
        aria-activedescendant={
          showResults && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
      />
      {showResults && (
        <>
          {filtered.length > 0 ? (
            <ul
              ref={resultsRef}
              id={listboxId}
              className="timezone-search-results"
              role="listbox"
              style={popoverStyle}
              onPointerDown={() => {
                pointerDownOnResultsRef.current = true;
              }}
            >
              {filtered.map((option, index) => (
                <li
                  key={option.tz}
                  id={`${listboxId}-option-${index}`}
                  className={`timezone-search-option${activeIndex === index ? ' is-active' : ''}`}
                  aria-disabled={addedTimezones.includes(option.tz)}
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => {
                    if (!addedTimezones.includes(option.tz)) setActiveIndex(index);
                  }}
                  onClick={() => {
                    if (!addedTimezones.includes(option.tz)) selectOption(option);
                  }}
                >
                  <span className="timezone-search-result-label"><bdi dir="ltr">{option.label}</bdi> — {option.localizedLabel}</span>
                  <span className="timezone-search-result-offset">
                    {addedTimezones.includes(option.tz) ? t('zoneAdded') : option.offset}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="timezone-search-empty" role="status" style={popoverStyle}>
              {t('zoneNoMatchingTimezones', { query: query.trim() })}
            </div>
          )}
        </>
      )}
    </div>
  ) : (
    <Select
      className="tool-input timezone-select"
      value={value}
      options={[...(value ? [] : ['']), ...filtered.map((option) => option.tz)]}
      getOptionLabel={(tz) => {
        if (!tz) return selectPlaceholder;
        const option = filtered.find((candidate) => candidate.tz === tz) ?? options.find((candidate) => candidate.tz === tz);
        return option ? `${option.label} (${option.offset}) — ${option.localizedLabel}` : tz;
      }}
      onChange={onChange}
      aria-label={selectPlaceholder}
    />
  );

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {searchControl}
    </div>
  );
}
