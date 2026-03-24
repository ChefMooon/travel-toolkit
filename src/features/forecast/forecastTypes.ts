export interface GeoLocation {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1: string;
  lat: number;
  lng: number;
  timezone: string;
  population: number;
  displayName: string;
}

export interface DailyClimate {
  date: string;
  tempMeanC: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  rainMm: number;
  snowfallCm: number;
  precipitationDisplay: 'rain' | 'snow';
  sunshineDurationHrs: number;
  daylightDurationHrs: number;
  windspeedMaxKmh: number;
}

export interface ClimateSummary {
  location: GeoLocation;
  dateFrom: string;
  dateTo: string;
  avgHighC: number;
  avgLowC: number;
  avgMeanC: number;
  avgPrecipitationMm: number;
  avgRainMm: number;
  avgSnowfallCm: number;
  precipitationDisplay: 'rain' | 'snow';
  avgSunshineDurationHrs: number;
  avgDaylightDurationHrs: number;
  avgWindspeedMaxKmh: number;
  days: DailyClimate[];
}

export interface ForecastEvent {
  id: string;
  name: string;
  locationKey: string;
  startDate: string;
  endDate: string;
  description: string;
  type: 'festival' | 'holiday' | 'conference' | 'sporting' | 'other';
}