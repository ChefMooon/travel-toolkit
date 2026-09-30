/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useTripStore } from '@/store/tripStore';

vi.mock('@/store/tripStore', () => ({
  useTripStore: vi.fn(),
}));

vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('@/components/GridPanel', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <div data-testid="grid-panel-state">
      {open ? 'open' : 'closed'}
      {open && (
        <>
          <a
            href="/trip"
            onClick={(event) => {
              event.preventDefault();
              onClose();
            }}
          >
            Navigate to tool
          </a>
          <div
            aria-hidden="true"
            data-testid="grid-panel-backdrop"
            onClick={onClose}
          />
        </>
      )}
    </div>
  ),
}));

const mockState = {
  theme: 'light' as 'light' | 'dark',
  setTheme: vi.fn(),
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.theme = 'light';

    (useTripStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof mockState) => unknown) => selector(mockState)
    );
  });

  it('toggles theme from light to dark', () => {
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'Toggle theme' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Switch to dark theme');
    expect(trigger).toHaveAccessibleName('Toggle theme');

    fireEvent.click(trigger);

    expect(mockState.setTheme).toHaveBeenCalledWith('dark');
  });

  it('describes the theme action from its current state without changing its accessible name', () => {
    mockState.theme = 'dark';
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'Toggle theme' });
    fireEvent.focus(trigger);

    expect(screen.getByRole('tooltip')).toHaveTextContent('Switch to light theme');
    expect(trigger).toHaveAccessibleName('Toggle theme');

    fireEvent.click(trigger);
    expect(mockState.setTheme).toHaveBeenCalledWith('light');
  });

  it('keeps both actions available on the same touch tap that opens their tooltips', () => {
    render(<Navbar />);

    const gridTrigger = screen.getByRole('button', { name: 'Open tool navigation' });
    fireEvent.pointerDown(gridTrigger, { pointerType: 'touch' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Open tool navigation');
    fireEvent.click(gridTrigger);
    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('open');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    const themeTrigger = screen.getByRole('button', { name: 'Toggle theme' });
    fireEvent.pointerDown(themeTrigger, { pointerType: 'touch' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Switch to dark theme');
    fireEvent.click(themeTrigger);
    expect(mockState.setTheme).toHaveBeenCalledWith('dark');
  });

  it('toggles grid panel open state from trigger', () => {
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'Open tool navigation' });
    const icon = trigger.querySelector('svg');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('focusable', 'false');
    expect(icon).not.toHaveAttribute('tabindex');
    expect(trigger.querySelector('img')).not.toBeInTheDocument();

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Open tool navigation');
    expect(trigger).toHaveAccessibleName('Open tool navigation');
    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('closed');

    fireEvent.click(trigger);

    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('open');
    const closeTrigger = screen.getByRole('button', { name: 'Close tool navigation' });
    expect(closeTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.click(closeTrigger);

    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('closed');
    expect(screen.getByRole('button', { name: 'Open tool navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent('Open tool navigation');
  });

  it.each([
    ['navigation', 'link'],
    ['outside dismissal', 'backdrop'],
  ])('does not reopen its tooltip after closing through %s', (_closeReason, closeAction) => {
    render(<Navbar />);

    const trigger = screen.getByRole('button', { name: 'Open tool navigation' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    fireEvent.click(trigger);
    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('open');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });

    const closeTarget = closeAction === 'link'
      ? screen.getByRole('link', { name: 'Navigate to tool' })
      : screen.getByTestId('grid-panel-backdrop');
    if (closeAction === 'link') fireEvent.focus(closeTarget);
    fireEvent.click(closeTarget);

    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('closed');
    expect(trigger).not.toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
