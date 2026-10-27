import { describe, expect, it } from 'vitest';
import { categories, convert } from './conversions';

describe('unit conversions', () => {
  it('handles temperatures in both directions including negatives', () => {
    const [c, f] = categories.Temperature!;
    expect(convert(0, c!, f!)).toBeCloseTo(32);
    expect(convert(-40, f!, c!)).toBeCloseTo(-40);
  });
  it('converts distance, weight and distinct gallon measures', () => {
    expect(convert(1, categories.Distance![1]!, categories.Distance![0]!)).toBeCloseTo(1.609344);
    expect(convert(1, categories.Weight![1]!, categories.Weight![0]!)).toBeCloseTo(0.45359237);
    expect(convert(1, categories.Volume![4]!, categories.Volume![0]!)).toBeCloseTo(4.54609);
    expect(convert(1, categories.Volume![1]!, categories.Volume![0]!)).toBeCloseTo(3.785411784);
  });
});
