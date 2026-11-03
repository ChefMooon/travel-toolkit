/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModalShell } from '@/components/Modal';
import { AnchoredPopover } from '@/components/Popover';

function MenuHarness({ onModalClose = () => {}, withScroller = false }: { onModalClose?: () => void; withScroller?: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trigger = (
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      Actions
    </button>
  );
  return (
    <ModalShell onClose={onModalClose} labelledBy="harness-title">
      <h2 id="harness-title">Harness</h2>
      {withScroller ? <div ref={scrollerRef} data-testid="scroller">{trigger}</div> : trigger}
      <button type="button">Elsewhere</button>
      <div className="layer">
        <AnchoredPopover
          open={open}
          onClose={() => setOpen(false)}
          anchorRef={triggerRef}
          scrollContainerRef={withScroller ? scrollerRef : undefined}
          role="menu"
          aria-label="Slot actions"
        >
          <button type="button" role="menuitem" onClick={() => setOpen(false)}>Rename</button>
          <button type="button" role="menuitem" disabled>Overwrite</button>
          <button type="button" role="menuitem">Export</button>
          <button type="button" role="menuitem">Clear</button>
        </AnchoredPopover>
      </div>
    </ModalShell>
  );
}

const item = (name: string) => screen.getByRole('menuitem', { name });

describe('AnchoredPopover', () => {
  it('focuses the first item on open and moves focus with the arrow, Home and End keys, skipping disabled items', () => {
    render(<MenuHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menu', { name: 'Slot actions' })).toBeInTheDocument();
    expect(item('Rename')).toHaveFocus();
    fireEvent.keyDown(item('Rename'), { key: 'ArrowDown' });
    expect(item('Export')).toHaveFocus();
    fireEvent.keyDown(item('Export'), { key: 'End' });
    expect(item('Clear')).toHaveFocus();
    fireEvent.keyDown(item('Clear'), { key: 'ArrowDown' });
    expect(item('Rename')).toHaveFocus();
    fireEvent.keyDown(item('Rename'), { key: 'ArrowUp' });
    expect(item('Clear')).toHaveFocus();
    fireEvent.keyDown(item('Clear'), { key: 'Home' });
    expect(item('Rename')).toHaveFocus();
  });

  it('closes only itself on Escape inside a modal and returns focus to the trigger', () => {
    const onModalClose = vi.fn();
    render(<MenuHarness onModalClose={onModalClose} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);

    fireEvent.keyDown(item('Rename'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(onModalClose).not.toHaveBeenCalled();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the trigger after an item closes it', () => {
    render(<MenuHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    fireEvent.click(item('Rename'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when focus leaves it and on a press outside, but not on a press on the trigger', () => {
    render(<MenuHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });

    fireEvent.blur(item('Rename'), { relatedTarget: elsewhere });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.pointerDown(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.pointerDown(elsewhere);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes when Tab moves focus out of the menu', () => {
    render(<MenuHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.keyDown(item('Rename'), { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes once its trigger scrolls out of the scroll container', () => {
    render(<MenuHarness withScroller />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    const scroller = screen.getByTestId('scroller');
    vi.spyOn(scroller, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 100, width: 300, height: 200 }));
    const triggerRect = vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 10, y: 150, width: 80, height: 30 }));
    fireEvent.click(trigger);

    fireEvent.scroll(scroller);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    triggerRect.mockReturnValue(DOMRect.fromRect({ x: 10, y: 40, width: 80, height: 30 }));
    fireEvent.scroll(scroller);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('is placed with CSS custom properties from the trigger rect', () => {
    render(<MenuHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 300, y: 100, width: 80, height: 30 }));
    fireEvent.click(trigger);

    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('data-placed', 'true');
    expect(menu).toHaveAttribute('data-side', 'down');
    // jsdom reports a 0x0 popover: right-aligned to the trigger's end edge, just below it.
    expect(menu.style.getPropertyValue('--popover-left')).toBe('380px');
    expect(menu.style.getPropertyValue('--popover-top')).toBe('136px');
  });
});
