import {
  AQISeverityCategory,
  AQIStandard,
  ComputedAQI,
  PollutantConcentrations,
  PollutantSubIndex,
  SeverityBand,
} from '../types/aqi';

export const CPCB_SEVERITY_BANDS: SeverityBand[] = [
  {
    min: 0,
    max: 50,
    label: 'Good',
    color: '#16a34a', // classic forest green
    bgColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
    textColor: '#86efac',
    description: 'Minimal impact',
    healthImplications: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
  },
  {
    min: 51,
    max: 100,
    label: 'Satisfactory',
    color: '#65a30d', // classic sage olive
    bgColor: 'rgba(101, 163, 13, 0.12)',
    borderColor: 'rgba(101, 163, 13, 0.3)',
    textColor: '#bef264',
    description: 'Minor breathing discomfort to sensitive people',
    healthImplications: 'Acceptable air quality; however, there may be moderate health concern for a very small number of unusually sensitive people.',
  },
  {
    min: 101,
    max: 200,
    label: 'Moderate',
    color: '#d97706', // classic amber ochre
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    textColor: '#fde68a',
    description: 'Breathing discomfort to people with lungs, asthma and heart diseases',
    healthImplications: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
  },
  {
    min: 201,
    max: 300,
    label: 'Poor',
    color: '#ea580c', // classic warm terracotta
    bgColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: 'rgba(234, 88, 12, 0.3)',
    textColor: '#fed7aa',
    description: 'Breathing discomfort to most people on prolonged exposure',
    healthImplications: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
  },
  {
    min: 301,
    max: 400,
    label: 'Very Poor',
    color: '#dc2626', // classic crimson
    bgColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    textColor: '#fca5a5',
    description: 'Respiratory illness on prolonged exposure',
    healthImplications: 'Health alert: risk of health effects is increased for everyone. Avoid prolonged outdoor exertion.',
  },
  {
    min: 401,
    max: 500,
    label: 'Severe',
    color: '#991b1b', // classic deep burgundy
    bgColor: 'rgba(153, 27, 27, 0.18)',
    borderColor: 'rgba(153, 27, 27, 0.35)',
    textColor: '#fecaca',
    description: 'Affects healthy people and seriously impacts those with existing diseases',
    healthImplications: 'Health warnings of emergency conditions. The entire population is even more likely to be affected.',
  },
];

export const EPA_SEVERITY_BANDS: SeverityBand[] = [
  {
    min: 0,
    max: 50,
    label: 'Good',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
    textColor: '#86efac',
    description: 'Air quality is satisfactory and poses little risk',
    healthImplications: 'Air quality is satisfactory and poses little or no health risk.',
  },
  {
    min: 51,
    max: 100,
    label: 'Moderate',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    textColor: '#fde68a',
    description: 'Acceptable quality with potential risk for sensitive people',
    healthImplications: 'Air quality is acceptable; however, sensitive individuals should reduce strenuous outdoor activities.',
  },
  {
    min: 101,
    max: 150,
    label: 'Moderate',
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: 'rgba(234, 88, 12, 0.3)',
    textColor: '#fed7aa',
    description: 'Unhealthy for sensitive groups',
    healthImplications: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.',
  },
  {
    min: 151,
    max: 200,
    label: 'Poor',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    textColor: '#fca5a5',
    description: 'Unhealthy for the general population',
    healthImplications: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
  },
  {
    min: 201,
    max: 300,
    label: 'Very Poor',
    color: '#6d28d9', // classic deep royal purple
    bgColor: 'rgba(109, 40, 217, 0.15)',
    borderColor: 'rgba(109, 40, 217, 0.35)',
    textColor: '#ddd6fe',
    description: 'Health alert: significant health risk',
    healthImplications: 'Health alert: The risk of health effects is increased for everyone.',
  },
  {
    min: 301,
    max: 500,
    label: 'Hazardous',
    color: '#991b1b', // classic deep wine
    bgColor: 'rgba(153, 27, 27, 0.18)',
    borderColor: 'rgba(153, 27, 27, 0.35)',
    textColor: '#fecaca',
    description: 'Emergency conditions for all inhabitants',
    healthImplications: 'Health warning of emergency conditions: everyone is more likely to be affected.',
  },
];

interface BreakpointRow {
  bLo: number;
  bHi: number;
  iLo: number;
  iHi: number;
}

