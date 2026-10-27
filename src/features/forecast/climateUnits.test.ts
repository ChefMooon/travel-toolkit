import { describe, expect, it } from 'vitest';
import { climateDisplay } from './climateUnits';

describe('climate display units', () => {
  it('converts the supported forecast measurements without changing metric values', () => {
    expect(climateDisplay(20, '°C', true)).toEqual({ value: 68, unit: '°F' });
    expect(climateDisplay(25.4, 'mm', true)).toEqual({ value: 1, unit: 'in' });
    expect(climateDisplay(2.54, 'cm', true)).toEqual({ value: 1, unit: 'in' });
    expect(climateDisplay(100, 'km/h', true)).toEqual({ value: 62, unit: 'mph' });
    expect(climateDisplay(20, '°C', false)).toEqual({ value: 20, unit: '°C' });
  });
});
