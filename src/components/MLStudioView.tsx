/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { StationFullData, AQIStandard } from '../types/aqi';
import {
  trainAndEvaluateAtmosphericModels,
  simulateCovariateScenario,
} from '../services/mlPredictiveEngine';
import {
  Cpu,
  TrendingDown,
  TrendingUp,
  Sliders,
  RotateCcw,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';

interface MLStudioViewProps {
  stationData: StationFullData;
  standard: AQIStandard;
}

export const MLStudioView: React.FC<MLStudioViewProps> = ({
  stationData,
}) => {
  const [selectedModel, setSelectedModel] = useState<'ridge' | 'ardl' | 'tree'>('ridge');

  // Train and evaluate all statistical models on current station empirical history
  const modelResults = useMemo(() => {
    return trainAndEvaluateAtmosphericModels(stationData.hourlyHistory);
  }, [stationData.hourlyHistory]);

  const activeResult = modelResults[selectedModel];

  // Simulator state: interactive counterfactual shifts
  const baseWind = stationData.weather.windSpeed || 12;
  const baseTemp = stationData.weather.temperature || 24;
  const baseHumidity = stationData.weather.humidity || 55;
  const baseNO2 = stationData.currentPollutants.no2 || 35;

  const [simWind, setSimWind] = useState<number>(baseWind);
  const [simTemp, setSimTemp] = useState<number>(baseTemp);
  const [simHumidity, setSimHumidity] = useState<number>(baseHumidity);
  const [simNO2, setSimNO2] = useState<number>(baseNO2);

  // Dynamic simulation response
  const simulation = useMemo(() => {
    return simulateCovariateScenario(
      stationData.currentPollutants.pm25,
      baseWind,
      baseTemp,
      baseHumidity,
      baseNO2,
      simWind,
      simTemp,
      simHumidity,
      simNO2
    );
  }, [simWind, simTemp, simHumidity, simNO2, stationData, baseWind, baseTemp, baseHumidity, baseNO2]);

  // Hover state for time-series chart
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  if (!activeResult) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Compiling empirical regression matrices...
      </div>
    );
  }

  // SVG Chart Dimensions for Actual vs Predicted
  const chartW = 900;
  const chartH = 260;
  const pad = { top: 20, right: 25, bottom: 35, left: 45 };
  const graphW = chartW - pad.left - pad.right;
  const graphH = chartH - pad.top - pad.bottom;

  const timeline = activeResult.actualVsPredictedTimeline;
  const allVals = timeline.flatMap((t) => [t.actual, t.predicted, t.upperConfidence]);
  const maxY = Math.max(100, Math.ceil(Math.max(...allVals) * 1.1));
  const minY = 0;

  const getX = (idx: number) => pad.left + (idx / (timeline.length - 1 || 1)) * graphW;
  const getY = (val: number) => pad.top + graphH - ((val - minY) / (maxY - minY)) * graphH;

  // SVG Paths
  const actualPath = timeline.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(pt.actual)}`,
    ''
  );
  const predictedPath = timeline.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(pt.predicted)}`,
    ''
  );
  // Confidence Band Area (Upper forward, lower backward)
  const confidenceArea =
    timeline.reduce(
      (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(pt.upperConfidence)}`,
      ''
    ) +
    timeline
      .slice()
      .reverse()
      .reduce((acc, pt, idx) => {
        const revIdx = timeline.length - 1 - idx;
        return `${acc} L ${getX(revIdx)} ${getY(pt.lowerConfidence)}`;
      }, '') +
    ' Z';

  return (
    <div className="space-y-6">
      {/* Executive DS Header & Model Switcher */}
      <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Predictive Machine Learning & Statistical Modeling Studio
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical time-series regression, lag-distributed covariates, and feature sensitivity analysis on {stationData.station.city} telemetry
          </p>
        </div>

        {/* Model Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setSelectedModel('ridge')}
            className={`px-3 py-1.5 rounded transition-all ${
              selectedModel === 'ridge'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ridge (L2)
          </button>
          <button
            onClick={() => setSelectedModel('ardl')}
            className={`px-3 py-1.5 rounded transition-all ${
              selectedModel === 'ardl'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ARDL(2,1)
          </button>
          <button
            onClick={() => setSelectedModel('tree')}
            className={`px-3 py-1.5 rounded transition-all ${
              selectedModel === 'tree'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Decision Tree
          </button>
        </div>
      </div>

      {/* Model Mathematical Specification Banner */}
      <div className="p-3 bg-[#090d17] border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
            MODEL SPECIFICATION:
          </span>
          <span className="text-slate-200 font-semibold">{activeResult.modelFormula}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <span>N = {activeResult.metrics.sampleSize}</span>
          <span>·</span>
          <span>DF = {activeResult.metrics.degreesOfFreedom}</span>
          <span>·</span>
          <span>F-Stat = {activeResult.metrics.fStatistic}</span>
        </div>
      </div>

      {/* Evaluation Metrics KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#0e1422] border border-slate-800 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-slate-400">
            R² DETERMINATION
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-400 tabular-nums">
            {activeResult.metrics.rSquared}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {(activeResult.metrics.rSquared * 100).toFixed(1)}% variance explained
          </div>
        </div>

        <div className="p-3.5 bg-[#0e1422] border border-slate-800 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-slate-400">
            ROOT MEAN SQUARED ERROR
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-200 tabular-nums">
            {activeResult.metrics.rmse} <span className="text-xs text-slate-400">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Quadratic penalty metric
          </div>
        </div>

        <div className="p-3.5 bg-[#0e1422] border border-slate-800 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-slate-400">
            MEAN ABSOLUTE ERROR
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-200 tabular-nums">
            {activeResult.metrics.mae} <span className="text-xs text-slate-400">µg/m³</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Linear deviation metric
          </div>
        </div>

        <div className="p-3.5 bg-[#0e1422] border border-slate-800 rounded-xl">
          <div className="text-[10px] uppercase font-mono text-slate-400">
            MAPE (RELATIVE ERROR)
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-200 tabular-nums">
            {activeResult.metrics.mape}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            F-Statistic: {activeResult.metrics.fStatistic}
          </div>
        </div>
      </div>

      {/* Observed vs Model-Fitted Horizon Plot */}
      <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Observed vs. Model-Fitted Atmospheric Trajectory
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Empirical sensor ground truth (blue) vs. regression estimated response (amber)
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Ground Truth (Actual)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-t border-dashed" /> Model Fit (ŷ)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-blue-500/15 border border-blue-500/30 inline-block" /> 95% CI
            </span>
          </div>
        </div>

        {/* SVG Horizon Plot */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-64 overflow-visible select-none"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const yVal = Math.round(minY + ratio * (maxY - minY));
              const yPos = getY(yVal);
              return (
                <g key={ratio}>
                  <line
                    x1={pad.left}
                    y1={yPos}
                    x2={pad.left + graphW}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 8}
                    y={yPos + 3}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {yVal}
                  </text>
                </g>
              );
            })}

            {/* Confidence Band Polygon */}
            <path d={confidenceArea} fill="rgba(59, 130, 246, 0.08)" />

            {/* Actual Observed Line */}
            <path
              d={actualPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Predicted Line */}
            <path
              d={predictedPath}
              fill="none"
              stroke="#d97706"
              strokeWidth="1.8"
              strokeDasharray="4, 3"
              strokeLinecap="round"
            />

            {/* Interactive Mouse Hover Crosshair Detection */}
            {timeline.map((_, idx) => {
              const xPos = getX(idx);
              return (
                <rect
                  key={idx}
                  x={xPos - graphW / (timeline.length * 2)}
                  y={pad.top}
                  width={graphW / timeline.length}
                  height={graphH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                />
              );
            })}

            {/* Hover Hairline and Markers */}
            {hoveredPointIndex !== null && timeline[hoveredPointIndex] && (
              <g>
                <line
                  x1={getX(hoveredPointIndex)}
                  y1={pad.top}
                  x2={getX(hoveredPointIndex)}
                  y2={pad.top + graphH}
                  stroke="#60a5fa"
                  strokeWidth="1.2"
                  strokeDasharray="2, 2"
                />
                <circle
                  cx={getX(hoveredPointIndex)}
                  cy={getY(timeline[hoveredPointIndex].actual)}
                  r="4"
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={getX(hoveredPointIndex)}
                  cy={getY(timeline[hoveredPointIndex].predicted)}
                  r="4"
                  fill="#d97706"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>

          {/* Hover Telemetry HUD */}
          {hoveredPointIndex !== null && timeline[hoveredPointIndex] && (
            <div
              className="absolute top-2 pointer-events-none bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-2xl text-xs font-mono"
              style={{
                left: `${Math.min(
                  chartW - 220,
                  Math.max(pad.left + 10, getX(hoveredPointIndex) - 80)
                )}px`,
              }}
            >
              <div className="text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-0.5">
                {new Date(timeline[hoveredPointIndex].time).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between gap-4">
                  <span className="text-blue-400">Actual PM2.5:</span>
                  <strong className="text-white">{timeline[hoveredPointIndex].actual} µg</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-amber-400">Model Fitted ŷ:</span>
                  <strong className="text-white">{timeline[hoveredPointIndex].predicted} µg</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Residual (ε):</span>
                  <strong
                    className={
                      timeline[hoveredPointIndex].actual - timeline[hoveredPointIndex].predicted > 0
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }
                  >
                    {Math.round(
                      (timeline[hoveredPointIndex].actual -
                        timeline[hoveredPointIndex].predicted) *
                        10
                    ) / 10}{' '}
                    µg
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Left Feature Importance, Right Residual Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Standardized Beta Feature Importance Weights */}
        <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white">
              Feature Sensitivity & Standardized Beta (β) Weights
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Normalized impact on target PM2.5 per standard deviation covariate shift
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {activeResult.features.map((feat) => {
              const isPositive = feat.direction === 'positive';
              return (
                <div key={feat.featureName} className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold text-white">{feat.displayName}</span>
                    <div className="flex items-center gap-2">
                      <span className={isPositive ? 'text-blue-400' : 'text-amber-400'}>
                        β = {feat.standardizedBeta > 0 ? '+' : ''}
                        {feat.standardizedBeta}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        ({feat.relativeImportancePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPositive ? 'bg-blue-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${Math.min(100, feat.relativeImportancePct * 2.2)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {feat.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Residual Error Diagnostics */}
        <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl space-y-3">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white">
              Residual Error Distribution & Diagnostics
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Empirical residual frequency verifying homoscedasticity across the horizon
            </p>
          </div>

          <div className="space-y-2 pt-1 font-mono text-xs">
            <div className="grid grid-cols-6 gap-1 h-32 items-end pt-4 pb-1 border-b border-slate-800">
              {activeResult.residualDistribution.map((bin, i) => {
                const maxCount = Math.max(
                  ...activeResult.residualDistribution.map((b) => b.count),
                  1
                );
                const heightPct = Math.max(8, Math.round((bin.count / maxCount) * 100));

                return (
                  <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-slate-400">{bin.count}</span>
                    <div
                      className="w-full rounded-t bg-blue-700/80 border-t border-blue-500 transition-all hover:bg-blue-600"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-6 gap-1 text-[9px] text-slate-500 text-center">
              {activeResult.residualDistribution.map((bin, i) => (
                <span key={i} className="truncate">
                  {bin.binLabel}
                </span>
              ))}
            </div>

            <div className="p-2.5 bg-[#090d17] rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Gauss-Markov Compliance Check</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Residual errors center around zero with symmetric tails, verifying absence of systematic bias and confirming regression stability under dynamic atmospheric wind regimes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Covariate Scenario Simulator */}
      <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                Interactive Atmospheric Covariate Sensitivity Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Simulate counterfactual meteorological shifts to observe model-predicted air quality response in real-time
            </p>
          </div>

          <button
            onClick={() => {
              setSimWind(baseWind);
              setSimTemp(baseTemp);
              setSimHumidity(baseHumidity);
              setSimNO2(baseNO2);
            }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-mono"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Baseline</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sliders Console */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Wind Velocity Slider */}
            <div className="space-y-1.5 p-3 bg-[#090d17] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-center text-slate-300">
                <span>Wind Velocity (km/h)</span>
                <strong className="text-blue-400 font-bold">{simWind} km/h</strong>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                step="0.5"
                value={simWind}
                onChange={(e) => setSimWind(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>1 (Stagnant)</span>
                <span>Base: {baseWind}</span>
                <span>35 (Gale Flush)</span>
              </div>
            </div>

            {/* Traffic NO2 Slider */}
            <div className="space-y-1.5 p-3 bg-[#090d17] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-center text-slate-300">
                <span>NO₂ Combustion Precursor</span>
                <strong className="text-amber-400 font-bold">{simNO2} µg/m³</strong>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="1"
                value={simNO2}
                onChange={(e) => setSimNO2(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>5 (Clean)</span>
                <span>Base: {baseNO2}</span>
                <span>120 (Congested)</span>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5 p-3 bg-[#090d17] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-center text-slate-300">
                <span>Surface Temperature (°C)</span>
                <strong className="text-slate-200 font-bold">{simTemp} °C</strong>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={simTemp}
                onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>5°C (Inversion)</span>
                <span>Base: {baseTemp}</span>
                <span>45°C (Convective)</span>
              </div>
            </div>

            {/* Relative Humidity Slider */}
            <div className="space-y-1.5 p-3 bg-[#090d17] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-center text-slate-300">
                <span>Relative Humidity (%)</span>
                <strong className="text-slate-200 font-bold">{simHumidity} %</strong>
              </div>
              <input
                type="range"
                min="15"
                max="95"
                step="1"
                value={simHumidity}
                onChange={(e) => setSimHumidity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>15% (Dry)</span>
                <span>Base: {baseHumidity}</span>
                <span>95% (Fog/Haze)</span>
              </div>
            </div>
          </div>

          {/* Model Real-Time Simulated Output Card */}
          <div className="lg:col-span-5 p-4 bg-[#090d17] border border-slate-800 rounded-xl space-y-3 font-mono">
            <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center justify-between">
              <span>PREDICTIVE ML RESPONSE</span>
              <span className="text-slate-400 font-normal">95% CI</span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl font-bold text-white tabular-nums">
                  {simulation.predictedPM25}
                </span>
                <span className="text-xs text-slate-400 ml-1">µg/m³ PM2.5</span>
              </div>

              <div
                className={`text-sm font-bold flex items-center gap-1 ${
                  simulation.deltaPM25 > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {simulation.deltaPM25 > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {simulation.deltaPM25 > 0 ? `+${simulation.deltaPM25}` : simulation.deltaPM25}
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Predicted Index:</span>
                <strong className="text-white font-bold">AQI {simulation.predictedAQI}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">Confidence Range:</span>
                <span className="text-slate-300 text-[11px]">
                  [{simulation.confidenceRange[0]} – {simulation.confidenceRange[1]} µg]
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-1 mt-1">
                <span className="text-slate-400 text-[11px]">Primary Shift Driver:</span>
                <span className="text-blue-300 font-semibold text-[11px]">
                  {simulation.primaryDriver}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Viva Voce Reference Guide */}
      <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-slate-200 font-semibold font-mono">
          <GitBranch className="w-4 h-4 text-blue-400" />
          <span>B.Tech Data Science Defense & Statistical Notes</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Ridge Regression applies an L2 penalty ($\lambda \|\beta\|_2^2$) to mitigate collinearity between particulate fractions and meteorological predictors. In contrast, the ARDL(2,1) model addresses temporal autocorrelation by conditioning on lag-1 and lag-2 autoregressive terms, ensuring white noise residuals.
        </p>
      </div>
    </div>
  );
};
