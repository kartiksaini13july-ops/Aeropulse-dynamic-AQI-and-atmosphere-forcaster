/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeatherTelemetry } from '../types/aqi';
import { Wind, Thermometer, Droplets, Sun, Compass } from 'lucide-react';

interface WeatherAtmosphericCardProps {
  weather: WeatherTelemetry;
}

export const WeatherAtmosphericCard: React.FC<WeatherAtmosphericCardProps> = ({ weather }) => {
  // Atmospheric dispersion condition analysis
  const getDispersionState = () => {
    if (weather.windSpeed < 5) {
      return {
        level: 'Stagnant Airflow',
        color: '#dc2626',
        bgColor: 'rgba(220, 38, 38, 0.12)',
        borderColor: 'rgba(220, 38, 38, 0.3)',
        tip: 'Low surface wind velocity (< 5 km/h) traps particulates in the nocturnal boundary layer, preventing dilution.',
      };
    } else if (weather.windSpeed < 15) {
      return {
        level: 'Moderate Dispersion',
        color: '#d97706',
        bgColor: 'rgba(217, 119, 6, 0.12)',
        borderColor: 'rgba(217, 119, 6, 0.3)',
        tip: 'Standard convective ventilation. Local neighborhood emissions dominate ambient sensor readings.',
      };
    } else {
      return {
        level: 'Active Ventilation',
        color: '#16a34a',
        bgColor: 'rgba(22, 163, 74, 0.12)',
        borderColor: 'rgba(22, 163, 74, 0.3)',
        tip: 'Strong horizontal advection (> 15 km/h) and turbulent eddies dilute ground-level aerosols efficiently.',
      };
    }
  };

  const dispersion = getDispersionState();

  return (
    <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Meteorological Telemetry & Dispersion
            </span>
          </div>

          <span
            className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
            style={{
              backgroundColor: dispersion.bgColor,
              color: dispersion.color,
              border: `1px solid ${dispersion.borderColor}`,
            }}
          >
            {dispersion.level}
          </span>
        </div>

        {/* 4-metric grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">Wind Velocity</span>
              <Wind className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {weather.windSpeed}{' '}
              <span className="text-xs font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Dir: {weather.windDirection ?? 240}° ({getCardinalDirection(weather.windDirection ?? 240)})
            </div>
          </div>

          <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">Temperature</span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {weather.temperature}{' '}
              <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Atmospheric Temp
            </div>
          </div>

          <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">Relative Humidity</span>
              <Droplets className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {weather.humidity}{' '}
              <span className="text-xs font-normal text-slate-400">%</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Hygroscopic Growth
            </div>
          </div>

          <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider">UV Solar Index</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {weather.uvIndex ?? 'N/A'}{' '}
              <span className="text-xs font-normal text-slate-400">UVI</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Photochemical Driver
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 text-[11px] text-slate-300 flex items-start gap-2 border-t border-slate-800">
        <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">{dispersion.tip}</span>
      </div>
    </div>
  );
};

function getCardinalDirection(angle: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 22.5) % 16;
  return directions[index];
}
