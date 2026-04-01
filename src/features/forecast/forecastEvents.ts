import type { ForecastEvent } from './forecastTypes';

export const FORECAST_EVENTS: ForecastEvent[] = [
  {
    id: "barcelona-mwc",
    name: "Mobile World Congress",
    locationKey: "barcelona",
    startDate: "02-24",
    endDate: "02-27",
    year: 2025,
    description: "World's largest mobile technology conference.",
    type: "conference",
  },
  {
    id: "barcelona-la-merce",
    name: "La Merce Festival",
    locationKey: "barcelona",
    startDate: "09-24",
    endDate: "09-24",
    year: 2025,
    description: "Barcelona's main civic festival with free concerts and events.",
    type: "festival",
  },
  {
    id: "tokyo-cherry-blossom",
    name: "Cherry Blossom Season",
    locationKey: "tokyo",
    startDate: "03-20",
    endDate: "04-10",
    year: 2025,
    description: "Peak sakura viewing season across Tokyo's parks.",
    type: "festival",
  },
  {
    id: "reykjavik-culture-night",
    name: "Culture Night",
    locationKey: "reykjavik",
    startDate: "08-23",
    endDate: "08-23",
    year: 2025,
    description: "Annual free arts and culture celebration across the city.",
    type: "festival",
  },
  {
    id: "manchester-flm",
    name: "Manchester Film Festival",
    locationKey: "manchester",
    startDate: "03-19",
    endDate: "03-29",
    year: 2025,
    description: "The city’s biggest celebration of the best new and independent film",
    type: "festival",
  },
];

export function getEventsForRange(locationName: string, dateFrom: string, dateTo: string): ForecastEvent[] {
  const locationKey = locationName.toLowerCase().trim();
  const toMD = (date: string) => date.slice(5);
  const toYear = (date: string) => Number(date.slice(0, 4));
  const rangeStart = toMD(dateFrom);
  const rangeEnd = toMD(dateTo);
  const yearStart = toYear(dateFrom);
  const yearEnd = toYear(dateTo);

  const overlaps = (start: string, end: string) => start <= rangeEnd && end >= rangeStart;

  const locationEvents = FORECAST_EVENTS.filter((e) => e.locationKey === locationKey);

  const grouped = new Map<string, ForecastEvent[]>();
  for (const event of locationEvents) {
    const list = grouped.get(event.id) ?? [];
    list.push(event);
    grouped.set(event.id, list);
  }

  const results: ForecastEvent[] = [];

  for (const [, entries] of grouped) {
    const yearMatch = entries.find(
      (e) => e.year >= yearStart && e.year <= yearEnd && overlaps(e.startDate, e.endDate),
    );

    if (yearMatch) {
      results.push(yearMatch);
      continue;
    }

    let minStart = entries[0].startDate;
    let maxEnd = entries[0].endDate;
    let latest = entries[0];
    for (const e of entries) {
      if (e.startDate < minStart) minStart = e.startDate;
      if (e.endDate > maxEnd) maxEnd = e.endDate;
      if (e.year > latest.year) latest = e;
    }

    if (overlaps(minStart, maxEnd)) {
      results.push({ ...latest, startDate: minStart, endDate: maxEnd, year: 0 });
    }
  }

  return results;
}
