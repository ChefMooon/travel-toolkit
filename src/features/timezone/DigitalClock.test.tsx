/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DigitalClock from '@/features/timezone/DigitalClock';
import type { ClockDisplayData } from '@/features/timezone/timezoneFormat';
import type { TrackedZone } from '@/store/timezoneStore';
import { useSettingsStore } from '@/store/settingsStore';

const mockDisplayData: ClockDisplayData = {
  time24: '14:30:45',
  time12: '02:30:45 PM',
  timeCompact: '14:30',
  date: 'Mon, Mar 23',
  utcLabel: 'UTC+00:00',
  offsetMinutes: 0,
  hourDeg: 75,
  minuteDeg: 183,
  secondDeg: 270,
};

function makeZone(overrides: Partial<TrackedZone> = {}): TrackedZone {
  return {
    id: 'z1',
    tz: 'UTC',
    label: 'UTC',
    order: 0,
    displayMode: 'digital',
    detailLevel: 'compact',
    showUTC: false,
    showDate: false,
    showSeconds: false,
    ...overrides,
  };
}

describe('DigitalClock', () => {
  beforeEach(() => useSettingsStore.setState({ clockFormat: '12h' }));
  it('FE-TZ-003 compact detailLevel shows compact time in the selected clock format', () => {
    render(<DigitalClock displayData={mockDisplayData} zone={makeZone({ detailLevel: 'compact' })} />);

    expect(screen.getByText('02:30 PM')).toBeInTheDocument();
  });

  it('FE-TZ-004 detailed detailLevel with showSeconds shows full time12 including AM/PM', () => {
    render(
      <DigitalClock
        displayData={mockDisplayData}
        zone={makeZone({ detailLevel: 'detailed', showSeconds: true })}
      />,
    );

    expect(screen.getByText('02:30:45 PM')).toBeInTheDocument();
  });

  it('uses the global 24-hour setting while preserving compact and seconds preferences', () => {
    useSettingsStore.getState().setClockFormat('24h');
    render(<DigitalClock displayData={mockDisplayData} zone={makeZone({ detailLevel: 'detailed', showSeconds: true })} />);
    expect(screen.getByText('14:30:45')).toBeInTheDocument();
    expect(screen.queryByText(/AM|PM/)).not.toBeInTheDocument();
  });
});
