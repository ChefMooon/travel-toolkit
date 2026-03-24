import type { ClimateSummary, DailyClimate, GeoLocation } from './forecastTypes';

type GeocodingApiResult = {
  id: number;
  name: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
};

type GeocodingApiResponse = {
  results?: GeocodingApiResult[];
};

type ClimateDailyResponse = {
  time: string[];
  temperature_2m_mean: Array<number | null>;
  temperature_2m_max: Array<number | null>;
  temperature_2m_min: Array<number | null>;
  precipitation_sum: Array<number | null>;
  rain_sum: Array<number | null>;
  snowfall_sum: Array<number | null>;
  sunshine_duration: Array<number | null>;
  daylight_duration: Array<number | null>;
  windspeed_10m_max: Array<number | null>;
};

type ClimateApiResponse = {
  daily?: ClimateDailyResponse;
};

function avg(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function isMonthDayWithinRange(monthDay: string, rangeStart: string, rangeEnd: string): boolean {
  if (rangeStart <= rangeEnd) {
    return monthDay >= rangeStart && monthDay <= rangeEnd;
  }

  return monthDay >= rangeStart || monthDay <= rangeEnd;
}

function sortMonthDayWithinRange(a: string, b: string, rangeStart: string): number {
  const normalize = (md: string) => (md >= rangeStart ? `0-${md}` : `1-${md}`);
  return normalize(a).localeCompare(normalize(b));
}

export async function fetchGeocodingResults(query: string, count = 5): Promise<GeoLocation[]> {
  if (!query.trim()) {
    return [];
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Geocoding API error: ${res.status}`);
  }

  const data = (await res.json()) as GeocodingApiResponse;

  if (!data.results?.length) {
    return [];
  }

  const mapped = data.results.map((result): GeoLocation => ({
    id: result.id,
    name: result.name,
    country: result.country ?? '',
    countryCode: result.country_code ?? '',
    admin1: result.admin1 ?? '',
    lat: result.latitude,
    lng: result.longitude,
    timezone: result.timezone ?? 'UTC',
    population: result.population ?? 0,
    displayName: [result.name, result.admin1, result.country].filter(Boolean).join(', '),
  }));

  return mapped.sort((a, b) => b.population - a.population);
}

export async function fetchClimateData(
  location: GeoLocation,
  dateFrom: string,
  dateTo: string,
): Promise<ClimateSummary> {
  const BASELINE_START_YEAR = 2000;
  const BASELINE_END_YEAR = 2020;

  const fromMD = dateFrom.slice(5);
  const toMD = dateTo.slice(5);

  const apiStart = `${BASELINE_START_YEAR}-${fromMD}`;
  const apiEnd = `${BASELINE_END_YEAR}-${toMD}`;

  const variables = [
    'temperature_2m_mean',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'rain_sum',
    'snowfall_sum',
    'sunshine_duration',
    'daylight_duration',
    'windspeed_10m_max',
  ].join(',');

  const url = [
    'https://climate-api.open-meteo.com/v1/climate',
    `?latitude=${location.lat}`,
    `&longitude=${location.lng}`,
    `&start_date=${apiStart}`,
    `&end_date=${apiEnd}`,
    '&models=EC_Earth3P_HR',
    `&daily=${variables}`,
  ].join('');

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Climate API error: ${res.status}`);
  }

  const data = (await res.json()) as ClimateApiResponse;
  const daily = data.daily;

  if (!daily?.time?.length) {
    throw new Error('Climate API returned no daily data.');
  }

  type DayAccumulator = {
    means: number[];
    maxes: number[];
    mins: number[];
    precip: number[];
    rain: number[];
    snow: number[];
    sunshine: number[];
    daylight: number[];
    wind: number[];
  };

  const grouped: Record<string, DayAccumulator> = {};

  daily.time.forEach((dateStr, index) => {
    const monthDay = dateStr.slice(5);

    if (!grouped[monthDay]) {
      grouped[monthDay] = {
        means: [],
        maxes: [],
        mins: [],
        precip: [],
        rain: [],
        snow: [],
        sunshine: [],
        daylight: [],
        wind: [],
      };
    }

    const entry = grouped[monthDay];
    const pushIfNumber = (collection: number[], value: number | null | undefined) => {
      if (value != null) {
        collection.push(value);
      }
    };

    pushIfNumber(entry.means, daily.temperature_2m_mean[index]);
    pushIfNumber(entry.maxes, daily.temperature_2m_max[index]);
    pushIfNumber(entry.mins, daily.temperature_2m_min[index]);
    pushIfNumber(entry.precip, daily.precipitation_sum[index]);
    pushIfNumber(entry.rain, daily.rain_sum[index]);
    pushIfNumber(entry.snow, daily.snowfall_sum[index]);
    pushIfNumber(
      entry.sunshine,
      daily.sunshine_duration[index] != null ? daily.sunshine_duration[index]! / 3600 : null,
    );
    pushIfNumber(
      entry.daylight,
      daily.daylight_duration[index] != null ? daily.daylight_duration[index]! / 3600 : null,
    );
    pushIfNumber(entry.wind, daily.windspeed_10m_max[index]);
  });

  const days: DailyClimate[] = Object.entries(grouped)
    .filter(([monthDay]) => isMonthDayWithinRange(monthDay, fromMD, toMD))
    .sort(([a], [b]) => sortMonthDayWithinRange(a, b, fromMD))
    .map(([monthDay, entry]) => {
      const precipitationMm = avg(entry.precip);
      const snowfallCm = avg(entry.snow);

      return {
        date: monthDay,
        tempMeanC: avg(entry.means),
        tempMaxC: avg(entry.maxes),
        tempMinC: avg(entry.mins),
        precipitationMm,
        rainMm: avg(entry.rain),
        snowfallCm,
        precipitationDisplay: precipitationMm === 0 && snowfallCm > 0 ? 'snow' : 'rain',
        sunshineDurationHrs: avg(entry.sunshine),
        daylightDurationHrs: avg(entry.daylight),
        windspeedMaxKmh: avg(entry.wind),
      };
    });

  const avgPrecipitationMm = avg(days.map((day) => day.precipitationMm));
  const avgSnowfallCm = avg(days.map((day) => day.snowfallCm));

  return {
    location,
    dateFrom,
    dateTo,
    avgHighC: avg(days.map((day) => day.tempMaxC)),
    avgLowC: avg(days.map((day) => day.tempMinC)),
    avgMeanC: avg(days.map((day) => day.tempMeanC)),
    avgPrecipitationMm,
    avgRainMm: avg(days.map((day) => day.rainMm)),
    avgSnowfallCm,
    precipitationDisplay: avgPrecipitationMm === 0 && avgSnowfallCm > 0 ? 'snow' : 'rain',
    avgSunshineDurationHrs: avg(days.map((day) => day.sunshineDurationHrs)),
    avgDaylightDurationHrs: avg(days.map((day) => day.daylightDurationHrs)),
    avgWindspeedMaxKmh: avg(days.map((day) => day.windspeedMaxKmh)),
    days,
  };
}

export function getLocalTimeAtDestination(timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    weekday: 'short',
  }).format(new Date());
}
