/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';

function setViewport(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });

  window.dispatchEvent(new Event('resize'));
}

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn((selector: (state: { theme: 'light' | 'dark' }) => unknown) =>
    selector({ theme: 'light' })
  ),
}));

vi.mock('@/components/Topbar', () => ({
  default: () => <div data-testid="topbar">Topbar</div>,
}));

vi.mock('@/components/GroupSetup', () => ({
  default: () => <section data-testid="party-content"><h2 id="party-heading">Travelling Party</h2></section>,
}));

vi.mock('@/components/CostLedger', () => ({
  default: () => <section data-testid="costs-content"><h2 id="cost-ledger-heading">Cost Ledger</h2></section>,
}));

vi.mock('@/components/CostSummary', () => ({
  default: () => <section data-testid="summary-content"><h2 id="cost-summary-heading">Cost Summary</h2></section>,
}));

describe('Responsive behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setViewport(390);
  });

  it('FE-RSP-001 updates mobile tab state when mobile nav buttons are used', () => {
    const { container } = render(<App />);

    const main = container.querySelector('main.main');
    expect(main).toHaveAttribute('data-mobile-tab', 'costs');

    fireEvent.click(screen.getByRole('tab', { name: 'Party' }));
    expect(main).toHaveAttribute('data-mobile-tab', 'party');

    fireEvent.click(screen.getByRole('tab', { name: 'Summary' }));
    expect(main).toHaveAttribute('data-mobile-tab', 'summary');
    expect(screen.getByRole('tabpanel', { name: 'Summary' })).toHaveAttribute('id', 'trip-panel-summary');
    expect(screen.getByRole('heading', { name: 'Trip Cost', level: 1 })).toBeInTheDocument();
  });

  it('FE-RSP-002 sets mobile viewport state and keeps mobile nav available', () => {
    setViewport(390);
    const { container } = render(<App />);

    const main = container.querySelector('main.main');
    expect(main).toHaveAttribute('data-viewport', 'mobile');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('FE-RSP-003 sets tablet viewport state and keeps mobile nav available', () => {
    setViewport(600);
    const { container } = render(<App />);

    const main = container.querySelector('main.main');
    expect(main).toHaveAttribute('data-viewport', 'tablet');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('FE-RSP-004 sets desktop viewport state and removes mobile nav', () => {
    setViewport(1280);
    const { container } = render(<App />);

    const main = container.querySelector('main.main');
    expect(main).toHaveAttribute('data-viewport', 'desktop');
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cost Ledger' })).toBeInTheDocument();
  });
});
