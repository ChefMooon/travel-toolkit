/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GridPanel from '@/components/GridPanel';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: React.ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

describe('GridPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const triggerRef = { current: document.createElement('button') };
    const { container } = render(<GridPanel open={false} onClose={vi.fn()} triggerRef={triggerRef} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders tool entries when open', () => {
    const triggerRef = { current: document.createElement('button') };
    const { container } = render(
      <GridPanel open={true} onClose={vi.fn()} triggerRef={triggerRef} />,
    );

    expect(screen.getByRole('dialog', { name: 'Tool navigation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close tool navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trip Cost' })).toHaveAttribute('href', '/trip');
    expect(screen.getByRole('link', { name: 'Currency Converter' })).toHaveAttribute('href', '/currency');
    expect(screen.getByRole('link', { name: 'Timezone Tracker' })).toHaveAttribute('href', '/timezone');
    expect(screen.getByRole('link', { name: 'Unit Converter' })).toHaveAttribute('href', '/units');
    expect(screen.getByRole('link', { name: 'Destination Forecast' })).toHaveAttribute('href', '/forecast');
    expect(
      container.querySelectorAll(
        '.tool-launcher-icon[aria-hidden="true"] > svg[focusable="false"]',
      ),
    ).toHaveLength(5);
    expect(
      Array.from(container.querySelectorAll('.tool-launcher-icon svg')).every(
        (icon) => icon.getAttribute('stroke-width') === '2',
      ),
    ).toBe(true);
  });

  it('closes when selecting a tool link', () => {
    const onClose = vi.fn();
    const triggerRef = { current: document.createElement('button') };
    render(<GridPanel open={true} onClose={onClose} triggerRef={triggerRef} />);

    const link = screen.getByRole('link', { name: 'Trip Cost' });
    // The router is mocked as an anchor; jsdom cannot perform document navigation.
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    fireEvent.click(link);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
