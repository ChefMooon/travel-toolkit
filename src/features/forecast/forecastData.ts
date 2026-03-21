export type ForecastDay = {
  dateLabel: string;
  condition: string;
  highC: number;
  lowC: number;
};

export type ForecastSummary = {
  destination: string;
  packNote: string;
  days: ForecastDay[];
};

const FORECASTS: ForecastSummary[] = [
  {
    destination: 'Barcelona',
    packNote: 'Bring a light jacket and compact umbrella for evening showers.',
    days: [
      { dateLabel: 'Mon', condition: 'Partly Cloudy', highC: 21, lowC: 14 },
      { dateLabel: 'Tue', condition: 'Light Rain', highC: 19, lowC: 13 },
      { dateLabel: 'Wed', condition: 'Sunny', highC: 22, lowC: 15 },
    ],
  },
  {
    destination: 'Tokyo',
    packNote: 'Layer for warm days and cooler evenings.',
    days: [
      { dateLabel: 'Mon', condition: 'Sunny', highC: 24, lowC: 17 },
      { dateLabel: 'Tue', condition: 'Cloudy', highC: 23, lowC: 18 },
      { dateLabel: 'Wed', condition: 'Light Rain', highC: 21, lowC: 17 },
    ],
  },
  {
    destination: 'Reykjavik',
    packNote: 'Waterproof shell and warm layers recommended.',
    days: [
      { dateLabel: 'Mon', condition: 'Windy', highC: 8, lowC: 2 },
      { dateLabel: 'Tue', condition: 'Rain', highC: 7, lowC: 1 },
      { dateLabel: 'Wed', condition: 'Cloudy', highC: 9, lowC: 3 },
    ],
  },
];

export const FORECAST_DESTINATIONS = FORECASTS.map((entry) => entry.destination);

export async function fetchForecast(destination: string): Promise<ForecastSummary | null> {
  await new Promise((resolve) => globalThis.setTimeout(resolve, 170));

  const result = FORECASTS.find((entry) => entry.destination === destination);
  return result ?? null;
}