// CPCB Breakpoints (CPCB Guidelines 2014)
export const CPCB_BREAKPOINTS: Record<string, BreakpointRow[]> = {
  pm25: [
    { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },
    { bLo: 31, bHi: 60, iLo: 51, iHi: 100 },
    { bLo: 61, bHi: 90, iLo: 101, iHi: 200 },
    { bLo: 91, bHi: 120, iLo: 201, iHi: 300 },
    { bLo: 121, bHi: 250, iLo: 301, iHi: 400 },
    { bLo: 251, bHi: 500, iLo: 401, iHi: 500 },
  ],
  pm10: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 101, bHi: 250, iLo: 101, iHi: 200 },
    { bLo: 251, bHi: 350, iLo: 201, iHi: 300 },
    { bLo: 351, bHi: 430, iLo: 301, iHi: 400 },
    { bLo: 431, bHi: 600, iLo: 401, iHi: 500 },
  ],
  no2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50 },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100 },
    { bLo: 81, bHi: 180, iLo: 101, iHi: 200 },
    { bLo: 181, bHi: 280, iLo: 201, iHi: 300 },
    { bLo: 281, bHi: 400, iLo: 301, iHi: 400 },
    { bLo: 401, bHi: 800, iLo: 401, iHi: 500 },
  ],
  so2: [
    { bLo: 0, bHi: 40, iLo: 0, iHi: 50 },
    { bLo: 41, bHi: 80, iLo: 51, iHi: 100 },
    { bLo: 81, bHi: 380, iLo: 101, iHi: 200 },
    { bLo: 381, bHi: 800, iLo: 201, iHi: 300 },
    { bLo: 801, bHi: 1600, iLo: 301, iHi: 400 },
    { bLo: 1601, bHi: 2000, iLo: 401, iHi: 500 },
  ],
  co: [
    { bLo: 0, bHi: 1.0, iLo: 0, iHi: 50 },
    { bLo: 1.1, bHi: 2.0, iLo: 51, iHi: 100 },
    { bLo: 2.1, bHi: 10.0, iLo: 101, iHi: 200 },
    { bLo: 10.1, bHi: 17.0, iLo: 201, iHi: 300 },
    { bLo: 17.1, bHi: 34.0, iLo: 301, iHi: 400 },
    { bLo: 34.1, bHi: 50.0, iLo: 401, iHi: 500 },
  ],
  o3: [
    { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
    { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 101, bHi: 168, iLo: 101, iHi: 200 },
    { bLo: 169, bHi: 208, iLo: 201, iHi: 300 },
    { bLo: 209, bHi: 748, iLo: 301, iHi: 400 },
    { bLo: 749, bHi: 1000, iLo: 401, iHi: 500 },
  ],
};

// US EPA Breakpoints (EPA Technical Document 2018/2024 update)
export const EPA_BREAKPOINTS: Record<string, BreakpointRow[]> = {
  pm25: [
    { bLo: 0.0, bHi: 9.0, iLo: 0, iHi: 50 },
    { bLo: 9.1, bHi: 35.4, iLo: 51, iHi: 100 },
    { bLo: 35.5, bHi: 55.4, iLo: 101, iHi: 150 },
    { bLo: 55.5, bHi: 125.4, iLo: 151, iHi: 200 },
    { bLo: 125.5, bHi: 225.4, iLo: 201, iHi: 300 },
    { bLo: 225.5, bHi: 500.4, iLo: 301, iHi: 500 },
  ],
  pm10: [
    { bLo: 0, bHi: 54, iLo: 0, iHi: 50 },
    { bLo: 55, bHi: 154, iLo: 51, iHi: 100 },
    { bLo: 155, bHi: 254, iLo: 101, iHi: 150 },
    { bLo: 255, bHi: 354, iLo: 151, iHi: 200 },
    { bLo: 355, bHi: 424, iLo: 201, iHi: 300 },
    { bLo: 425, bHi: 604, iLo: 301, iHi: 500 },
  ],
  no2: [
    { bLo: 0, bHi: 53, iLo: 0, iHi: 50 },
    { bLo: 54, bHi: 100, iLo: 51, iHi: 100 },
    { bLo: 101, bHi: 360, iLo: 101, iHi: 150 },
    { bLo: 361, bHi: 649, iLo: 151, iHi: 200 },
    { bLo: 650, bHi: 1249, iLo: 201, iHi: 300 },
    { bLo: 1250, bHi: 2049, iLo: 301, iHi: 500 },
  ],
  so2: [
    { bLo: 0, bHi: 35, iLo: 0, iHi: 50 },
    { bLo: 36, bHi: 75, iLo: 51, iHi: 100 },
    { bLo: 76, bHi: 185, iLo: 101, iHi: 150 },
    { bLo: 186, bHi: 304, iLo: 151, iHi: 200 },
    { bLo: 305, bHi: 604, iLo: 201, iHi: 300 },
    { bLo: 605, bHi: 1004, iLo: 301, iHi: 500 },
  ],
  co: [
    { bLo: 0, bHi: 4.4, iLo: 0, iHi: 50 },
    { bLo: 4.5, bHi: 9.4, iLo: 51, iHi: 100 },
    { bLo: 9.5, bHi: 12.4, iLo: 101, iHi: 150 },
    { bLo: 12.5, bHi: 15.4, iLo: 151, iHi: 200 },
    { bLo: 15.5, bHi: 30.4, iLo: 201, iHi: 300 },
    { bLo: 30.5, bHi: 50.4, iLo: 301, iHi: 500 },
  ],
  o3: [
    { bLo: 0, bHi: 54, iLo: 0, iHi: 50 },
    { bLo: 55, bHi: 70, iLo: 51, iHi: 100 },
    { bLo: 71, bHi: 85, iLo: 101, iHi: 150 },
    { bLo: 86, bHi: 105, iLo: 151, iHi: 200 },
    { bLo: 106, bHi: 200, iLo: 201, iHi: 300 },
    { bLo: 201, bHi: 600, iLo: 301, iHi: 500 },
  ],
};

