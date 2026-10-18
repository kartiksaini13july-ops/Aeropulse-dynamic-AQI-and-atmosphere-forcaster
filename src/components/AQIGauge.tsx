/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ComputedAQI } from '../types/aqi';
import { getSeverityBand } from '../services/aqiCalculator';
import { Sliders, RotateCcw, AlertTriangle, Activity } from 'lucide-react';

interface AQIGaugeProps {
  computedAQI: ComputedAQI;
  onSimulateAQI?: (simulatedVal: number) => void;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({ computedAQI }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedAqi, setSimulatedAqi] = useState<number>(computedAQI.aqi);

  const activeAqi = isSimulating ? simulatedAqi : computedAQI.aqi;
  const severity = getSeverityBand(activeAqi, computedAQI.standard);

  // SVG Gauge calculations (240-degree sweep from -120 deg to +120 deg)
  const radius = 80;
  const strokeWidth = 10;
  const normalizedValue = Math.min(500, Math.max(0, activeAqi));
  const percentage = normalizedValue / 500;

  const totalArcLength = (240 / 360) * 2 * Math.PI * radius;
  const activeArcLength = percentage * totalArcLength;
  const needleAngle = -120 + percentage * 240;

  return (
    <div className="relative flex flex-col items-center justify-between p-5 bg-[#0e1422] border border-slate-800 rounded-xl overflow-hidden h-full">
      {/* Top Header Mode Toggle */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
            Calibrated Index Dial
          </span>
        </div>

        <button
          onClick={() => {
            if (isSimulating) {
              setIsSimulating(false);
              setSimulatedAqi(computedAQI.aqi);
            } else {
              setIsSimulating(true);
              setSimulatedAqi(computedAQI.aqi);
            }
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
            isSimulating
              ? 'bg-amber-950 text-amber-300 border border-amber-600'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
          title="Toggle interactive What-If simulation mode"
        >
          <Sliders className="w-2.5 h-2.5" />
          <span>{isSimulating ? 'SIMULATOR ON' : 'SIMULATE'}</span>
        </button>
      </div>

      {/* Speedometer Radial Arc & Physical Needle */}
      <div className="relative w-64 h-48 flex items-center justify-center my-1">
        <svg viewBox="0 0 200 165" className="w-full h-full overflow-visible">
          {/* Background Track Arc */}
          <path
            d="M 30.7 135 A 80 80 0 1 1 169.3 135"
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Progress Sweep */}
          <path
            d="M 30.7 135 A 80 80 0 1 1 169.3 135"
            fill="none"
            stroke={severity.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${activeArcLength} ${totalArcLength}`}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />

          {/* Ticks around circumference */}
          {[0, 100, 200, 300, 400, 500].map((tickVal) => {
            const tickAngle = (-120 + (tickVal / 500) * 240) * (Math.PI / 180);
            const rOuter = 92;
            const rInner = 84;
            const x1 = 100 + Math.sin(tickAngle) * rOuter;
            const y1 = 100 - Math.cos(tickAngle) * rOuter;
            const x2 = 100 + Math.sin(tickAngle) * rInner;
            const y2 = 100 - Math.cos(tickAngle) * rInner;

            return (
              <line
                key={tickVal}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#475569"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Center Needle Indicator */}
          <g transform={`rotate(${needleAngle} 100 100)`} className="transition-transform duration-300 ease-out">
            <polygon
              points="98.5,100 101.5,100 100.5,32 99.5,32"
              fill={severity.color}
            />
            <circle cx="100" cy="100" r="6" fill="#0f172a" stroke={severity.color} strokeWidth="2" />
            <circle cx="100" cy="100" r="2.5" fill={severity.color} />
          </g>
        </svg>

        {/* Center Readout HUD */}
        <div className="absolute inset-0 top-12 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
            {computedAQI.standard === 'CPCB' ? 'Indian NAQI' : 'US EPA AQI'}
          </span>
          <span
            className="text-4xl font-bold font-mono tracking-tight tabular-nums transition-colors duration-300"
            style={{ color: severity.color }}
          >
            {activeAqi}
          </span>
          <div
            className="mt-1 px-2 py-0.5 text-[11px] font-semibold rounded font-mono"
            style={{
              backgroundColor: severity.bgColor,
              color: severity.textColor,
              border: `1px solid ${severity.borderColor}`,
            }}
          >
            {severity.label}
          </div>
        </div>
      </div>

      {/* Interactive Simulation Scrubber Slider (when active) */}
      {isSimulating ? (
        <div className="w-full mt-2 p-3 bg-slate-950/90 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-amber-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3" />
              <span>Interactive Scrubber:</span>
            </span>
            <span className="text-white font-bold tabular-nums">AQI {simulatedAqi}</span>
            <button
              onClick={() => setSimulatedAqi(computedAQI.aqi)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="5"
            value={simulatedAqi}
            onChange={(e) => setSimulatedAqi(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>0 Good</span>
            <span>100 Mod</span>
            <span>200 Poor</span>
            <span>300 V.Poor</span>
            <span>500 Severe</span>
          </div>
        </div>
      ) : (
        /* Dominant Pollutant & Standard Note */
        <div className="w-full text-center pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-300 font-mono">
            Primary Driver: <strong className="text-blue-400 font-semibold">{computedAQI.dominantPollutant}</strong>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
            {severity.description}
          </div>
        </div>
      )}
    </div>
  );
};
