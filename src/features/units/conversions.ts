export type Unit = { label: string; factor: number; offset?: number };

export const categories: Record<string, Unit[]> = {
  Temperature: [
    { label: 'Celsius (°C)', factor: 1 },
    { label: 'Fahrenheit (°F)', factor: 5 / 9, offset: -32 },
  ],
  Distance: [
    { label: 'Kilometers (km)', factor: 1000 }, { label: 'Miles (mi)', factor: 1609.344 },
    { label: 'Meters (m)', factor: 1 }, { label: 'Feet (ft)', factor: 0.3048 },
  ],
  Weight: [
    { label: 'Kilograms (kg)', factor: 1 }, { label: 'Pounds (lb)', factor: 0.45359237 },
    { label: 'Grams (g)', factor: 0.001 }, { label: 'Ounces (oz)', factor: 0.028349523125 },
  ],
  Volume: [
    { label: 'Liters (L)', factor: 1 }, { label: 'US gallons (gal)', factor: 3.785411784 },
    { label: 'Milliliters (mL)', factor: 0.001 }, { label: 'US fluid ounces (fl oz)', factor: 0.0295735295625 },
    { label: 'Imperial gallons (gal)', factor: 4.54609 }, { label: 'Imperial fluid ounces (fl oz)', factor: 0.0284130625 },
  ],
};

export function convert(value: number, from: Unit, to: Unit): number {
  return (value + (from.offset ?? 0)) * from.factor / to.factor - (to.offset ?? 0);
}
