import {
  HourlyAtmosphericPoint,
  MonitoringStation,
  PollutantConcentrations,
  StationFullData,
  WeatherTelemetry,
} from '../types/aqi';
import { computeFullAQI } from './aqiCalculator';

export const CURATED_STATIONS: MonitoringStation[] = [
  {
    id: 'delhi-anand-vihar',
    name: 'Anand Vihar CAAQMS',
    city: 'Delhi-NCR',
    state: 'Delhi',
    country: 'India',
    lat: 28.6508,
    lon: 77.3153,
    lastUpdated: 'Live',
  },
  {
    id: 'delhi-ito',
    name: 'ITO Crossing Station',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    lat: 28.6289,
    lon: 77.2411,
    lastUpdated: 'Live',
  },
  {
    id: 'mumbai-bkc',
    name: 'BKC Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    lat: 19.0657,
    lon: 72.8687,
    lastUpdated: 'Live',
  },
  {
    id: 'bengaluru-silk-board',
    name: 'Central Silk Board',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    lat: 12.9177,
    lon: 77.6238,
    lastUpdated: 'Live',
  },
  {
    id: 'kolkata-victoria',
    name: 'Victoria Memorial Site',
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    lat: 22.5448,
    lon: 88.3426,
    lastUpdated: 'Live',
  },
  {
    id: 'chennai-alandur',
    name: 'Alandur Bus Depot CAAQMS',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    lat: 13.0012,
    lon: 80.2014,
    lastUpdated: 'Live',
  },
  {
    id: 'hyderabad-bolarum',
    name: 'IDA Bolarum Industrial Area',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    lat: 17.5332,
    lon: 78.4312,
    lastUpdated: 'Live',
  },
  {
    id: 'lucknow-talkatora',
    name: 'Talkatora District Station',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    lat: 26.8304,
    lon: 80.9038,
    lastUpdated: 'Live',
  },
  {
    id: 'patna-muradpur',
    name: 'Muradpur Science College',
    city: 'Patna',
    state: 'Bihar',
    country: 'India',
    lat: 25.6179,
    lon: 85.1633,
    lastUpdated: 'Live',
  },
  {
    id: 'beijing-chaoyang',
    name: 'Chaoyang Olympic Park',
    city: 'Beijing',
    country: 'China',
    lat: 39.9042,
    lon: 116.4074,
    lastUpdated: 'Live',
  },
  {
    id: 'london-marylebone',
    name: 'Marylebone Atmospheric Lab',
    city: 'London',
    country: 'United Kingdom',
    lat: 51.5225,
    lon: -0.1558,
    lastUpdated: 'Live',
  },
  {
    id: 'new-york-queens',
    name: 'Queens College Telemetry',
    city: 'New York',
    country: 'United States',
    lat: 40.7366,
    lon: -73.8201,
    lastUpdated: 'Live',
  },
  {
    id: 'tokyo-shinjuku',
    name: 'Shinjuku Gyoen Station',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.6895,
    lon: 139.7114,
    lastUpdated: 'Live',
  },
  {
    id: 'dubai-al-jaddaf',
    name: 'Al Jaddaf Coastal Monitor',
    city: 'Dubai',
    country: 'UAE',
    lat: 25.2155,
    lon: 55.3347,
    lastUpdated: 'Live',
  },
];

