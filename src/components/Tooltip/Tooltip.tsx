import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type TooltipPlacement = 'top' | 'bottom' | 'auto';

export interface TooltipProps {
  /** Concise, non-interactive supplemental text. */
  content: string;
  /** A single interactive or focusable trigger element. */
  children: React.ReactElement;
  /** Preferred position; the tooltip flips when there is not enough room. */
  placement?: TooltipPlacement;
}

type TriggerProps = React.HTMLAttributes<HTMLElement> & {
  ref?: React.Ref<HTMLElement>;
};

interface TooltipPosition {
  top: number;
  left: number;
  side: Exclude<TooltipPlacement, 'auto'>;
}

const VIEWPORT_GUTTER = 8;
const TOOLTIP_GAP = 6;
const ESTIMATED_TOOLTIP_HEIGHT = 40;
const ESTIMATED_TOOLTIP_WIDTH = 256;

export default function Tooltip({
  content,
  children,
  placement = 'auto',
}: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const pointerInteraction = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touchOpened, setTouchOpened] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const visible = (hovered || focused || touchOpened) && content.length > 0;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const width = Math.min(
      tooltipRect?.width || ESTIMATED_TOOLTIP_WIDTH,
      Math.max(0, viewportWidth - VIEWPORT_GUTTER * 2),
    );
    const height = tooltipRect?.height || ESTIMATED_TOOLTIP_HEIGHT;
    const topSpace = rect.top;
    const bottomSpace = viewportHeight - rect.bottom;
    const fitsTop = topSpace >= height + TOOLTIP_GAP;
    const fitsBottom = bottomSpace >= height + TOOLTIP_GAP;

    let side: Exclude<TooltipPlacement, 'auto'>;
    if (placement === 'top') {
      side = fitsTop || !fitsBottom ? 'top' : 'bottom';
    } else if (placement === 'bottom') {
      side = fitsBottom || !fitsTop ? 'bottom' : 'top';
    } else if (fitsTop || fitsBottom) {
      side = fitsTop ? 'top' : 'bottom';
    } else {
      side = topSpace >= bottomSpace ? 'top' : 'bottom';
    }

    const center = rect.left + rect.width / 2;
    const halfWidth = width / 2;
    const left = Math.min(
      Math.max(center, VIEWPORT_GUTTER + halfWidth),
      Math.max(VIEWPORT_GUTTER + halfWidth, viewportWidth - VIEWPORT_GUTTER - halfWidth),
    );
    setPosition({
      top: side === 'top' ? rect.top : rect.bottom,
      left,
      side,
    });
  }, [placement]);

  useLayoutEffect(() => {
    if (!visible) {
      setPosition(null);
      return;
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    document.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('scroll', updatePosition, true);
    };
  }, [content, visible, updatePosition]);

  useEffect(() => {
    if (!visible) return;

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setHovered(false);
      setFocused(false);
      setTouchOpened(false);
    };
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (triggerRef.current?.contains(event.target as Node)) return;
      setHovered(false);
      setFocused(false);
      setTouchOpened(false);
    };

    document.addEventListener('keydown', dismissOnEscape);
    document.addEventListener('pointerdown', dismissOnOutsidePointer, true);
    return () => {
      document.removeEventListener('keydown', dismissOnEscape);
      document.removeEventListener('pointerdown', dismissOnOutsidePointer, true);
    };
  }, [visible]);

  const trigger = children as React.ReactElement<TriggerProps>;
  const existingDescription = trigger.props['aria-describedby'];
  const describedBy = [existingDescription, id].filter(Boolean).join(' ');
  const childRef = trigger.props.ref;
  const clonedTrigger = cloneElement(trigger, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef) childRef.current = node;
    },
    'aria-describedby': describedBy,
    title: undefined,
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      trigger.props.onPointerEnter?.(event);
      if (event.pointerType !== 'touch') setHovered(true);
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      trigger.props.onPointerLeave?.(event);
      if (event.pointerType !== 'touch') setHovered(false);
    },
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      trigger.props.onPointerDown?.(event);
      pointerInteraction.current = true;
      setFocused(false);
      if (event.pointerType === 'touch') setTouchOpened(true);
    },
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
      trigger.props.onPointerUp?.(event);
      pointerInteraction.current = false;
    },
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => {
      trigger.props.onPointerCancel?.(event);
      pointerInteraction.current = false;
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      trigger.props.onFocus?.(event);
      if (!pointerInteraction.current) setFocused(true);
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      trigger.props.onBlur?.(event);
      setFocused(false);
    },
  } as Partial<TriggerProps>);

  return (
    <>
      {clonedTrigger}
      {visible && createPortal(
        <div
          ref={tooltipRef}
          id={id}
          className="themed-tooltip"
          role="tooltip"
          data-placement={position?.side}
          style={{
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
