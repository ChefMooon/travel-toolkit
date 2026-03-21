export type TimezoneEntry = {
  city: string;
  country: string;
  timezone: string;
};

const TIMEZONE_ENTRIES: TimezoneEntry[] = [
  { city: 'New York', country: 'United States', timezone: 'America/New_York' },
  { city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  { city: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid' },
  { city: 'Sao Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  { city: 'Cape Town', country: 'South Africa', timezone: 'Africa/Johannesburg' },
];

export async function fetchTimezoneMatches(searchTerm: string): Promise<TimezoneEntry[]> {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 150));

  const normalizedTerm = searchTerm.trim().toLowerCase();
  if (!normalizedTerm) {
    return TIMEZONE_ENTRIES.slice(0, 4);
  }

  return TIMEZONE_ENTRIES.filter((entry) => {
    const city = entry.city.toLowerCase();
    const country = entry.country.toLowerCase();
    return city.includes(normalizedTerm) || country.includes(normalizedTerm);
  });
}
