import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { usePresence } from '@/lib/motion';
import { isInsideOwnedPortal } from './dismiss';
import { nextActiveIndex } from './listNavigation';
import { anchoredPopoverPlacement, getViewport, type AnchoredPopoverPlacement } from './placement';
import { usePopoverPosition } from './usePopoverPosition';

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not(:disabled):not([aria-disabled="true"])';
const FOCUSABLE_SELECTOR =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export interface AnchoredPopoverProps {
  open: boolean;
  onClose: () => void;
  /** The trigger: the popover aligns to it and focus returns to it on close. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Scroller holding the trigger; the popover closes once the trigger scrolls out of its view. */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /** `menu`: roving focus over `[role="menuitem"]` children. `dialog`: a small non-modal form. */
  role: 'menu' | 'dialog';
  id?: string;
  prefer?: 'down' | 'up';
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Pauses outside-press and focus-leave dismissal, e.g. while a nested modal opened from here is up. */
  suspendDismiss?: boolean;
  initialFocus?: (popover: HTMLElement) => HTMLElement | null;
  children: ReactNode;
}

/**
 * Popover placed with `position: fixed` from its trigger's rect. Render it outside any scroll
 * container (e.g. in a layer that is a direct child of the dialog) so it is never clipped, and make
 * sure no ancestor has a transform, filter or containment, which would re-anchor fixed positioning.
 * Escape closes only the popover (it marks the event handled so the surrounding modal stays open).
 */
export default function AnchoredPopover({
  open,
  onClose,
  anchorRef,
  scrollContainerRef,
  role,
  id,
  prefer = 'down',
  className,
  suspendDismiss = false,
  initialFocus,
  children,
  ...aria
}: AnchoredPopoverProps) {
  const { mounted, state } = usePresence(open, { exitMs: 160 });
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const initialFocusRef = useRef(initialFocus);
  const suspendRef = useRef(suspendDismiss);
  const wasOpenRef = useRef(false);
  const [sizeTick, setSizeTick] = useState(0);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    initialFocusRef.current = initialFocus;
    suspendRef.current = suspendDismiss;
  });

  const placement = usePopoverPosition<AnchoredPopoverPlacement | null>({
    open,
    initial: null,
    deps: [sizeTick, prefer],
    compute: () => {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor || !popover) return null;
      const rtl = getComputedStyle(anchor).direction === 'rtl';
      // Natural height (content plus borders), not the box capped by the previous max height.
      const naturalHeight = popover.scrollHeight + popover.offsetHeight - popover.clientHeight;
      return anchoredPopoverPlacement(
        anchor.getBoundingClientRect(),
        getViewport(),
        { width: popover.offsetWidth, height: Math.max(popover.offsetHeight, naturalHeight) },
        { rtl, prefer },
      );
    },
  });

  // Re-place when the content changes size (e.g. a disclosure inside opens).
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!open || !popover || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setSizeTick((tick) => tick + 1));
    observer.observe(popover);
    return () => observer.disconnect();
  }, [open]);

  // Move focus in on open; on close, hand it back to the trigger unless it already moved elsewhere.
  useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    const popover = popoverRef.current;
    if (open && !wasOpen && popover) {
      const target =
        initialFocusRef.current?.(popover) ??
        popover.querySelector<HTMLElement>(role === 'menu' ? MENU_ITEM_SELECTOR : FOCUSABLE_SELECTOR) ??
        popover;
      target.focus({ preventScroll: true });
      return;
    }
    if (!open && wasOpen) {
      const active = document.activeElement;
      if (!active || active === document.body || (popover?.contains(active) ?? false)) {
        anchorRef.current?.focus({ preventScroll: true });
      }
    }
  }, [open, role, anchorRef]);

  // Escape on the trigger itself (e.g. after re-focusing it) also closes only the popover.
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!open || !anchor) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onCloseRef.current();
    };
    anchor.addEventListener('keydown', onKeyDown);
    return () => anchor.removeEventListener('keydown', onKeyDown);
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (suspendRef.current) return;
      const target = event.target instanceof Node ? event.target : null;
      const popover = popoverRef.current;
      if (!target || popover?.contains(target) || anchorRef.current?.contains(target)) return;
      // Nested Select listboxes are portalled to <body>; they still belong to this popover.
      if (isInsideOwnedPortal(target, popover)) return;
      onCloseRef.current();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, anchorRef]);

  useEffect(() => {
    const scroller = scrollContainerRef?.current;
    const anchor = anchorRef.current;
    if (!open || !scroller || !anchor || !scroller.contains(anchor)) return;
    const onScroll = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      if (anchorRect.bottom <= scrollerRect.top || anchorRect.top >= scrollerRect.bottom) onCloseRef.current();
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [open, anchorRef, scrollContainerRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      onClose();
      return;
    }
    if (role !== 'menu') return;
    if (event.key === 'Tab') {
      onClose();
      return;
    }
    const popover = popoverRef.current;
    if (!popover) return;
    const items = Array.from(popover.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
    const current = items.indexOf(document.activeElement as HTMLElement);
    // With nothing focused yet, ArrowUp lands on the last item and ArrowDown on the first.
    const from = current >= 0 ? current : event.key === 'ArrowUp' ? 0 : -1;
    const next = nextActiveIndex(event.key, { current: from, count: items.length, wrap: true, homeEnd: true });
    if (next === undefined) return;
    event.preventDefault();
    items[next]?.focus();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (suspendRef.current) return;
    const next = event.relatedTarget;
    // No related target: the press handler (or the window losing focus) decides instead.
    if (!(next instanceof Node)) return;
    const popover = popoverRef.current;
    if (popover?.contains(next) || anchorRef.current?.contains(next) || isInsideOwnedPortal(next, popover)) return;
    onClose();
  };

  if (!mounted) return null;

  const style = placement
    ? ({
        '--popover-left': `${placement.left}px`,
        '--popover-top': `${placement.top}px`,
        '--popover-max-height': `${placement.maxHeight}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      ref={popoverRef}
      id={id}
      role={role}
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby']}
      tabIndex={-1}
      className={className ? `anchored-popover ${className}` : 'anchored-popover'}
      style={style}
      data-state={state}
      data-side={placement?.side ?? prefer}
      data-placed={placement ? 'true' : 'false'}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      {children}
    </div>
  );
}
