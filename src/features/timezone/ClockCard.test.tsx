/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import ClockCard from '@/features/timezone/ClockCard';
import type { TrackedZone } from '@/store/timezoneStore';

const mockNow = DateTime.fromObject(
  { year: 2026, month: 3, day: 23, hour: 12, minute: 0, second: 0 },
  { zone: 'UTC' },
);

function makeZone(overrides: Partial<TrackedZone> = {}): TrackedZone {
  return {
    id: 'z1',
    tz: 'UTC',
    label: 'UTC Time',
    order: 0,
    displayMode: 'digital',
    detailLevel: 'compact',
    showUTC: false,
    showDate: false,
    showSeconds: false,
    ...overrides,
  };
}

describe('ClockCard', () => {
  it('FE-TZ-008a displayMode=digital renders the card title and formatted time text', () => {
    render(<ClockCard zone={makeZone({ displayMode: 'digital' })} now={mockNow} />);

    expect(screen.getByText('UTC Time')).toBeInTheDocument();
    // UTC at 12:00 → compact time = '12:00'
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });

  it('FE-TZ-008b displayMode=analog renders an SVG clock face', () => {
    const { container } = render(
      <ClockCard zone={makeZone({ displayMode: 'analog' })} now={mockNow} />,
    );

    expect(screen.getByText('UTC Time')).toBeInTheDocument();
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });
});
