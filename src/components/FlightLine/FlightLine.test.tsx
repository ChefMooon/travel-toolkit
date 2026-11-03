import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FlightLine from './FlightLine';

const base = {
  start: { code: 'YVR', caption: 'Vancouver' },
  end: { code: 'KIX', caption: 'Osaka' },
  srLabel: 'Vancouver to Osaka',
};

describe('FlightLine', () => {
  it.each([[0, 0], [1, 1], [7, 5]])('renders %i stops as %i dots', (stops, dots) => {
    const { container } = render(<FlightLine {...base} variant="route" stops={stops} moreStopsLabel={`+${stops} stops`} />);
    expect(container.querySelectorAll('.flight-line-stop')).toHaveLength(dots);
    expect(container.querySelector('.flight-line-plane')).not.toBeNull();
  });

  it('shows the caller label only when stops > 0', () => {
    const { rerender } = render(<FlightLine {...base} variant="route" stops={7} moreStopsLabel="+7 stops" />);
    expect(screen.getByText('+7 stops')).toBeInTheDocument();
    rerender(<FlightLine {...base} variant="route" stops={0} moreStopsLabel="+0 stops" />);
    expect(screen.queryByText('+0 stops')).toBeNull();
    rerender(<FlightLine {...base} variant="route" stops={2} />);
    expect(document.querySelector('.flight-line-more')).toBeNull();
  });

  it('conversion variant has an arrow, no plane and no dots', () => {
    const { container } = render(<FlightLine {...base} variant="conversion" stops={3} moreStopsLabel="+3 stops" />);
    expect(container.querySelector('.flight-line-arrow')).not.toBeNull();
    expect(container.querySelector('.flight-line-plane')).toBeNull();
    expect(container.querySelectorAll('.flight-line-stop')).toHaveLength(0);
    expect(container.querySelector('.flight-line-more')).toBeNull();
    expect(container.querySelector('path')).toHaveAttribute('d', 'M2 13 H98');
  });

  it('truncates long labels via classes and title', () => {
    const long = 'Extraordinarily long city name';
    const { container } = render(<FlightLine {...base} start={{ code: long, caption: long }} variant="route" />);
    const code = container.querySelector('.flight-line-code');
    expect(code).toHaveAttribute('title', long);
    expect(container.querySelector('.flight-line-caption')).toHaveAttribute('title', long);
    expect(container.querySelector('.flight-line-label')).toContainElement(code as HTMLElement);
  });

  it('hides graphics from assistive tech and exposes srLabel', () => {
    const { container } = render(<FlightLine {...base} variant="route" stops={2} />);
    expect(container.querySelector('.flight-line-arc')).toHaveAttribute('aria-hidden', 'true');
    container.querySelectorAll('.flight-line-stop').forEach((d) => expect(d).toHaveAttribute('aria-hidden', 'true'));
    expect(screen.getByText('Vancouver to Osaka')).toHaveClass('flight-line-sr');
  });

  it('keeps mirrorable graphics under the arc so :dir(rtl) rules apply', () => {
    const { container } = render(
      <div dir="rtl"><FlightLine {...base} variant="route" stops={1} /></div>,
    );
    expect(container.querySelector('[dir="rtl"] .flight-line-arc .flight-line-svg')).not.toBeNull();
    expect(container.querySelector('[dir="rtl"] .flight-line-arc .flight-line-plane')).not.toBeNull();
  });
});
