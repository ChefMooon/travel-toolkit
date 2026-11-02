import { describe, expect, it } from 'vitest';
import { costTypePlacement, placeVertical, selectPlacement, timezonePlacement, type AnchorRect, type Viewport } from './placement';

const rect = (top: number, bottom: number, left: number, width: number): AnchorRect => ({ top, bottom, left, width });
const viewport = (width: number, height: number): Viewport => ({ width, height });

describe('selectPlacement', () => {
  it.each([
    ['opens below when it fits', rect(100, 130, 20, 200), viewport(1024, 768), 10,
      { position: 'fixed', left: 20, width: 200, zIndex: 1500, maxHeight: 240, top: 134 }],
    ['flips above using bottom and clamps left to the right edge', rect(150, 180, 250, 40), viewport(320, 240), 3,
      { position: 'fixed', left: 212, width: 100, zIndex: 1500, maxHeight: 116, bottom: 94 }],
    ['stays below when above has no more room, clamping left and height', rect(10, 40, 2, 50), viewport(300, 100), 2,
      { position: 'fixed', left: 8, width: 100, zIndex: 1500, maxHeight: 48, top: 44 }],
    ['caps the width to the viewport minus margins', rect(100, 130, 0, 500), viewport(200, 800), 1,
      { position: 'fixed', left: 8, width: 184, zIndex: 1500, maxHeight: 44, top: 134 }],
  ])('%s', (_name, anchor, view, count, expected) => {
    expect(selectPlacement(anchor, view, count)).toEqual(expected);
  });
});

describe('timezonePlacement', () => {
  it.each([
    ['opens below when it fits', rect(100, 140, 30, 400), viewport(1024, 768),
      { top: 146, left: 30, width: 400, maxHeight: 280 }],
    ['flips above using a computed top and clamps left', rect(600, 700, 900, 300), viewport(1024, 768),
      { top: 314, left: 712, width: 300, maxHeight: 280 }],
    ['keeps the minimum height of 44 below', rect(40, 150, 0, 100), viewport(1024, 200),
      { top: 156, left: 12, width: 100, maxHeight: 44 }],
    ['clamps a flipped top to the edge', rect(50, 740, 20, 100), viewport(1024, 768),
      { top: 12, left: 20, width: 100, maxHeight: 44 }],
  ])('%s', (_name, anchor, view, expected) => {
    expect(timezonePlacement(anchor, view)).toEqual(expected);
  });
});

describe('costTypePlacement', () => {
  it.each([
    ['opens below with a fixed 150 width', rect(100, 130, 40, 300), viewport(1024, 768), false,
      { position: 'fixed', left: 40, width: 150, maxHeight: 626, overflowY: 'auto', top: 134, bottom: 'auto' }],
    ['uses the trigger width in form mode', rect(100, 130, 40, 300), viewport(1024, 768), true,
      { position: 'fixed', left: 40, width: 300, maxHeight: 626, overflowY: 'auto', top: 134, bottom: 'auto' }],
    ['keeps 150 as the minimum form width', rect(100, 130, 40, 80), viewport(1024, 768), true,
      { position: 'fixed', left: 40, width: 150, maxHeight: 626, overflowY: 'auto', top: 134, bottom: 'auto' }],
    ['flips above using bottom and clamps left', rect(600, 630, 1000, 30), viewport(1024, 768), false,
      { position: 'fixed', left: 866, width: 150, maxHeight: 588, overflowY: 'auto', top: 'auto', bottom: 172 }],
    ['compares unclamped space when both sides are negative', rect(5, 200, 0, 30), viewport(1024, 100), false,
      { position: 'fixed', left: 8, width: 150, maxHeight: 0, overflowY: 'auto', top: 'auto', bottom: 99 }],
  ])('%s', (_name, anchor, view, form, expected) => {
    expect(costTypePlacement(anchor, view, form)).toEqual(expected);
  });
});

describe('placeVertical', () => {
  it('reports whether it flipped', () => {
    const config = { edge: 8, gap: 4, clampSpace: true, flipThreshold: 100, minHeight: 0, maxHeight: 200,
      matchAnchorWidth: true, flippedAnchor: 'bottom' as const };
    expect(placeVertical(rect(400, 430, 10, 50), viewport(500, 480), config)).toEqual({ flipped: true, left: 10, width: 50, maxHeight: 200, bottom: 84 });
    expect(placeVertical(rect(10, 40, 10, 50), viewport(500, 480), config)).toEqual({ flipped: false, left: 10, width: 50, maxHeight: 200, top: 44 });
  });
});
