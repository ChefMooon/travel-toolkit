export function climateDisplay(value: number, unit: string, imperial: boolean): { value: number; unit: string } {
  if (!imperial) return { value, unit };
  if (unit === '°C') return { value: Math.round((value * 9) / 5 + 32), unit: '°F' };
  if (unit === 'mm' || unit === 'mm/day') return { value: Math.round(value / 25.4 * 10) / 10, unit: unit === 'mm' ? 'in' : 'in/day' };
  if (unit === 'cm' || unit === 'cm/day') return { value: Math.round(value / 2.54 * 10) / 10, unit: unit === 'cm' ? 'in' : 'in/day' };
  if (unit === 'km/h') return { value: Math.round(value * 0.621371), unit: 'mph' };
  return { value, unit };
}
