import type { CSSProperties } from 'react';
import { ARC_PATH, LINE_PATH, arcAngle, arcPoint, stopPoints } from './flightPath';

export interface FlightLineEndpoint {
  code: string;
  caption?: string;
}

export interface FlightLineProps {
  start: FlightLineEndpoint;
  end: FlightLineEndpoint;
  variant: 'route' | 'conversion';
  /** Intermediate stop count (route variant only). */
  stops?: number;
  /** Caller-localized text such as "+2 stops"; carries the real count even when dots are capped. */
  moreStopsLabel?: string;
  /** Visually hidden description for assistive tech. */
  srLabel: string;
  className?: string;
}

const MAX_DOTS = 5;

function Label({ endpoint }: { endpoint: FlightLineEndpoint }) {
  return (
    <span className="flight-line-label">
      <span className="flight-line-code" title={endpoint.code}>{endpoint.code}</span>
      {endpoint.caption && (
        <small className="flight-line-caption" title={endpoint.caption}>{endpoint.caption}</small>
      )}
    </span>
  );
}

// Future trip stops feed this: start/end are the first and last stop, `stops` is the intermediate count.
// Until trips have stops, cards pass a currency-conversion fallback (e.g. CAD -> EUR).
export default function FlightLine({
  start,
  end,
  variant,
  stops,
  moreStopsLabel,
  srLabel,
  className,
}: FlightLineProps) {
  const isRoute = variant === 'route';
  const stopCount = isRoute ? Math.max(0, stops ?? 0) : 0;
  const dots = isRoute ? stopPoints(stopCount, MAX_DOTS) : [];
  const mid = arcPoint(0.5);
  const planeStyle = {
    '--x': `${mid.x}%`,
    '--y': `${mid.y}px`,
    '--a': `${arcAngle(0.5)}deg`,
  } as CSSProperties;

  return (
    <div className={['flight-line', `flight-line--${variant}`, className].filter(Boolean).join(' ')}>
      <span className="flight-line-sr">{srLabel}</span>
      <Label endpoint={start} />
      <span className="flight-line-arc" aria-hidden="true">
        <svg className="flight-line-svg" viewBox="0 0 100 26" preserveAspectRatio="none" focusable="false">
          <path d={isRoute ? ARC_PATH : LINE_PATH} />
        </svg>
        {isRoute ? (
          <svg className="flight-line-plane" style={planeStyle} viewBox="0 0 24 24" focusable="false">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
          </svg>
        ) : (
          <svg className="flight-line-arrow" viewBox="0 0 10 10" focusable="false">
            <path d="M2 1.5 L7.5 5 L2 8.5" />
          </svg>
        )}
        {dots.map((p, i) => (
          <span
            key={i}
            className="flight-line-stop"
            aria-hidden="true"
            style={{ '--x': `${p.x}%`, '--y': `${p.y}px` } as CSSProperties}
          />
        ))}
        {isRoute && stopCount > 0 && moreStopsLabel && (
          <span className="flight-line-more">{moreStopsLabel}</span>
        )}
      </span>
      <Label endpoint={end} />
    </div>
  );
}
