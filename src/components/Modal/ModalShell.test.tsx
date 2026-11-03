/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModalShell } from '@/components/Modal';

function Shell(props: Partial<React.ComponentProps<typeof ModalShell>>) {
  return (
    <ModalShell onClose={vi.fn()} labelledBy="shell-title" {...props}>
      <h2 id="shell-title">Shell title</h2>
      {props.children ?? (
        <>
          <button>First</button>
          <button>Middle</button>
          <button>Last</button>
        </>
      )}
    </ModalShell>
  );
}

describe('ModalShell', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  });

  it('portals the backdrop and dialog to document.body with dialog semantics', () => {
    const { container } = render(
      <Shell className="extra" overlayClassName="overlay-extra" id="shell-id" describedBy="desc" />
    );
    const backdrop = document.querySelector('.modal-bd');
    const dialog = screen.getByRole('dialog', { name: 'Shell title' });

    expect(backdrop?.parentElement).toBe(document.body);
    expect(container.querySelector('.modal-bd')).not.toBeInTheDocument();
    expect(backdrop).toHaveClass('modal-bd', 'overlay-extra');
    expect(dialog).toHaveClass('modal', 'extra');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby', 'desc');
    expect(dialog).toHaveAttribute('id', 'shell-id');
    expect(dialog).toHaveAttribute('tabindex', '-1');
  });

  it('closes on backdrop click but not on dialog content click', () => {
    const onClose = vi.fn();
    render(<Shell onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Middle' }));
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(document.querySelector('.modal-bd')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when a press starts inside the dialog and ends on the backdrop', () => {
    const onClose = vi.fn();
    render(<Shell onClose={onClose} />);
    const backdrop = document.querySelector('.modal-bd')!;

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Middle' }));
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets data-state and inert only when closing', () => {
    const { rerender } = render(<Shell />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-state');
    expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');

    rerender(<Shell state="open" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'open');
    expect(screen.getByRole('dialog')).not.toHaveAttribute('inert');

    rerender(<Shell state="closing" />);
    expect(document.querySelector('.modal-bd')).toHaveAttribute('data-state', 'closing');
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('data-state', 'closing');
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('inert');
  });

  it('closes on Escape without bubbling to a parent key handler', () => {
    const onClose = vi.fn();
    const parentKeyDown = vi.fn();
    render(
      <div onKeyDown={parentKeyDown}>
        <Shell onClose={onClose} />
      </div>
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'Middle' }), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(parentKeyDown).not.toHaveBeenCalled();
  });

  it('ignores an Escape already handled by a child', () => {
    const onClose = vi.fn();
    render(
      <Shell onClose={onClose}>
        <input aria-label="Search" onKeyDown={(e) => e.preventDefault()} />
      </Shell>
    );

    fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('wraps Tab focus in both directions and skips disabled buttons', () => {
    render(
      <Shell>
        <button>First</button>
        <button>Last</button>
        <button disabled>Disabled</button>
      </Shell>
    );
    const dialog = screen.getByRole('dialog');
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('focuses the first focusable element by default', () => {
    render(
      <Shell>
        <button disabled>Disabled</button>
        <button>Enabled</button>
      </Shell>
    );

    expect(screen.getByRole('button', { name: 'Enabled' })).toHaveFocus();
  });

  it('focuses the dialog when nothing inside is focusable', () => {
    render(<Shell><p>Text only</p></Shell>);

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it.each([false, true])('keeps focus on the dialog on Tab (shift: %s) when nothing inside is focusable', (shiftKey) => {
    render(<Shell><button disabled>Busy</button></Shell>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
    dialog.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(dialog).toHaveFocus();
  });

  it('uses initialFocus when provided', () => {
    render(<Shell initialFocus={(dialog) => dialog.querySelector('button:last-of-type')} />);

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('restores focus to the previously focused element on unmount', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = render(<Shell />);
    expect(trigger).not.toHaveFocus();
    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('restores focus to returnFocusRef when provided', () => {
    const trigger = document.createElement('button');
    const other = document.createElement('button');
    document.body.append(trigger, other);
    trigger.focus();
    const returnFocusRef = createRef<HTMLElement>();
    (returnFocusRef as { current: HTMLElement | null }).current = other;

    const { unmount } = render(<Shell returnFocusRef={returnFocusRef} />);
    unmount();

    expect(other).toHaveFocus();
    trigger.remove();
    other.remove();
  });

  it('locks background scroll and restores the previous overflow', () => {
    document.body.style.overflow = 'scroll';
    document.documentElement.style.overflow = 'auto';

    const { unmount } = render(<Shell />);
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.documentElement.style.overflow).toBe('auto');
  });

  it('does not lock scroll when lockScroll is false', () => {
    const { unmount } = render(<Shell lockScroll={false} />);
    expect(document.body.style.overflow).toBe('');
    unmount();
  });

  it('keeps scroll locked until the outermost of nested shells closes', () => {
    document.body.style.overflow = 'scroll';

    const outer = render(<Shell />);
    const inner = render(<Shell />);
    expect(document.body.style.overflow).toBe('hidden');

    inner.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    outer.unmount();
    expect(document.body.style.overflow).toBe('scroll');
    expect(document.documentElement.style.overflow).toBe('');
  });
});
