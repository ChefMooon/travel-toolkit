/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/Navbar';
import { useSettingsStore } from '@/store/settingsStore';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, children, ...props }: React.ComponentProps<'a'> & { to: string }) => (
      <a href={to} {...props}>{children}</a>
    ),
  };
});

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

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ themePreference: 'light' });
  });

  it('exposes a synchronized accessible slider for all theme preferences', () => {
    render(<Navbar />);

    const selector = screen.getByRole('radiogroup', { name: 'Theme preference' });
    const systemRadio = screen.getByRole('radio', { name: 'System theme' });
    const lightRadio = screen.getByRole('radio', { name: 'Light theme' });
    const darkRadio = screen.getByRole('radio', { name: 'Dark theme' });

    expect(selector).toBeInTheDocument();
    expect(systemRadio).toHaveAttribute('tabindex', '-1');
    expect(lightRadio).toHaveAttribute('tabindex', '0');
    expect(darkRadio).toHaveAttribute('tabindex', '-1');
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'System theme',
      'Light theme',
      'Dark theme',
    ]);

    fireEvent.click(systemRadio);
    expect(useSettingsStore.getState().themePreference).toBe('system');
    expect(systemRadio).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(lightRadio);
    expect(useSettingsStore.getState().themePreference).toBe('light');
    fireEvent.click(darkRadio);
    expect(useSettingsStore.getState().themePreference).toBe('dark');
    expect(darkRadio).toHaveAttribute('aria-checked', 'true');
  });

  it('supports arrow and Home/End keyboard navigation within the theme slider', () => {
    render(<Navbar />);

    const systemRadio = screen.getByRole('radio', { name: 'System theme' });
    const lightRadio = screen.getByRole('radio', { name: 'Light theme' });
    const darkRadio = screen.getByRole('radio', { name: 'Dark theme' });

    act(() => lightRadio.focus());
    fireEvent.keyDown(lightRadio, { key: 'ArrowRight' });
    expect(darkRadio).toHaveFocus();
    expect(darkRadio).toHaveAttribute('aria-checked', 'true');
    expect(useSettingsStore.getState().themePreference).toBe('dark');

    fireEvent.keyDown(darkRadio, { key: 'ArrowRight' });
    expect(systemRadio).toHaveFocus();
    expect(systemRadio).toHaveAttribute('aria-checked', 'true');
    expect(useSettingsStore.getState().themePreference).toBe('system');

    fireEvent.keyDown(systemRadio, { key: 'End' });
    expect(darkRadio).toHaveFocus();
    expect(useSettingsStore.getState().themePreference).toBe('dark');

    fireEvent.keyDown(darkRadio, { key: 'Home' });
    expect(systemRadio).toHaveFocus();
    expect(useSettingsStore.getState().themePreference).toBe('system');
  });

  it('keeps both actions available on the same touch tap that opens their tooltips', () => {
    render(<Navbar />);

    const gridTrigger = screen.getByRole('button', { name: 'Open tool navigation' });
    fireEvent.pointerDown(gridTrigger, { pointerType: 'touch' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Open tool navigation');
    fireEvent.click(gridTrigger);
    expect(screen.getByTestId('grid-panel-state')).toHaveTextContent('open');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    const systemRadio = screen.getByRole('radio', { name: 'System theme' });
    fireEvent.pointerDown(systemRadio, { pointerType: 'touch' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Use system theme');
    fireEvent.click(screen.getByRole('radio', { name: 'Dark theme' }));
    expect(useSettingsStore.getState().themePreference).toBe('dark');
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
