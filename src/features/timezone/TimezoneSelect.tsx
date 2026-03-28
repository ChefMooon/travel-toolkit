import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { buildTimezoneOptions, type TimezoneOption } from './timezones';

let cachedOptions: TimezoneOption[] | null = null;

function getAllOptions(): TimezoneOption[] {
  if (!cachedOptions) {
    cachedOptions = buildTimezoneOptions();
  }

  return cachedOptions;
}

interface TimezoneSelectProps {
  value: string;
  onChange: (tz: string) => void;
  placeholder?: string;
  searchable?: boolean;
  action?: ReactNode;
}

export default function TimezoneSelect({
  value,
  onChange,
  placeholder = 'Select timezone',
  searchable = true,
  action,
}: TimezoneSelectProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const allOptions = getAllOptions();

    if (!searchable) return allOptions;

    const normalized = query.trim().toLowerCase();
    if (!normalized) return allOptions;

    return allOptions.filter(
      (option) =>
        option.tz.toLowerCase().includes(normalized) ||
        option.label.toLowerCase().includes(normalized) ||
        option.offset.toLowerCase().includes(normalized)
    );
  }, [query]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {searchable && (
        <input
          className="tool-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search timezones"
          aria-label="Search timezones"
        />
      )}

      {action ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
          <select
            className="tool-input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={placeholder}
          >
            {!value && <option value="">{placeholder}</option>}
            {filtered.map((option) => (
              <option key={option.tz} value={option.tz}>
                {option.label} ({option.offset})
              </option>
            ))}
          </select>
          {action}
        </div>
      ) : (
        <select
          className="tool-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={placeholder}
        >
          {!value && <option value="">{placeholder}</option>}
          {filtered.map((option) => (
            <option key={option.tz} value={option.tz}>
              {option.label} ({option.offset})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
