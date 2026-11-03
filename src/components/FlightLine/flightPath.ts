export interface Point {
  x: number;
  y: number;
}

/** Arc geometry, in the 100x26 viewBox used by FlightLine. */
export const ARC_START: Point = { x: 2, y: 23 };
export const ARC_CONTROL: Point = { x: 50, y: -5 };
export const ARC_END: Point = { x: 98, y: 23 };
export const ARC_PATH = `M${ARC_START.x} ${ARC_START.y} Q${ARC_CONTROL.x} ${ARC_CONTROL.y} ${ARC_END.x} ${ARC_END.y}`;
export const LINE_PATH = 'M2 13 H98';

/** Point on a quadratic Bezier at t in [0, 1]. */
export function quadraticPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** Tangent direction in degrees (screen coordinates, 0 = +x, 90 = down) at t. */
export function quadraticTangentAngle(p0: Point, p1: Point, p2: Point, t: number): number {
  const u = 1 - t;
  const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

export function arcPoint(t: number): Point {
  return quadraticPoint(ARC_START, ARC_CONTROL, ARC_END, t);
}

export function arcAngle(t: number): number {
  return quadraticTangentAngle(ARC_START, ARC_CONTROL, ARC_END, t);
}

/** Evenly spaced stop positions (t = i / (shown + 1)), capped at maxDots. */
export function stopPoints(stops: number, maxDots = 5): Point[] {
  const shown = Math.max(0, Math.min(Math.floor(stops) || 0, maxDots));
  return Array.from({ length: shown }, (_, i) => arcPoint((i + 1) / (shown + 1)));
}
