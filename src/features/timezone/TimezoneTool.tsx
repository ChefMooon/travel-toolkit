import { useMemo, useState } from 'react';
import { useTimezoneMatches } from './useTimezoneMatches';

function toLocalDatetimeInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatCityTime(timezone: string, referenceDate: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: '2-digit',
    timeZone: timezone,
  }).format(referenceDate);
}

export default function TimezoneTool() {
  const [searchTerm, setSearchTerm] = useState('');
  const [referenceTime, setReferenceTime] = useState(() => toLocalDatetimeInputValue(new Date()));

  const referenceDate = useMemo(() => {
    const parsed = new Date(referenceTime);
    if (Number.isNaN(parsed.valueOf())) {
      return new Date();
    }
    return parsed;
  }, [referenceTime]);

  const query = useTimezoneMatches(searchTerm);

  return (
    <section className="tool-page" aria-label="Timezone converter">
      <h1>Timezone Converter</h1>

      <div className="card">
        <div className="card-header">
          <p className="card-title">Lookup</p>
        </div>
        <div className="card-body tool-controls">
          <label className="tool-field">
            <span className="tool-label">City or country</span>
            <input
              className="tool-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search destinations"
            />
          </label>

          <label className="tool-field">
            <span className="tool-label">Reference time</span>
            <input
              className="tool-input"
              type="datetime-local"
              value={referenceTime}
              onChange={(event) => setReferenceTime(event.target.value)}
            />
          </label>
        </div>
      </div>

      {query.isPending ? <p className="tool-status">Looking up destinations...</p> : null}
      {query.isError ? (
        <p className="tool-status tool-status-error">Unable to load timezone destinations right now.</p>
      ) : null}

      {query.data?.length === 0 ? <p className="tool-status">No destinations matched your search.</p> : null}

      {query.data?.length ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Destination Times</p>
          </div>
          <div className="card-body">
            <ul className="tool-list">
              {query.data.map((entry) => (
                <li key={entry.timezone}>
                  <strong>{entry.city}</strong>, {entry.country}: {formatCityTime(entry.timezone, referenceDate)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
