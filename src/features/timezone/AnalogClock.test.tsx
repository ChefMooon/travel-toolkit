/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AnalogClock from '@/features/timezone/AnalogClock';

describe('AnalogClock', () => {
  it('FE-TZ-002 renders SVG with hour and minute hands at correct rotation degrees', () => {
    const { container } = render(
      <AnalogClock hourDeg={90} minuteDeg={180} secondDeg={270} />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');

    const lines = container.querySelectorAll('line');

    // Hour hand: stroke="var(--text)" + stroke-width="4" (unique combination)
    const hourHand = Array.from(lines).find(
      (l) =>
        l.getAttribute('stroke') === 'var(--text)' && l.getAttribute('stroke-width') === '4',
    );
    expect(hourHand).toBeDefined();

    // Minute hand: stroke="var(--text)" + stroke-width="2.5"
    // Tick marks use stroke="var(--border-2)", so this combination is unique to the minute hand
    const minuteHand = Array.from(lines).find(
      (l) =>
        l.getAttribute('stroke') === 'var(--text)' && l.getAttribute('stroke-width') === '2.5',
    );
    expect(minuteHand).toBeDefined();

    // Second hand: stroke="var(--accent)"
    const secondHand = Array.from(lines).find((l) => l.getAttribute('stroke') === 'var(--accent)');
    expect(secondHand).toBeDefined();
  });
});
