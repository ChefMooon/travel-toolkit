/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Tooltip from '@/components/Tooltip';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Tooltip', () => {
  it('shows a non-interactive description on pointer hover and hides it on leave', () => {
    render(
      <Tooltip content="More details">
        <button type="button" aria-label="Save">
          Save
        </button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Save' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('More details');
    expect(tooltip.querySelector('a, button, input, select, textarea')).toBeNull();
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on keyboard focus and dismisses with Escape', () => {
    render(
      <Tooltip content="Keyboard help">
        <button type="button">Help</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Help' });
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Keyboard help');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides after pointer click focus when the pointer leaves', () => {
    const onClick = vi.fn();
    render(
      <Tooltip content="Action information">
        <button type="button" onClick={onClick}>
          Continue
        </button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Continue' });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.pointerDown(trigger, { pointerType: 'mouse' });
    fireEvent.focus(trigger);
    fireEvent.pointerUp(trigger, { pointerType: 'mouse' });
    fireEvent.click(trigger);
    fireEvent.pointerLeave(trigger, { pointerType: 'mouse' });

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on touch without preventing the trigger action and closes on an outside tap', () => {
    const onClick = vi.fn();
    render(
      <>
        <Tooltip content="Action information">
          <button type="button" onClick={onClick}>
            Continue
          </button>
        </Tooltip>
        <button type="button">Outside</button>
      </>,
    );

    const trigger = screen.getByRole('button', { name: 'Continue' });
    fireEvent.pointerDown(trigger, { pointerType: 'touch' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Action information');

    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }), {
      pointerType: 'touch',
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('preserves the trigger name, existing description, and action while removing native title duplication', () => {
    const onClick = vi.fn();
    render(
      <Tooltip content="Supplemental description">
        <button
          type="button"
          aria-label="Named action"
          aria-describedby="existing-description"
          title="Duplicate browser hint"
          onClick={onClick}
        />
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Named action' });
    fireEvent.focus(trigger);
    const tooltip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute(
      'aria-describedby',
      `existing-description ${tooltip.id}`,
    );
    expect(trigger).not.toHaveAttribute('title');

    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each(['light', 'dark'] as const)('renders using the %s theme context', (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    render(
      <Tooltip content="Themed help">
        <button type="button">Theme control</button>
      </Tooltip>,
    );

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Theme control' }), {
      pointerType: 'mouse',
    });

    expect(document.documentElement).toHaveAttribute('data-theme', theme);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Themed help');
  });

  it('centers the tooltip using its rendered width when there is room around the trigger', () => {
    vi.stubGlobal('innerWidth', 320);
    vi.stubGlobal('innerHeight', 480);
    render(
      <Tooltip content="Measured help">
        <button type="button">Measured trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Measured trigger' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 80,
      top: 80,
      right: 120,
      bottom: 100,
      left: 100,
      width: 20,
      height: 20,
      toJSON: () => ({}),
    });
    const nativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains('themed-tooltip')) {
        return {
          x: 0,
          y: 0,
          top: 0,
          right: 120,
          bottom: 30,
          left: 0,
          width: 120,
          height: 30,
          toJSON: () => ({}),
        };
      }
      return nativeGetBoundingClientRect.call(this);
    });

    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

    expect(screen.getByRole('tooltip').style.left).toBe('110px');
  });

  it('positions the tooltip within viewport edges and flips when the preferred side has no room', () => {
    vi.stubGlobal('innerWidth', 320);
    vi.stubGlobal('innerHeight', 480);
    render(
      <Tooltip content="Edge help" placement="top">
        <button type="button">Edge trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Edge trigger' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 2,
      top: 2,
      right: 12,
      bottom: 22,
      left: 0,
      width: 12,
      height: 20,
      toJSON: () => ({}),
    });
    fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('data-placement', 'bottom');
    expect(tooltip.style.left).toBe('136px');

    vi.mocked(trigger.getBoundingClientRect).mockReturnValue({
      x: 308,
      y: 458,
      top: 458,
      right: 320,
      bottom: 478,
      left: 308,
      width: 12,
      height: 20,
      toJSON: () => ({}),
    });
    fireEvent.resize(window);
    expect(tooltip).toHaveAttribute('data-placement', 'top');
    expect(tooltip.style.left).toBe('184px');

    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
