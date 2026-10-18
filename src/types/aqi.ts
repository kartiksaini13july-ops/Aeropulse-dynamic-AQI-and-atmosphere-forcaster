export type AQIStandard = 'CPCB' | 'EPA';

export type AppColorTheme = 'dynamic' | 'navy' | 'emerald' | 'obsidian' | 'amber';

export type AQISeverityCategory =
  | 'Good'
  | 'Satisfactory'
  | 'Moderate'
  | 'Poor'
  | 'Very Poor'
  | 'Severe'
  | 'Hazardous';

export interface SeverityBand {
  min: number;
  max: number;
  label: AQISeverityCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  healthImplications: string;
}

export interface PollutantConcentrations {
  pm25: number;   // µg/m³
  pm10: number;   // µg/m³
  no2: number;    // µg/m³
  so2: number;    // µg/m³
  co: number;     // mg/m³
  o3: number;     // µg/m³
  nh3?: number;   // µg/m³
}

export interface PollutantSubIndex {
  pollutant: keyof PollutantConcentrations;
  name: string;
  formula: string;
  concentration: number;
  unit: string;
  subIndex: number;
  category: AQISeverityCategory;
  color: string;
  breakpoints: {
    bLo: number;
    bHi: number;
    iLo: number;
    iHi: number;
  };
}

export interface ComputedAQI {
  aqi: number;
  standard: AQIStandard;
  category: AQISeverityCategory;
  color: string;
  dominantPollutant: string;
  subIndices: PollutantSubIndex[];
  timestamp: string;
}

export interface WeatherTelemetry {
  temperature: number;      // °C
  humidity: number;         // %
  windSpeed: number;        // km/h
  windDirection: number;    // degrees
  uvIndex?: number;
}

export interface MonitoringStation {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  currentAQI?: number;
  category?: AQISeverityCategory;
  color?: string;
  dominantPollutant?: string;
  lastUpdated: string;
}

export interface HourlyAtmosphericPoint {
  time: string; // ISO string
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  aqiCPCB: number;
  aqiEPA: number;
  windSpeed?: number;
  temperature?: number;
  humidity?: number;
}

export interface StationFullData {
  station: MonitoringStation;
  currentPollutants: PollutantConcentrations;
  computedCPCB: ComputedAQI;
  computedEPA: ComputedAQI;
  weather: WeatherTelemetry;
  hourlyHistory: HourlyAtmosphericPoint[];
  forecastHourly: HourlyAtmosphericPoint[];
}

export interface CityComparisonProfile {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  aqi: number;
  standard: AQIStandard;
  category: AQISeverityCategory;
  dominantPollutant: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  windSpeed: number;
  temperature: number;
  color: string;
}

export interface AISpatialAnalysis {
  spatialSummary: string;
  localContributors: string[];
  plumeDispersion: string;
  safeZoneInsight: string;
  vivaInsight: string;
}
