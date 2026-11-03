import { describe, expect, it } from 'vitest';
import {
  ARC_CONTROL, ARC_END, ARC_START, arcAngle, arcPoint, quadraticPoint, quadraticTangentAngle, stopPoints,
} from './flightPath';

describe('flightPath', () => {
  it('hits the endpoints at t=0 and t=1', () => {
    expect(arcPoint(0)).toEqual(ARC_START);
    expect(arcPoint(1)).toEqual(ARC_END);
  });

  it('puts the midpoint at x=50, y=9 for the mockup curve', () => {
    const m = arcPoint(0.5);
    expect(m.x).toBeCloseTo(50);
    expect(m.y).toBeCloseTo(9);
  });

  it('is horizontal at the midpoint and rises then falls', () => {
    expect(arcAngle(0.5)).toBeCloseTo(0);
    expect(arcAngle(0)).toBeLessThan(0);
    expect(arcAngle(1)).toBeGreaterThan(0);
  });

  it('computes tangent angles for a simple curve', () => {
    const a = { x: 0, y: 0 };
    expect(quadraticTangentAngle(a, { x: 10, y: 0 }, { x: 20, y: 0 }, 0.3)).toBeCloseTo(0);
    expect(quadraticTangentAngle(a, { x: 10, y: 10 }, { x: 20, y: 20 }, 0.5)).toBeCloseTo(45);
    expect(quadraticPoint(a, ARC_CONTROL, ARC_END, 0).x).toBe(0);
  });

  it('spaces stops evenly in t and caps the dots', () => {
    expect(stopPoints(0)).toEqual([]);
    expect(stopPoints(1)).toEqual([arcPoint(0.5)]);
    expect(stopPoints(7)).toHaveLength(5);
    expect(stopPoints(2)[0]).toEqual(arcPoint(1 / 3));
    expect(stopPoints(-3)).toEqual([]);
  });
});