/**
 * Calculates a single pollutant sub-index using standard linear interpolation:
 * Ip = [ (Ihi - Ilo) / (Bhi - Blo) ] * (Cp - Blo) + Ilo
 */
export function calculatePollutantSubIndex(
  pollutant: keyof PollutantConcentrations,
  concentration: number,
  standard: AQIStandard
): PollutantSubIndex {
  const table = standard === 'CPCB' ? CPCB_BREAKPOINTS : EPA_BREAKPOINTS;
  const rows = table[pollutant] || [];

  const safeConc = Math.max(0, concentration);

  // Find corresponding breakpoint interval
  let selectedRow = rows[0];
  for (const row of rows) {
    if (safeConc >= row.bLo && safeConc <= row.bHi) {
      selectedRow = row;
      break;
    }
  }

  // If concentration exceeds highest breakpoint, extrapolate to top tier
  if (safeConc > rows[rows.length - 1].bHi) {
    selectedRow = rows[rows.length - 1];
  }

  const { bLo, bHi, iLo, iHi } = selectedRow;

  // Linear interpolation
  const deltaB = bHi - bLo || 1;
  const deltaI = iHi - iLo;
  const clampedC = Math.min(Math.max(safeConc, bLo), bHi);
  const subIndexRaw = ((deltaI / deltaB) * (clampedC - bLo)) + iLo;
  const subIndex = Math.min(500, Math.max(0, Math.round(subIndexRaw)));

  const severity = getSeverityBand(subIndex, standard);

  const pollutantNames: Record<string, string> = {
    pm25: 'PM2.5 (Fine Particulate Matter)',
    pm10: 'PM10 (Respirable Particulate)',
    no2: 'Nitrogen Dioxide (NO₂)',
    so2: 'Sulphur Dioxide (SO₂)',
    co: 'Carbon Monoxide (CO)',
    o3: 'Ozone (O₃)',
  };

  const units: Record<string, string> = {
    pm25: 'µg/m³',
    pm10: 'µg/m³',
    no2: 'µg/m³',
    so2: 'µg/m³',
    co: 'mg/m³',
    o3: 'µg/m³',
  };

  return {
    pollutant,
    name: pollutantNames[pollutant] || pollutant.toUpperCase(),
    formula: `I = [(${iHi} - ${iLo}) / (${bHi} - ${bLo})] × (${safeConc.toFixed(1)} - ${bLo}) + ${iLo}`,
    concentration: safeConc,
    unit: units[pollutant] || 'µg/m³',
    subIndex,
    category: severity.label,
    color: severity.color,
    breakpoints: { bLo, bHi, iLo, iHi },
  };
}

/**
 * Returns matching severity band for a numerical AQI score
 */
export function getSeverityBand(aqi: number, standard: AQIStandard): SeverityBand {
  const bands = standard === 'CPCB' ? CPCB_SEVERITY_BANDS : EPA_SEVERITY_BANDS;
  for (const band of bands) {
    if (aqi >= band.min && aqi <= band.max) {
      return band;
    }
  }
  return bands[bands.length - 1];
}

/**
 * Computes overall AQI from a full pollutant concentration object
 * In CPCB NAQI: AQI = max(subIndices), where at least 3 pollutants (including PM10 or PM2.5) must be present.
 */
export function computeFullAQI(
  concentrations: PollutantConcentrations,
  standard: AQIStandard
): ComputedAQI {
  const pollutants: (keyof PollutantConcentrations)[] = [
    'pm25',
    'pm10',
    'no2',
    'so2',
    'co',
    'o3',
  ];

  const subIndices = pollutants.map((p) =>
    calculatePollutantSubIndex(p, concentrations[p] ?? 0, standard)
  );

  // Dominant pollutant is the one with highest sub-index
  let dominant = subIndices[0];
  for (const item of subIndices) {
    if (item.subIndex > dominant.subIndex) {
      dominant = item;
    }
  }

  const overallAQI = dominant.subIndex;
  const severity = getSeverityBand(overallAQI, standard);

  return {
    aqi: overallAQI,
    standard,
    category: severity.label,
    color: severity.color,
    dominantPollutant: dominant.name,
    subIndices,
    timestamp: new Date().toISOString(),
  };
}
