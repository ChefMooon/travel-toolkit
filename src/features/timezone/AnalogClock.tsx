import { useEffect, useRef, type CSSProperties } from 'react';

interface AnalogClockProps {
  hourDeg: number;
  minuteDeg: number;
  secondDeg: number;
}

function createHandStyle(deg: number): CSSProperties {
  return {
    transformOrigin: '50px 50px',
    transformBox: 'view-box',
    transform: `rotate(${deg}deg)`,
    transition: 'transform 0.2s',
  };
}

export default function AnalogClock({ hourDeg, minuteDeg, secondDeg }: AnalogClockProps) {
  const secondRef = useRef<SVGLineElement | null>(null);
  const previousSecond = useRef(secondDeg);

  useEffect(() => {
    const hand = secondRef.current;
    if (!hand) return;

    const wraps = previousSecond.current > 300 && secondDeg < 60;
    previousSecond.current = secondDeg;

    hand.style.transition = wraps ? 'none' : 'transform 0.2s';
    hand.style.transformOrigin = '50px 50px';
    hand.style.transformBox = 'view-box';
    hand.style.transform = `rotate(${secondDeg}deg)`;
  }, [secondDeg]);

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: '100%', maxWidth: 160, height: 'auto', display: 'block' }}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />

      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const isCardinal = i % 3 === 0;
        const inner = isCardinal ? 37 : 39;
        const outer = 43;

        return (
          <line
            key={i}
            x1={50 + inner * Math.cos(angle)}
            y1={50 + inner * Math.sin(angle)}
            x2={50 + outer * Math.cos(angle)}
            y2={50 + outer * Math.sin(angle)}
            stroke="var(--border-2)"
            strokeWidth={isCardinal ? 2.5 : 1.5}
            strokeLinecap="round"
          />
        );
      })}

      <line
        x1="50"
        y1="50"
        x2="50"
        y2="25"
        stroke="var(--text)"
        strokeWidth="4"
        strokeLinecap="round"
        style={createHandStyle(hourDeg)}
      />

      <line
        x1="50"
        y1="50"
        x2="50"
        y2="16"
        stroke="var(--text)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={createHandStyle(minuteDeg)}
      />

      <line
        ref={secondRef}
        x1="50"
        y1="54"
        x2="50"
        y2="12"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <circle cx="50" cy="50" r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="50" cy="50" r="2" fill="var(--accent)" />
    </svg>
  );
}