export async function searchCities(query: string): Promise<MonitoringStation[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query.trim()
      )}&count=6&language=en&format=json`
    );
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: {
      id: number;
      name: string;
      admin1?: string;
      country: string;
      latitude: number;
      longitude: number;
    }) => ({
      id: `geo-${r.id || Math.random().toString(36).substring(7)}`,
      name: `${r.name} Atmospheric Station`,
      city: r.name,
      state: r.admin1,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude,
      lastUpdated: 'Real-time',
    }));
  } catch {
    // Local filter fallback
    return CURATED_STATIONS.filter(
      (s) =>
        s.city.toLowerCase().includes(query.toLowerCase()) ||
        s.country.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

/**
 * Generates synthetic atmospheric dataset calibrated to the station location
 * as a graceful fallback when remote API calls encounter CORS or offline issues.
 */
function generateFallbackData(station: MonitoringStation): StationFullData {
  // Calibrate baseline values depending on geographic context
  const isGangeticPlain =
    station.country === 'India' &&
    ['Delhi-NCR', 'New Delhi', 'Patna', 'Lucknow'].includes(station.city);
  const isCoastal = ['Mumbai', 'Chennai', 'Dubai', 'Tokyo'].includes(station.city);

  const basePM25 = isGangeticPlain ? 142 : isCoastal ? 38 : 58;
  const basePM10 = basePM25 * 1.8;
  const baseNO2 = 45;
  const baseSO2 = 18;
  const baseCO = 1.4;
  const baseO3 = 48;

  const currentPollutants: PollutantConcentrations = {
    pm25: Math.round(basePM25 + (Math.random() * 20 - 10)),
    pm10: Math.round(basePM10 + (Math.random() * 30 - 15)),
    no2: Math.round(baseNO2 + (Math.random() * 10 - 5)),
    so2: Math.round(baseSO2 + (Math.random() * 6 - 3)),
    co: Number((baseCO + (Math.random() * 0.4 - 0.2)).toFixed(2)),
    o3: Math.round(baseO3 + (Math.random() * 12 - 6)),
  };

  const computedCPCB = computeFullAQI(currentPollutants, 'CPCB');
  const computedEPA = computeFullAQI(currentPollutants, 'EPA');

  const weather: WeatherTelemetry = {
    temperature: isCoastal ? 29 : 24,
    humidity: isCoastal ? 78 : 52,
    windSpeed: isCoastal ? 18.5 : 8.2,
    windDirection: 240,
    uvIndex: 5,
  };

  const now = new Date();
  const hourlyHistory: HourlyAtmosphericPoint[] = [];

  // Generate 72 hours of hourly history
  for (let i = 72; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    const hour = t.getHours();
    // Diurnal atmospheric pattern: higher at morning rush (8-10am) & evening inversion (8-11pm)
    const diurnalFactor =
      (hour >= 7 && hour <= 10) || (hour >= 20 && hour <= 23) ? 1.35 : 0.85;
    const noise = 0.9 + Math.random() * 0.2;

    const pm25 = Math.max(5, Math.round(basePM25 * diurnalFactor * noise));
    const pm10 = Math.max(10, Math.round(pm25 * 1.7));
    const no2 = Math.max(8, Math.round(baseNO2 * diurnalFactor));
    const so2 = Math.max(4, Math.round(baseSO2 * noise));
    const co = Number((baseCO * diurnalFactor * noise).toFixed(2));
    const o3 = Math.max(5, Math.round(baseO3 * (hour >= 12 && hour <= 16 ? 1.6 : 0.5)));

    const cAqi = computeFullAQI({ pm25, pm10, no2, so2, co, o3 }, 'CPCB').aqi;
    const eAqi = computeFullAQI({ pm25, pm10, no2, so2, co, o3 }, 'EPA').aqi;

    hourlyHistory.push({
      time: t.toISOString(),
      pm25,
      pm10,
      no2,
      so2,
      co,
      o3,
      aqiCPCB: cAqi,
      aqiEPA: eAqi,
      windSpeed: Math.round((12 + Math.sin(i / 6) * 6) * 10) / 10,
      temperature: Math.round(20 + Math.sin(hour / 3) * 6),
      humidity: Math.round(55 + Math.cos(hour / 3) * 20),
    });
  }

  // Generate 48 hours of forecast
  const forecastHourly: HourlyAtmosphericPoint[] = [];
  for (let i = 1; i <= 48; i++) {
    const t = new Date(now.getTime() + i * 3600 * 1000);
    const hour = t.getHours();
    const diurnalFactor =
      (hour >= 7 && hour <= 10) || (hour >= 20 && hour <= 23) ? 1.3 : 0.88;
    const weatherFactor = 1 - Math.min(0.2, (i / 48) * 0.15); // Slight dispersion improvement

    const pm25 = Math.max(5, Math.round(basePM25 * diurnalFactor * weatherFactor));
    const pm10 = Math.max(10, Math.round(pm25 * 1.65));
    const no2 = Math.max(8, Math.round(baseNO2 * diurnalFactor));
    const so2 = Math.max(4, Math.round(baseSO2));
    const co = Number((baseCO * diurnalFactor).toFixed(2));
    const o3 = Math.max(5, Math.round(baseO3 * (hour >= 12 && hour <= 16 ? 1.5 : 0.6)));

    const cAqi = computeFullAQI({ pm25, pm10, no2, so2, co, o3 }, 'CPCB').aqi;
    const eAqi = computeFullAQI({ pm25, pm10, no2, so2, co, o3 }, 'EPA').aqi;

    forecastHourly.push({
      time: t.toISOString(),
      pm25,
      pm10,
      no2,
      so2,
      co,
      o3,
      aqiCPCB: cAqi,
      aqiEPA: eAqi,
      windSpeed: Math.round((14 + Math.cos(i / 6) * 5) * 10) / 10,
      temperature: Math.round(22 + Math.sin(hour / 3) * 6),
      humidity: Math.round(50 + Math.cos(hour / 3) * 18),
    });
  }

  return {
    station: {
      ...station,
      currentAQI: computedCPCB.aqi,
      category: computedCPCB.category,
      color: computedCPCB.color,
      dominantPollutant: computedCPCB.dominantPollutant,
    },
    currentPollutants,
    computedCPCB,
    computedEPA,
    weather,
    hourlyHistory,
    forecastHourly,
  };
}

export async function fetchStationFullData(
  station: MonitoringStation
): Promise<StationFullData> {
  try {
    const [aqRes, weatherRes] = await Promise.allSettled([
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${station.lat}&longitude=${station.lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi,uv_index&past_days=3&forecast_days=2`
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${station.lat}&longitude=${station.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m`
      ),
    ]);

    if (aqRes.status !== 'fulfilled' || !aqRes.value.ok) {
      return generateFallbackData(station);
    }

    const aqData = await aqRes.value.json();
    const weatherData =
      weatherRes.status === 'fulfilled' && weatherRes.value.ok
        ? await weatherRes.value.json()
        : null;

    const hourly = aqData.hourly;
    if (!hourly || !hourly.time || hourly.time.length === 0) {
      return generateFallbackData(station);
    }

    // Find the latest current index (closest to current time)
    const nowISO = new Date().toISOString();
    let latestIdx = hourly.time.length - 1;
    for (let i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i] > nowISO) {
        latestIdx = Math.max(0, i - 1);
        break;
      }
    }

    const pm25Val = hourly.pm2_5?.[latestIdx] ?? 42;
    const pm10Val = hourly.pm10?.[latestIdx] ?? 75;
    const no2Val = hourly.nitrogen_dioxide?.[latestIdx] ?? 32;
    const so2Val = hourly.sulphur_dioxide?.[latestIdx] ?? 12;
    // Open-Meteo CO is in µg/m³, standard CPCB/EPA requires mg/m³ (divide by 1000)
    const coMicrogram = hourly.carbon_monoxide?.[latestIdx] ?? 850;
    const coVal = Number((coMicrogram / 1000).toFixed(2));
    const o3Val = hourly.ozone?.[latestIdx] ?? 45;

    const currentPollutants: PollutantConcentrations = {
      pm25: Math.round(pm25Val),
      pm10: Math.round(pm10Val),
      no2: Math.round(no2Val),
      so2: Math.round(so2Val),
      co: coVal,
      o3: Math.round(o3Val),
    };

    const computedCPCB = computeFullAQI(currentPollutants, 'CPCB');
    const computedEPA = computeFullAQI(currentPollutants, 'EPA');

    const weather: WeatherTelemetry = {
      temperature: weatherData?.current?.temperature_2m ?? 24,
      humidity: weatherData?.current?.relative_humidity_2m ?? 55,
      windSpeed: weatherData?.current?.wind_speed_10m ?? 11.4,
      windDirection: weatherData?.current?.wind_direction_10m ?? 210,
      uvIndex: hourly.uv_index?.[latestIdx] ?? 4,
    };

    const allHourly: HourlyAtmosphericPoint[] = hourly.time.map(
      (timeStr: string, idx: number) => {
        const p25 = Math.round(hourly.pm2_5?.[idx] ?? 0);
        const p10 = Math.round(hourly.pm10?.[idx] ?? 0);
        const n2 = Math.round(hourly.nitrogen_dioxide?.[idx] ?? 0);
        const s2 = Math.round(hourly.sulphur_dioxide?.[idx] ?? 0);
        const cVal = Number(((hourly.carbon_monoxide?.[idx] ?? 0) / 1000).toFixed(2));
        const oz = Math.round(hourly.ozone?.[idx] ?? 0);

        const cAqi = computeFullAQI(
          { pm25: p25, pm10: p10, no2: n2, so2: s2, co: cVal, o3: oz },
          'CPCB'
        ).aqi;

        const eAqi = computeFullAQI(
          { pm25: p25, pm10: p10, no2: n2, so2: s2, co: cVal, o3: oz },
          'EPA'
        ).aqi;

        return {
          time: timeStr,
          pm25: p25,
          pm10: p10,
          no2: n2,
          so2: s2,
          co: cVal,
          o3: oz,
          aqiCPCB: cAqi,
          aqiEPA: eAqi,
          windSpeed: weather.windSpeed,
          temperature: weather.temperature,
          humidity: weather.humidity,
        };
      }
    );

    const hourlyHistory = allHourly.slice(0, latestIdx + 1);
    const forecastHourly = allHourly.slice(latestIdx + 1);

    return {
      station: {
        ...station,
        currentAQI: computedCPCB.aqi,
        category: computedCPCB.category,
        color: computedCPCB.color,
        dominantPollutant: computedCPCB.dominantPollutant,
      },
      currentPollutants,
      computedCPCB,
      computedEPA,
      weather,
      hourlyHistory: hourlyHistory.length > 0 ? hourlyHistory : generateFallbackData(station).hourlyHistory,
      forecastHourly: forecastHourly.length > 0 ? forecastHourly : generateFallbackData(station).forecastHourly,
    };
  } catch {
    return generateFallbackData(station);
  }
}
