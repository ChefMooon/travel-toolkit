import type { CSSProperties } from 'react';

export interface AnchorRect {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface VerticalPlacementConfig {
  /** Distance kept between the popover and the viewport edges. */
  edge: number;
  /** Distance between the anchor and the popover. */
  gap: number;
  /** Clamp the space above/below to >= 0 before the flip comparison. */
  clampSpace: boolean;
  /** Flip above when the space below is smaller than this and above has more room. */
  flipThreshold: number;
  minHeight: number;
  maxHeight: number;
  /** Use the anchor width (raised to `minWidth`); otherwise use `minWidth` alone. */
  matchAnchorWidth: boolean;
  minWidth?: number;
  /**
   * How a flipped popover is anchored: `bottom` emits a CSS `bottom` offset;
   * `top` emits a `top` computed from the clamped max height.
   */
  flippedAnchor: 'bottom' | 'top';
}

export interface VerticalPlacement {
  flipped: boolean;
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

/** Pure placement math shared by anchored popovers that flip vertically. */
export function placeVertical(rect: AnchorRect, viewport: Viewport, config: VerticalPlacementConfig): VerticalPlacement {
  const { edge, gap } = config;
  const rawBelow = viewport.height - rect.bottom - gap - edge;
  const rawAbove = rect.top - gap - edge;
  const below = config.clampSpace ? Math.max(0, rawBelow) : rawBelow;
  const above = config.clampSpace ? Math.max(0, rawAbove) : rawAbove;
  const flipped = below < config.flipThreshold && above > below;
  const available = flipped ? above : below;
  const maxHeight = Math.max(config.minHeight, Math.min(config.maxHeight, available));
  const baseWidth = config.matchAnchorWidth ? rect.width : 0;
  const width = Math.min(config.minWidth === undefined ? baseWidth : Math.max(baseWidth, config.minWidth), viewport.width - edge * 2);
  const left = Math.max(edge, Math.min(rect.left, viewport.width - edge - width));
  if (!flipped) return { flipped, left, width, maxHeight, top: rect.bottom + gap };
  if (config.flippedAnchor === 'top') return { flipped, left, width, maxHeight, top: Math.max(edge, rect.top - gap - maxHeight) };
  return { flipped, left, width, maxHeight, bottom: viewport.height - rect.top + gap };
}

export const getViewport = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight });

/** Shared Select listbox: margin 8, gap 4, height capped by option count (max 240). */
export function selectPlacement(rect: AnchorRect, viewport: Viewport, optionCount: number): CSSProperties {
  const desired = Math.min(240, optionCount * 36 + 8);
  const placed = placeVertical(rect, viewport, {
    edge: 8, gap: 4, clampSpace: true, flipThreshold: desired, minHeight: 0, maxHeight: desired,
    matchAnchorWidth: true, minWidth: 100, flippedAnchor: 'bottom',
  });
  return { position: 'fixed', left: placed.left, width: placed.width, zIndex: 1500, maxHeight: placed.maxHeight,
    ...(placed.flipped ? { bottom: placed.bottom } : { top: placed.top }) };
}

export interface TimezonePlacement {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

/** Timezone search results: edge 12, gap 6, flips under 96px, height in [44, 280], flipped uses `top`. */
export function timezonePlacement(rect: AnchorRect, viewport: Viewport): TimezonePlacement {
  const placed = placeVertical(rect, viewport, {
    edge: 12, gap: 6, clampSpace: true, flipThreshold: 96, minHeight: 44, maxHeight: 280,
    matchAnchorWidth: true, flippedAnchor: 'top',
  });
  return { top: placed.top ?? 0, left: placed.left, width: placed.width, maxHeight: placed.maxHeight };
}

export interface PopoverSize {
  width: number;
  height: number;
}

export interface AnchoredPopoverPlacementOptions {
  /** Align to the trigger's left edge (its inline end in RTL) instead of its right edge. */
  rtl?: boolean;
  /** Preferred side; the popover flips when it does not fit there. */
  prefer?: 'down' | 'up';
  /** Distance kept from the viewport edges. */
  margin?: number;
  /** Distance between the trigger and the popover. */
  gap?: number;
}

export interface AnchoredPopoverPlacement {
  left: number;
  top: number;
  /** Cap for the popover height: the room on the chosen side, so it never covers the trigger. */
  maxHeight: number;
  side: 'down' | 'up';
}

/** Below this much room on the chosen side, a height cap would leave only a sliver to scroll in. */
const MIN_USABLE_SIDE_ROOM = 64;

/**
 * Fixed-position placement for menus and small dialogs: aligns to the trigger's inline-end edge,
 * opens on the preferred side, flips when it does not fit, and clamps into the viewport.
 */
export function anchoredPopoverPlacement(
  anchor: AnchorRect,
  viewport: Viewport,
  size: PopoverSize,
  { rtl = false, prefer = 'down', margin = 8, gap = 6 }: AnchoredPopoverPlacementOptions = {},
): AnchoredPopoverPlacement {
  const viewportMaxHeight = Math.max(0, viewport.height - margin * 2);
  const width = Math.min(size.width, Math.max(0, viewport.width - margin * 2));
  const height = Math.min(size.height, viewportMaxHeight);

  const anchorRight = anchor.left + anchor.width;
  const rawLeft = rtl ? anchor.left : anchorRight - width;
  const left = Math.max(margin, Math.min(rawLeft, viewport.width - margin - width));

  const below = anchor.bottom + gap;
  const above = anchor.top - gap - height;
  const fitsBelow = below + height <= viewport.height - margin;
  const fitsAbove = above >= margin;
  const roomBelow = viewport.height - margin - below;
  const roomAbove = anchor.top - gap - margin;
  const up = prefer === 'up'
    ? fitsAbove || (!fitsBelow && roomAbove > roomBelow)
    : !fitsBelow && (fitsAbove || roomAbove > roomBelow);

  // Cap the height to the room on the chosen side so the popover scrolls inside itself rather than
  // sliding over its trigger. When even that side is too cramped to be usable, overlapping is the
  // lesser evil: use the viewport height and let the clamp below keep it on screen.
  const sideRoom = up ? roomAbove : roomBelow;
  const maxHeight = sideRoom >= MIN_USABLE_SIDE_ROOM ? Math.min(viewportMaxHeight, sideRoom) : viewportMaxHeight;
  const placedHeight = Math.min(height, maxHeight);

  const rawTop = up ? anchor.top - gap - placedHeight : below;
  const top = Math.max(margin, Math.min(rawTop, viewport.height - margin - placedHeight));
  return { left, top, maxHeight, side: up ? 'up' : 'down' };
}

/** Cost type menu: edge 8, gap 4, flips under 270px (unclamped space), width 150 or trigger width in form mode. */
export function costTypePlacement(rect: AnchorRect, viewport: Viewport, form: boolean): CSSProperties {
  const placed = placeVertical(rect, viewport, {
    edge: 8, gap: 4, clampSpace: false, flipThreshold: 270, minHeight: 0, maxHeight: Infinity,
    matchAnchorWidth: form, minWidth: 150, flippedAnchor: 'bottom',
  });
  return { position: 'fixed', left: placed.left, width: placed.width, maxHeight: placed.maxHeight, overflowY: 'auto',
    ...(placed.flipped ? { top: 'auto', bottom: placed.bottom } : { top: placed.top, bottom: 'auto' }) };
}
