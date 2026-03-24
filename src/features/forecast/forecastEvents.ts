import type { ForecastEvent } from './forecastTypes';

export const FORECAST_EVENTS: ForecastEvent[] = [
  {
    id: "barcelona-mwc",
    name: "Mobile World Congress",
    locationKey: "barcelona",
    startDate: "02-24",
    endDate: "02-27",
    description: "World's largest mobile technology conference.",
    type: "conference",
  },
  {
    id: "barcelona-la-merce",
    name: "La Merce Festival",
    locationKey: "barcelona",
    startDate: "09-24",
    endDate: "09-24",
    description: "Barcelona's main civic festival with free concerts and events.",
    type: "festival",
  },
  {
    id: "tokyo-cherry-blossom",
    name: "Cherry Blossom Season",
    locationKey: "tokyo",
    startDate: "03-20",
    endDate: "04-10",
    description: "Peak sakura viewing season across Tokyo's parks.",
    type: "festival",
  },
  {
    id: "reykjavik-culture-night",
    name: "Culture Night",
    locationKey: "reykjavik",
    startDate: "08-23",
    endDate: "08-23",
    description: "Annual free arts and culture celebration across the city.",
    type: "festival",
  },
  {
    id: "manchester-flm",
    name: "Manchester Film Festival",
    locationKey: "manchester",
    startDate: "03-19",
    endDate: "03-29",
    description: "The city’s biggest celebration of the best new and independent film",
    type: "festival",
  },
];

export function getEventsForRange(locationName: string, dateFrom: string, dateTo: string): ForecastEvent[] {
  const locationKey = locationName.toLowerCase().trim();
  const toMD = (date: string) => date.slice(5);
  const rangeStart = toMD(dateFrom);
  const rangeEnd = toMD(dateTo);

  return FORECAST_EVENTS.filter((event) => {
    if (event.locationKey !== locationKey) {
      return false;
    }

    return event.startDate <= rangeEnd && event.endDate >= rangeStart;
  });
}
