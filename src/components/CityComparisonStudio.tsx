/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AQIStandard, CityComparisonProfile } from '../types/aqi';
import { GitCompare, X, Wind, Thermometer, ShieldAlert } from 'lucide-react';
import { ComparativeHeatmapVisual } from './ComparativeHeatmapVisual';

interface CityComparisonStudioProps {
  standard: AQIStandard;
}

export const CityComparisonStudio: React.FC<CityComparisonStudioProps> = ({ standard }) => {
  // Pre-seed 3 diverse cities for immediate academic demonstration
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([
    'delhi-anand-vihar',
    'mumbai-bkc',
    'bengaluru-silk-board',
  ]);

  // Derived profiles with realistic comparative values
  const cityProfiles: CityComparisonProfile[] = [
    {
      id: 'delhi-anand-vihar',
      name: 'Delhi-NCR (Anand Vihar)',
      country: 'India',
      lat: 28.65,
      lon: 77.31,
      aqi: standard === 'CPCB' ? 245 : 210,
      standard,
      category: standard === 'CPCB' ? 'Poor' : 'Very Poor',
      dominantPollutant: 'PM2.5 (Fine Particulate)',
      pm25: 148,
      pm10: 230,
      no2: 52,
      so2: 18,
      co: 1.8,
      o3: 42,
      windSpeed: 7.2,
      temperature: 24,
      color: '#ea580c',
    },
    {
      id: 'mumbai-bkc',
      name: 'Mumbai (BKC Bandra)',
      country: 'India',
      lat: 19.06,
      lon: 72.86,
      aqi: standard === 'CPCB' ? 95 : 88,
      standard,
      category: standard === 'CPCB' ? 'Satisfactory' : 'Moderate',
      dominantPollutant: 'PM10 (Respirable)',
      pm25: 38,
      pm10: 95,
      no2: 38,
      so2: 14,
      co: 0.9,
      o3: 35,
      windSpeed: 18.4,
      temperature: 30,
      color: '#65a30d',
    },
    {
      id: 'bengaluru-silk-board',
      name: 'Bengaluru (Silk Board)',
      country: 'India',
      lat: 12.91,
      lon: 77.62,
      aqi: standard === 'CPCB' ? 72 : 65,
      standard,
      category: standard === 'CPCB' ? 'Satisfactory' : 'Moderate',
      dominantPollutant: 'NO₂ (Vehicle Corridor)',
      pm25: 32,
      pm10: 68,
      no2: 64,
      so2: 9,
      co: 1.1,
      o3: 28,
      windSpeed: 14.1,
      temperature: 23,
      color: '#65a30d',
    },
    {
      id: 'beijing-chaoyang',
      name: 'Beijing (Chaoyang)',
      country: 'China',
      lat: 39.9,
      lon: 116.4,
      aqi: standard === 'CPCB' ? 168 : 155,
      standard,
      category: standard === 'CPCB' ? 'Moderate' : 'Poor',
      dominantPollutant: 'PM2.5',
      pm25: 78,
      pm10: 135,
      no2: 48,
      so2: 12,
      co: 1.2,
      o3: 48,
      windSpeed: 11.5,
      temperature: 18,
      color: '#d97706',
    },
    {
      id: 'new-york-queens',
      name: 'New York (Queens)',
      country: 'United States',
      lat: 40.73,
      lon: -73.82,
      aqi: standard === 'CPCB' ? 38 : 40,
      standard,
      category: 'Good',
      dominantPollutant: 'Ozone',
      pm25: 12,
      pm10: 20,
      no2: 24,
      so2: 4,
      co: 0.5,
      o3: 42,
      windSpeed: 16.5,
      temperature: 17,
      color: '#16a34a',
    },
  ];

  const activeCities = cityProfiles.filter((c) => selectedCityIds.includes(c.id));
  const availableToAdd = cityProfiles.filter((c) => !selectedCityIds.includes(c.id));

  const removeCity = (id: string) => {
    if (selectedCityIds.length > 1) {
      setSelectedCityIds(selectedCityIds.filter((cid) => cid !== id));
    }
  };

  const addCity = (id: string) => {
    if (selectedCityIds.length < 4 && !selectedCityIds.includes(id)) {
      setSelectedCityIds([...selectedCityIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and City Selector */}
      <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <GitCompare className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">
              Comparative Urban Air Quality Studio
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Cross-city benchmarking across atmospheric indices, primary emission drivers, and wind ventilation
          </p>
        </div>

        {/* Add City quick dropdown if < 4 */}
        {selectedCityIds.length < 4 && availableToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">ADD NODE:</span>
            <select
              onChange={(e) => {
                if (e.target.value) addCity(e.target.value);
                e.target.value = '';
              }}
              defaultValue=""
              className="bg-[#090d17] text-xs text-slate-200 border border-slate-700 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 font-sans"
            >
              <option value="" disabled>
                Select urban node to compare...
              </option>
              {availableToAdd.map((c) => (
                <option key={c.id} value={c.id}>
                  + {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Comparative Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeCities.map((city) => (
          <div
            key={city.id}
            className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">{city.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{city.country}</span>
                </div>
                {selectedCityIds.length > 1 && (
                  <button
                    onClick={() => removeCity(city.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 rounded transition-colors"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Big AQI Score */}
              <div className="mt-3.5 p-3.5 bg-[#090d17] border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                    {standard === 'CPCB' ? 'Indian NAQI' : 'US EPA AQI'}
                  </div>
                  <div
                    className="text-3xl font-bold font-mono tabular-nums tracking-tight mt-0.5"
                    style={{ color: city.color }}
                  >
                    {city.aqi}
                  </div>
                </div>
                <div
                  className="px-2 py-0.5 text-xs font-semibold rounded font-mono"
                  style={{
                    backgroundColor: `${city.color}15`,
                    color: city.color,
                    border: `1px solid ${city.color}35`,
                  }}
                >
                  {city.category}
                </div>
              </div>

              {/* Dominant Pollutant */}
              <div className="mt-3 text-xs text-slate-400">
                Primary driver:{' '}
                <span className="font-semibold text-slate-200 font-mono text-[11px]">{city.dominantPollutant}</span>
              </div>

              {/* Pollutants Breakdown Table */}
              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400 pb-1 border-b border-slate-800 text-[10px] uppercase tracking-wider font-semibold">
                  <span>POLLUTANT</span>
                  <span>CONCENTRATION</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>PM2.5</span>
                  <span className="font-semibold tabular-nums">{city.pm25} µg/m³</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>PM10</span>
                  <span className="font-semibold tabular-nums">{city.pm10} µg/m³</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>NO₂</span>
                  <span className="font-semibold tabular-nums">{city.no2} µg/m³</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>CO</span>
                  <span className="font-semibold tabular-nums">{city.co} mg/m³</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>O₃</span>
                  <span className="font-semibold tabular-nums">{city.o3} µg/m³</span>
                </div>
              </div>
            </div>

            {/* Dispersion condition */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-blue-400" />
                <span>{city.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                <span>{city.temperature} °C</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 24-Hour Comparative Spatio-Temporal Heatmap */}
      <ComparativeHeatmapVisual cities={activeCities} standard={standard} />

      {/* Comparative Analysis Findings Box */}
      <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            Geographic & Meteorological Comparative Analysis
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          Coastal cities (such as Mumbai) benefit from active land-sea breeze circulation and higher wind speeds ({'>'}15 km/h), resulting in rapid horizontal atmospheric dispersion. Conversely, inland landlocked valleys (such as the Indo-Gangetic Plain in Delhi-NCR) frequently experience seasonal temperature inversions and stagnant winds (&lt;8 km/h), confining particulate matter (PM2.5) close to ground breathing zones.
        </p>
      </div>
    </div>
  );
};
