import { useState } from 'react';
import { FORECAST_DESTINATIONS } from './forecastData';
import { useForecast } from './useForecast';

export default function ForecastTool() {
  const [destination, setDestination] = useState<string>(FORECAST_DESTINATIONS[0] ?? 'Barcelona');
  const query = useForecast(destination);

  return (
    <section className="tool-page" aria-label="Destination forecast">
      <h1>Destination Forecast</h1>

      <div className="card">
        <div className="card-header">
          <p className="card-title">Destination</p>
        </div>
        <div className="card-body tool-controls">
          <label className="tool-field">
            <span className="tool-label">City</span>
            <select
              className="tool-input"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              {FORECAST_DESTINATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {query.isPending ? <p className="tool-status">Loading forecast...</p> : null}
      {query.isError ? <p className="tool-status tool-status-error">Unable to load forecast right now.</p> : null}
      {query.data === null ? <p className="tool-status">No forecast available for this destination.</p> : null}

      {query.data ? (
        <div className="card">
          <div className="card-header">
            <p className="card-title">Upcoming Conditions</p>
            <p className="tool-meta">{query.data.destination}</p>
          </div>
          <div className="card-body tool-results">
            <ul className="tool-list">
              {query.data.days.map((day) => (
                <li key={day.dateLabel}>
                  <strong>{day.dateLabel}</strong>: {day.condition}, {day.lowC}
                  {' '}deg C to {day.highC} deg C
                </li>
              ))}
            </ul>
            <p>{query.data.packNote}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
