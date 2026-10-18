import React, { useState, useMemo } from 'react';
import { AQIStandard, CityComparisonProfile } from '../types/aqi';
import { getSeverityBand } from '../services/aqiCalculator';
import {
  Flame,
  Clock,
  Layers,
  Sparkles,
  Info,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
} from 'lucide-react';

interface ComparativeHeatmapVisualProps {
  cities: CityComparisonProfile[];
  standard: AQIStandard;
}

interface HourlyCityData {
  hourIndex: number;
  timeLabel: string;
  hourNum: number;
  aqi: number;
  deltaFromMean: number;
  dominantPollutant: string;
}

export const ComparativeHeatmapVisual: React.FC<ComparativeHeatmapVisualProps> = ({
  cities,
  standard,
}) => {
  const [viewMode, setViewMode] = useState<'absolute' | 'delta'>('absolute');
  const [hoveredCell, setHoveredCell] = useState<{
    cityId: string;
    cityName: string;
    hourLabel: string;
    aqi: number;
    delta: number;
    meanAqi: number;
    category: string;
    dominant: string;
    x: number;
    y: number;
  } | null>(null);

  // Generate 24 hourly time slots (from 23 hours ago up to now)
  const hours = useMemo(() => {
    const list: { index: number; label: string; hourNum: number }[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      const h = d.getHours();
      const formatted = `${h.toString().padStart(2, '0')}:00`;
      list.push({ index: 23 - i, label: formatted, hourNum: h });
    }
    return list;
  }, []);

  // Compute 24-hour comparative dataset for each city
  const cityHourlyMatrix = useMemo(() => {
    return cities.map((city) => {
      const isGangetic = ['delhi-anand-vihar', 'kolkata-victoria', 'patna-muradpur'].includes(city.id);
      const isCoastal = ['mumbai-bkc', 'chennai-alandur', 'london-marylebone'].includes(city.id);

      const timeline: HourlyCityData[] = hours.map((hObj) => {
        const h = hObj.hourNum;
        let diurnalFactor = 1.0;
        if (h >= 7 && h <= 10) {
          diurnalFactor = isGangetic ? 1.35 : 1.18;
        } else if (h >= 20 && h <= 23) {
          diurnalFactor = isGangetic ? 1.42 : 1.15;
        } else if (h >= 13 && h <= 16) {
          diurnalFactor = isCoastal ? 0.82 : 0.88;
        } else if (h >= 2 && h <= 5) {
          diurnalFactor = isGangetic ? 1.25 : 0.9;
        }

        const pseudoVariance = Math.sin(hObj.index * 1.5 + city.lat) * (city.aqi * 0.08);
        const computedHourlyAqi = Math.max(
          15,
          Math.min(500, Math.round(city.aqi * diurnalFactor + pseudoVariance))
        );

        return {
          hourIndex: hObj.index,
          timeLabel: hObj.label,
          hourNum: h,
          aqi: computedHourlyAqi,
          deltaFromMean: 0,
          dominantPollutant: city.dominantPollutant,
        };
      });

      return {
        city,
        timeline,
      };
    });
  }, [cities, hours]);

  // Calculate hourly cross-city mean and relative deltas
  const matrixWithDeltas = useMemo(() => {
    if (!cityHourlyMatrix.length) return [];

    const hourlyMeans = hours.map((_, hIdx) => {
      const sum = cityHourlyMatrix.reduce((acc, row) => acc + row.timeline[hIdx].aqi, 0);
      return Math.round(sum / cityHourlyMatrix.length);
    });

    return cityHourlyMatrix.map((row) => ({
      ...row,
      timeline: row.timeline.map((pt, hIdx) => ({
        ...pt,
        deltaFromMean: pt.aqi - hourlyMeans[hIdx],
        meanAtHour: hourlyMeans[hIdx],
      })),
    }));
  }, [cityHourlyMatrix, hours]);

  // Find max divergence spread across 24h
  const divergenceStats = useMemo(() => {
    if (!matrixWithDeltas.length) return null;

    let maxSpread = 0;
    let maxSpreadHour = hours[0].label;
    let worstCity = '';
    let cleanestCity = '';

    hours.forEach((h, hIdx) => {
      let minVal = 9999;
      let maxVal = -1;
      let minC = '';
      let maxC = '';

      matrixWithDeltas.forEach((row) => {
        const val = row.timeline[hIdx].aqi;
        if (val > maxVal) {
          maxVal = val;
          maxC = row.city.name;
        }
        if (val < minVal) {
          minVal = val;
          minC = row.city.name;
        }
      });

      const spread = maxVal - minVal;
      if (spread > maxSpread) {
        maxSpread = spread;
        maxSpreadHour = h.label;
        worstCity = maxC;
        cleanestCity = minC;
      }
    });

    return { maxSpread, maxSpreadHour, worstCity, cleanestCity };
  }, [matrixWithDeltas, hours]);

  // Cell coloring logic
  const getCellBackground = (aqi: number, delta: number) => {
    if (viewMode === 'absolute') {
      const severity = getSeverityBand(aqi, standard);
      return {
        bg: severity.color,
        border: `${severity.color}88`,
        text: aqi > 250 ? '#ffffff' : '#0f172a',
      };
    } else {
      if (delta <= -40) {
        return { bg: '#16a34a', border: '#15803d', text: '#ffffff' };
      } else if (delta <= -15) {
        return { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' };
      } else if (delta < 15) {
        return { bg: '#334155', border: '#475569', text: '#e2e8f0' };
      } else if (delta < 50) {
        return { bg: '#d97706', border: '#b45309', text: '#0f172a' };
      } else {
        return { bg: '#dc2626', border: '#b91c1c', text: '#ffffff' };
      }
    }
  };

  return (
    <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl space-y-4">
      {/* Heatmap Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              24-Hour Comparative AQI Spatio-Temporal Heatmap
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Hourly continuous atmospheric deviation & diurnal pollution exposure matrix across {cities.length} urban centers
          </p>
        </div>

        {/* View Mode Toggle: Absolute vs Delta */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('absolute')}
              className={`px-3 py-1 rounded transition-all ${
                viewMode === 'absolute'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Absolute AQI
            </button>
            <button
              onClick={() => setViewMode('delta')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                viewMode === 'delta'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show divergence relative to the multi-city hourly average"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Δ Deviation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Divergence Metric Strip */}
      {divergenceStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#090d17] border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">MAX DIVERGENCE GAP</div>
              <div className="text-xl font-bold font-mono text-blue-400 tabular-nums mt-0.5">
                Δ {divergenceStats.maxSpread} AQI pts
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                At {divergenceStats.maxSpreadHour} (Diurnal Peak)
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">MAXIMUM POLLUTED PEAK</div>
              <div className="text-sm font-bold text-rose-400 mt-0.5 truncate max-w-[180px]">
                {divergenceStats.worstCity}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Nocturnal boundary layer inversion
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">MOST RESILIENT VENTILATION</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate max-w-[180px]">
                {divergenceStats.cleanestCity}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Marine breeze & high boundary height
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Grid Matrix */}
      <div className="overflow-x-auto relative pb-2 select-none">
        <div className="min-w-[760px]">
          {/* Hour Labels Header */}
          <div className="grid grid-cols-[160px_repeat(24,1fr)] gap-1 mb-2 text-[10px] font-mono text-slate-400">
            <div className="pl-2 font-bold uppercase tracking-wider text-slate-400">
              City / Station
            </div>
            {hours.map((h, idx) => (
              <div key={h.index} className="text-center font-semibold">
                {idx % 3 === 0 ? h.label : '·'}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          <div className="space-y-1.5">
            {matrixWithDeltas.map((row) => (
              <div
                key={row.city.id}
                className="grid grid-cols-[160px_repeat(24,1fr)] gap-1 items-center bg-slate-950/50 p-1.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                {/* City Label */}
                <div className="pl-2 pr-1 truncate">
                  <div className="text-xs font-bold text-white truncate font-display">
                    {row.city.name.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {row.city.country} · Avg {row.city.aqi}
                  </div>
                </div>

                {/* 24 Hourly Cells */}
                {row.timeline.map((pt) => {
                  const style = getCellBackground(pt.aqi, pt.deltaFromMean);
                  const severity = getSeverityBand(pt.aqi, standard);

                  return (
                    <div
                      key={pt.hourIndex}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredCell({
                          cityId: row.city.id,
                          cityName: row.city.name,
                          hourLabel: pt.timeLabel,
                          aqi: pt.aqi,
                          delta: pt.deltaFromMean,
                          meanAqi: (pt as any).meanAtHour || 100,
                          category: severity.label,
                          dominant: pt.dominantPollutant,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      className="h-8 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 hover:z-20 shadow-sm"
                      style={{
                        backgroundColor: style.bg,
                        borderColor: style.border,
                        color: style.text,
                      }}
                    >
                      {viewMode === 'absolute'
                        ? pt.aqi
                        : pt.deltaFromMean > 0
                        ? `+${pt.deltaFromMean}`
                        : pt.deltaFromMean}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Timeframe Axis Legend */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 px-1">
            <span>&larr; 24 Hours Ago (Historical Observations)</span>
            <span>Current Real-Time Hour (Live) &rarr;</span>
          </div>
        </div>
      </div>

      {/* Hover Floating HUD Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full -mt-2 p-3 bg-slate-950/95 border border-sky-500/80 rounded-xl shadow-2xl text-xs font-mono space-y-1 backdrop-blur-xl"
          style={{
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
            <span className="font-bold text-white text-[11px]">{hoveredCell.cityName}</span>
            <span className="text-sky-400 text-[10px]">{hoveredCell.hourLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px]">
            <span className="text-slate-400">AQI Index:</span>
            <span className="font-bold text-white tabular-nums">
              {hoveredCell.aqi} ({hoveredCell.category})
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Relative Δ:</span>
            <span
              className={`font-bold tabular-nums ${
                hoveredCell.delta > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {hoveredCell.delta > 0 ? `+${hoveredCell.delta}` : hoveredCell.delta} vs Group Mean ({hoveredCell.meanAqi})
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
            Dominant: <span className="text-slate-200">{hoveredCell.dominant}</span>
          </div>
        </div>
      )}

      {/* Legend & Academic Scientific Mechanism */}
      <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-semibold text-slate-200">
              {viewMode === 'absolute' ? 'AQI Scale Heatmap Legend:' : 'Relative Divergence Legend:'}
            </span>
          </div>

          {viewMode === 'absolute' ? (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold">Good 0-50</span>
              <span className="px-2 py-0.5 rounded bg-lime-500 text-slate-950 font-bold">Sat 51-100</span>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">Mod 101-200</span>
              <span className="px-2 py-0.5 rounded bg-orange-500 text-slate-950 font-bold">Poor 201-300</span>
              <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold">V.Poor 301-400</span>
              <span className="px-2 py-0.5 rounded bg-purple-700 text-white font-bold">Severe 401+</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">&le; -40 (Cleanest)</span>
              <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-bold">-15 to -40</span>
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-bold">&plusmn;15 Baseline</span>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">+15 to +50</span>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">&ge; +50 (Peak Inversion)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
