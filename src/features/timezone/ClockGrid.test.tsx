/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import ClockGrid from '@/features/timezone/ClockGrid';
import type { TrackedZone } from '@/store/timezoneStore';

vi.mock('@/store/timezoneStore', () => ({
  useTimezoneStore: vi.fn(),
}));

import { useTimezoneStore } from '@/store/timezoneStore';

const mockZones: TrackedZone[] = [
  {
    id: 'z1',
    tz: 'America/New_York',
    label: 'New York',
    order: 0,
    displayMode: 'digital',
    detailLevel: 'compact',
    showUTC: false,
    showDate: false,
    showSeconds: false,
  },
  {
    id: 'z2',
    tz: 'Europe/London',
    label: 'London',
    order: 1,
    displayMode: 'digital',
    detailLevel: 'compact',
    showUTC: false,
    showDate: false,
    showSeconds: false,
  },
];

const mockNow = DateTime.fromObject(
  { year: 2026, month: 3, day: 23, hour: 12, minute: 0, second: 0 },
  { zone: 'UTC' },
);

describe('ClockGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FE-TZ-001 renders a ClockCard for each tracked zone', () => {
    (useTimezoneStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { trackedZones: TrackedZone[] }) => unknown) =>
        selector({ trackedZones: mockZones }),
    );

    render(<ClockGrid now={mockNow} />);

    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('renders empty state when no zones are tracked', () => {
    (useTimezoneStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: { trackedZones: TrackedZone[] }) => unknown) =>
        selector({ trackedZones: [] }),
    );

    render(<ClockGrid now={mockNow} />);

    expect(screen.getByText(/No timezones tracked yet/i)).toBeInTheDocument();
  });
});
