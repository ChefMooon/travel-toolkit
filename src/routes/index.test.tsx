/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LandingPage from './index';

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (routeOptions: unknown) => routeOptions,
  Link: ({ to, children, ...props }: React.ComponentProps<'a'> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const expectedTools = [
  {
    label: 'Trip Cost',
    description: 'Calculate shared and split costs across trip groups.',
    route: '/trip',
  },
  {
    label: 'Currency Converter',
    description: 'Convert between currencies with live rates.',
    route: '/currency',
  },
  {
    label: 'Timezone Tracker',
    description: 'Save and track timezones for different locations.',
    route: '/timezone',
  },
  {
    label: 'Destination Forecast',
    description: 'Check weather and event forecasts before travel.',
    route: '/forecast',
  },
];

describe('landing route', () => {
  it('renders accessible tool links with decorative Lucide icons', () => {
    const { container } = render(<LandingPage />);

    for (const { label, description, route } of expectedTools) {
      const link = screen.getByRole('link', { name: new RegExp(label) });
      expect(link).toHaveAttribute('href', route);
      expect(link).toHaveTextContent(description);
    }

    expect(
      container.querySelectorAll(
        '.tool-launcher-icon[aria-hidden="true"] > svg[focusable="false"]',
      ),
    ).toHaveLength(expectedTools.length);
    expect(
      Array.from(container.querySelectorAll('.tool-launcher-icon svg')).every(
        (icon) => icon.getAttribute('stroke-width') === '2',
      ),
    ).toBe(true);
    expect(screen.getByRole('main')).toHaveAttribute('data-page-entrance');
  });
});
