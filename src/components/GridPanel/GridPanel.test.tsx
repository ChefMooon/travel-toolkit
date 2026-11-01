/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GridPanel from '@/components/GridPanel';

const mockPathname = vi.hoisted(() => ({ value: '/trip' }));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: Omit<React.ComponentProps<'a'>, 'children'> & {
    to: string;
    children: React.ReactNode | ((state: { isActive: boolean }) => React.ReactNode);
  }) => {
    const isActive = to === mockPathname.value;
    return (
      <a href={to} aria-current={isActive ? 'page' : undefined} {...props}>
        {typeof children === 'function' ? children({ isActive }) : children}
      </a>
    );
  },
}));

describe('GridPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.value = '/trip';
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
    expect(screen.getByRole('link', { name: 'Travel Countdown' })).toHaveAttribute('href', '/countdown');
    expect(container.querySelectorAll('ul.grid-panel-list > li > a[data-tool]')).toHaveLength(6);
    expect(container.querySelectorAll('a > .stamp-wrap[aria-hidden="true"] .stamp-inner > svg')).toHaveLength(6);
  });

  it('marks only the active tool with aria-current and an aria-hidden "Here" label', () => {
    mockPathname.value = '/currency';
    const triggerRef = { current: document.createElement('button') };
    const { container } = render(<GridPanel open={true} onClose={vi.fn()} triggerRef={triggerRef} />);

    const active = screen.getByRole('link', { name: 'Currency Converter' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).toHaveAttribute('data-tool', 'currency');
    expect(screen.getByRole('link', { name: 'Trip Cost' })).not.toHaveAttribute('aria-current');

    const here = screen.getByText('Here');
    expect(here).toHaveAttribute('aria-hidden', 'true');
    expect(active).toContainElement(here);
    expect(container.querySelectorAll('.grid-panel-here')).toHaveLength(1);
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
