import React, { useState, useMemo } from 'react';
import { HourlyAtmosphericPoint } from '../types/aqi';
import { GitCommit, Sparkles } from 'lucide-react';

interface PearsonCorrelationMatrixProps {
  dataPoints: HourlyAtmosphericPoint[];
  timeRangeLabel: string;
}

interface PollutantVariable {
  key: string;
  label: string;
  shortLabel: string;
  unit: string;
  getValue: (p: HourlyAtmosphericPoint) => number;
}

export const PearsonCorrelationMatrix: React.FC<PearsonCorrelationMatrixProps> = ({
  dataPoints,
  timeRangeLabel,
}) => {
  const variables: PollutantVariable[] = [
    { key: 'pm25', label: 'PM2.5', shortLabel: 'PM2.5', unit: 'µg/m³', getValue: (p) => p.pm25 },
    { key: 'pm10', label: 'PM10', shortLabel: 'PM10', unit: 'µg/m³', getValue: (p) => p.pm10 },
    { key: 'no2', label: 'NO₂', shortLabel: 'NO₂', unit: 'µg/m³', getValue: (p) => p.no2 },
    { key: 'so2', label: 'SO₂', shortLabel: 'SO₂', unit: 'µg/m³', getValue: (p) => p.so2 },
    { key: 'co', label: 'CO', shortLabel: 'CO', unit: 'mg/m³', getValue: (p) => p.co },
    { key: 'o3', label: 'Ozone', shortLabel: 'O₃', unit: 'µg/m³', getValue: (p) => p.o3 },
    { key: 'wind', label: 'Wind Speed', shortLabel: 'Wind', unit: 'km/h', getValue: (p) => p.windSpeed ?? 10 },
  ];

  // Selected pair for deep drill-down and scatter plot
  const [selectedPair, setSelectedPair] = useState<[number, number]>([0, 5]); // Defaults to PM2.5 vs Ozone

  // Pearson correlation calculation function
  const computePearsonR = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
    }
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const denominator = Math.sqrt(denX * denY);
    if (denominator === 0) return 0;
    return Math.max(-1, Math.min(1, numerator / denominator));
  };

  // Pre-calculate full correlation matrix
  const matrix = useMemo(() => {
    if (!dataPoints || dataPoints.length < 2) return [];

    const vectors = variables.map((v) => dataPoints.map((p) => v.getValue(p)));

    return variables.map((_, i) =>
      variables.map((_, j) => {
        if (i === j) return 1.0;
        return Number(computePearsonR(vectors[i], vectors[j]).toFixed(3));
      })
    );
  }, [dataPoints]);

  // Refined Color generator for correlation cell
  const getCellColor = (r: number) => {
    if (r === 1) return { bg: 'rgba(37, 99, 235, 0.15)', text: '#93c5fd', border: 'rgba(37, 99, 235, 0.35)' };
    if (r >= 0.7) return { bg: 'rgba(22, 163, 74, 0.2)', text: '#86efac', border: 'rgba(22, 163, 74, 0.4)' };
    if (r >= 0.3) return { bg: 'rgba(22, 163, 74, 0.1)', text: '#bbf7d0', border: 'rgba(22, 163, 74, 0.25)' };
    if (r > -0.3) return { bg: 'rgba(51, 65, 85, 0.2)', text: '#94a3b8', border: 'rgba(71, 85, 105, 0.3)' };
    if (r > -0.7) return { bg: 'rgba(217, 119, 6, 0.15)', text: '#fde68a', border: 'rgba(217, 119, 6, 0.3)' };
    return { bg: 'rgba(220, 38, 38, 0.2)', text: '#fca5a5', border: 'rgba(220, 38, 38, 0.4)' };
  };

  // Atmospheric mechanics explanation generator
  const getAtmosphericInsight = (varA: string, varB: string, r: number) => {
    const pairKey = [varA, varB].sort().join('-');

    if (pairKey === 'pm10-pm25') {
      return {
        title: 'High Collinearity & Shared Particulate Sources',
        desc: `Strong positive correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(2)}). PM2.5 is a physical sub-fraction of PM10. Both originate from vehicular combustion, construction dust, and road re-suspension under low atmospheric boundary layer mixing.`,
      };
    }
    if (pairKey === 'no2-o3') {
      return {
        title: 'Photochemical Titration & Anti-Correlation',
        desc: `Negative correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(2)}). Demonstrates the classic NO-NO₂-O₃ photostationary cycle. In high-traffic zones, fresh NO titration (NO + O₃ → NO₂ + O₂) depletes ambient ozone. Conversely, intense solar ultraviolet radiation converts NO₂ into secondary ground-level ozone during mid-day.`,
      };
    }
    if (pairKey.includes('wind')) {
      const other = varA === 'wind' ? varB : varA;
      return {
        title: `Meteorological Dilution & Ventilation Effect on ${other.toUpperCase()}`,
        desc: `Inverse correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(2)}). Demonstrates Gaussian atmospheric plume dispersion. High wind velocity (>15 km/h) promotes turbulent vertical mixing and advection, purging localized ground concentrations.`,
      };
    }
    if (pairKey === 'co-pm25' || pairKey === 'co-pm10') {
      return {
        title: 'Incomplete Combustion Signature',
        desc: `Positive correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(2)}). Both carbon monoxide and fine particulates stem from incomplete hydrocarbon oxidation in vehicle internal combustion engines and localized biomass incineration.`,
      };
    }
    if (pairKey === 'no2-pm25') {
      return {
        title: 'Urban Traffic & Industrial Axis',
        desc: `Positive correlation (r = ${r > 0 ? '+' : ''}${r.toFixed(2)}). Heavy diesel transport and thermal generators release NO₂ and primary fine aerosols concurrently along major transit corridors.`,
      };
    }

    return {
      title: `${varA.toUpperCase()} vs ${varB.toUpperCase()} Interaction`,
      desc: `${
        r > 0.4
          ? 'Positive linear coupling indicating shared emissions, secondary atmospheric formation pathways, or shared regional meteorology.'
          : r < -0.4
          ? 'Negative correlation indicating competitive photochemical consumption or opposing diurnal peak cycles.'
          : 'Weak or decoupled relationship indicating divergent emission sources and independent atmospheric lifetimes.'
      }`,
    };
  };

  const varX = variables[selectedPair[0]];
  const varY = variables[selectedPair[1]];
  const activeR = matrix.length ? matrix[selectedPair[0]][selectedPair[1]] : 0;
  const insight = getAtmosphericInsight(varX.key, varY.key, activeR);

  // Scatter Plot generation for the selected pair
  const scatterData = useMemo(() => {
    if (!dataPoints.length) return { points: [], minX: 0, maxX: 100, minY: 0, maxY: 100 };
    const pts = dataPoints.map((p) => ({
      x: varX.getValue(p),
      y: varY.getValue(p),
    }));

    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) || 1;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) || 1;

    return { points: pts, minX, maxX, minY, maxY };
  }, [dataPoints, varX, varY]);

  const scatterW = 320;
  const scatterH = 200;
  const scatterPad = 32;

  return (
    <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl shadow-sm space-y-5">
      {/* Matrix Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <GitCommit className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Pearson Correlation Coefficient Matrix (r)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Empirical multi-pollutant bivariate coupling calculated across {dataPoints.length} observation points ({timeRangeLabel})
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block shadow-sm" /> Pos (+0.7 to +1.0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block" /> Neutral (0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-600 inline-block shadow-sm" /> Neg (-1.0 to -0.3)
          </span>
        </div>
      </div>

      {/* Main Split: Left Matrix Heatmap Grid, Right Scatter Drilldown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Symmetric Heatmap Matrix Table */}
        <div className="lg:col-span-7 overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse select-none">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-400 font-semibold text-[11px]">Var</th>
                {variables.map((v) => (
                  <th key={v.key} className="p-2 text-center text-slate-300 font-bold text-[11px]">
                    {v.shortLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {variables.map((rowVar, i) => (
                <tr key={rowVar.key} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-2 font-bold text-slate-200 text-left whitespace-nowrap">
                    {rowVar.label}
                  </td>
                  {variables.map((colVar, j) => {
                    const r = matrix[i]?.[j] ?? 0;
                    const style = getCellColor(r);
                    const isSelected =
                      (selectedPair[0] === i && selectedPair[1] === j) ||
                      (selectedPair[0] === j && selectedPair[1] === i);

                    return (
                      <td
                        key={colVar.key}
                        onClick={() => setSelectedPair([i, j])}
                        className={`p-1.5 text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-sky-400 font-extrabold z-10 scale-105'
                            : 'hover:brightness-125'
                        }`}
                        title={`${rowVar.label} vs ${colVar.label}: r = ${r > 0 ? '+' : ''}${r.toFixed(3)}`}
                      >
                        <div
                          className="py-1.5 px-1 rounded-lg text-[11px] tabular-nums font-semibold"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {r === 1 ? '1.00' : (r > 0 ? `+${r.toFixed(2)}` : r.toFixed(2))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>* Click any matrix cell to inspect bivariate scatter plot and atmospheric mechanism</span>
            <span>r ∈ [-1.00, +1.00]</span>
          </div>
        </div>

        {/* Right: Selected Pair Regression Scatter Plot & Scientific Diagnostics */}
        <div className="lg:col-span-5 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-semibold">PAIRWISE COUPLING</div>
              <h4 className="text-sm font-bold text-white font-display">
                {varX.label} <span className="text-slate-500 font-normal">vs</span> {varY.label}
              </h4>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold font-mono tabular-nums" style={{ color: getCellColor(activeR).text }}>
                r = {activeR > 0 ? '+' : ''}{activeR.toFixed(3)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {Math.abs(activeR) >= 0.7
                  ? 'Strong Correlation'
                  : Math.abs(activeR) >= 0.3
                  ? 'Moderate Correlation'
                  : 'Weak / Decoupled'}
              </div>
            </div>
          </div>

          {/* Mini SVG Scatter Plot */}
          <div className="relative flex justify-center bg-[#090d17] rounded-lg p-2.5 border border-slate-800">
            <svg viewBox={`0 0 ${scatterW} ${scatterH}`} className="w-full h-44 overflow-visible">
              {/* Axes */}
              <line
                x1={scatterPad}
                y1={scatterH - scatterPad}
                x2={scatterW - 10}
                y2={scatterH - scatterPad}
                stroke="#334155"
                strokeWidth="1"
              />
              <line
                x1={scatterPad}
                y1={10}
                x2={scatterPad}
                y2={scatterH - scatterPad}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Axis Labels */}
              <text
                x={scatterW / 2}
                y={scatterH - 8}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {varX.shortLabel} ({varX.unit})
              </text>
              <text
                x={12}
                y={scatterH / 2}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                transform={`rotate(-90 12 ${scatterH / 2})`}
              >
                {varY.shortLabel} ({varY.unit})
              </text>

              {/* Scatter Points */}
              {scatterData.points.map((pt, idx) => {
                const rangeX = scatterData.maxX - scatterData.minX || 1;
                const rangeY = scatterData.maxY - scatterData.minY || 1;
                const cx = scatterPad + ((pt.x - scatterData.minX) / rangeX) * (scatterW - scatterPad - 15);
                const cy = (scatterH - scatterPad) - ((pt.y - scatterData.minY) / rangeY) * (scatterH - scatterPad - 15);

                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="2.5"
                    fill={activeR >= 0 ? '#3b82f6' : '#dc2626'}
                    opacity="0.65"
                  />
                );
              })}

              {/* Linear Trend Approximation Line */}
              {scatterData.points.length > 1 && (
                <line
                  x1={scatterPad}
                  y1={
                    activeR >= 0
                      ? scatterH - scatterPad - 10
                      : 20
                  }
                  x2={scatterW - 15}
                  y2={
                    activeR >= 0
                      ? 20
                      : scatterH - scatterPad - 10
                  }
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeDasharray="4, 4"
                />
              )}
            </svg>
          </div>

          {/* Scientific Atmospheric Mechanism */}
          <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 text-xs">
            <div className="font-semibold text-blue-400 flex items-center gap-1.5 mb-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{insight.title}</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              {insight.desc}
            </p>
          </div>

          {/* Formula Note */}
          <div className="p-2.5 bg-[#090d17] rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
            <div>PEARSON FORMULA:</div>
            <div className="text-slate-200 font-semibold mt-0.5">
              r = Σ[(X_i - X̄)(Y_i - Ȳ)] / √[Σ(X_i - X̄)² · Σ(Y_i - Ȳ)²]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
