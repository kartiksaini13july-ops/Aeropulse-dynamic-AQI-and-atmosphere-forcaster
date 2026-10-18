import React, { useState, useMemo } from 'react';
import { AQIStandard, HourlyAtmosphericPoint, StationFullData } from '../types/aqi';
import { BarChart2, Calendar, TrendingUp, TrendingDown, Wind, Clock } from 'lucide-react';
import { PearsonCorrelationMatrix } from './PearsonCorrelationMatrix';

interface TrendAnalysisViewProps {
  stationData: StationFullData;
  standard: AQIStandard;
}

export const TrendAnalysisView: React.FC<TrendAnalysisViewProps> = ({
  stationData,
  standard,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '3d' | '7d'>('3d');
  const [activePollutants, setActivePollutants] = useState<{
    aqi: boolean;
    pm25: boolean;
    pm10: boolean;
    no2: boolean;
    o3: boolean;
  }>({
    aqi: true,
    pm25: true,
    pm10: false,
    no2: false,
    o3: false,
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Combine history and forecast according to time range
  const filteredData = useMemo(() => {
    const history = stationData.hourlyHistory;
    const forecast = stationData.forecastHourly;

    if (timeRange === '24h') {
      const hist24 = history.slice(-24);
      const fore12 = forecast.slice(0, 12);
      return [...hist24, ...fore12];
    } else if (timeRange === '3d') {
      const hist48 = history.slice(-48);
      const fore24 = forecast.slice(0, 24);
      return [...hist48, ...fore24];
    } else {
      return [...history, ...forecast];
    }
  }, [stationData, timeRange]);

  // Compute Peak and Cleanest hours
  const stats = useMemo(() => {
    if (!filteredData.length) return null;

    let maxVal = -1;
    let maxPoint: HourlyAtmosphericPoint = filteredData[0];
    let minVal = 99999;
    let minPoint: HourlyAtmosphericPoint = filteredData[0];
    let sumPM25 = 0;

    filteredData.forEach((p) => {
      const aqi = standard === 'CPCB' ? p.aqiCPCB : p.aqiEPA;
      if (aqi > maxVal) {
        maxVal = aqi;
        maxPoint = p;
      }
      if (aqi < minVal) {
        minVal = aqi;
        minPoint = p;
      }
      sumPM25 += p.pm25;
    });

    const avgPM25 = Math.round(sumPM25 / filteredData.length);

    return {
      maxVal,
      maxPoint,
      minVal,
      minPoint,
      avgPM25,
    };
  }, [filteredData, standard]);

  // SVG Chart Dimensions
  const chartWidth = 900;
  const chartHeight = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // Max scale for y-axis
  const maxY = useMemo(() => {
    let highest = 200;
    filteredData.forEach((d) => {
      const aqi = standard === 'CPCB' ? d.aqiCPCB : d.aqiEPA;
      if (activePollutants.aqi) highest = Math.max(highest, aqi);
      if (activePollutants.pm25) highest = Math.max(highest, d.pm25);
      if (activePollutants.pm10) highest = Math.max(highest, d.pm10);
      if (activePollutants.no2) highest = Math.max(highest, d.no2);
      if (activePollutants.o3) highest = Math.max(highest, d.o3);
    });
    return Math.ceil((highest * 1.15) / 50) * 50;
  }, [filteredData, standard, activePollutants]);

  // Coordinate generators
  const getX = (idx: number) => {
    if (filteredData.length <= 1) return padding.left;
    return padding.left + (idx / (filteredData.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    return padding.top + graphHeight - (val / maxY) * graphHeight;
  };

  // Build SVG path strings
  const buildPath = (getValue: (p: HourlyAtmosphericPoint) => number) => {
    if (!filteredData.length) return '';
    return filteredData
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(getValue(p)).toFixed(1)}`)
      .join(' ');
  };

  const aqiPath = useMemo(
    () => buildPath((p) => (standard === 'CPCB' ? p.aqiCPCB : p.aqiEPA)),
    [filteredData, standard, maxY]
  );
  const pm25Path = useMemo(() => buildPath((p) => p.pm25), [filteredData, maxY]);
  const pm10Path = useMemo(() => buildPath((p) => p.pm10), [filteredData, maxY]);
  const no2Path = useMemo(() => buildPath((p) => p.no2), [filteredData, maxY]);
  const o3Path = useMemo(() => buildPath((p) => p.o3), [filteredData, maxY]);

  // Current hover data point
  const hoverPoint = hoverIndex !== null && filteredData[hoverIndex] ? filteredData[hoverIndex] : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#0e1422] border border-slate-800 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">
              Multi-Pollutant Timeline & Diurnal Dynamics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Hourly continuous atmospheric observations with 48h predictive dispersion forecast
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              timeRange === '24h' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setTimeRange('3d')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              timeRange === '3d' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 Days
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all ${
              timeRange === '7d' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 Days (Full)
          </button>
        </div>
      </div>

      {/* Analytical KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">PEAK CONCENTRATION SURGE</div>
              <div className="text-2xl font-bold font-mono text-rose-500 tabular-nums mt-0.5">
                AQI {stats.maxVal}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                {new Date(stats.maxPoint.time).toLocaleString([], {
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="w-9 h-9 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">CLEANEST VENTILATION WINDOW</div>
              <div className="text-2xl font-bold font-mono text-emerald-500 tabular-nums mt-0.5">
                AQI {stats.minVal}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                {new Date(stats.minPoint.time).toLocaleString([], {
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <div className="w-9 h-9 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">AVERAGE PM2.5 EXPOSURE</div>
              <div className="text-2xl font-bold font-mono text-amber-500 tabular-nums mt-0.5">
                {stats.avgPM25} <span className="text-xs text-slate-400 font-normal">µg/m³</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Regulatory Limit: 60 µg/m³
              </div>
            </div>
            <div className="w-9 h-9 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wind className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Chart Card */}
      <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl space-y-4 shadow-sm">
        {/* Series Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold mr-1">Plot Series:</span>
            <button
              onClick={() => setActivePollutants((p) => ({ ...p, aqi: !p.aqi }))}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl transition-all font-medium border ${
                activePollutants.aqi
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <span className="w-2.5 h-0.5 bg-sky-400 inline-block rounded" />
              <span>Overall AQI</span>
            </button>

            <button
              onClick={() => setActivePollutants((p) => ({ ...p, pm25: !p.pm25 }))}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl transition-all font-medium border ${
                activePollutants.pm25
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <span className="w-2.5 h-0.5 bg-amber-400 inline-block rounded" />
              <span>PM₂.₅</span>
            </button>

            <button
              onClick={() => setActivePollutants((p) => ({ ...p, pm10: !p.pm10 }))}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl transition-all font-medium border ${
                activePollutants.pm10
                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <span className="w-2.5 h-0.5 bg-orange-400 inline-block rounded" />
              <span>PM₁₀</span>
            </button>

            <button
              onClick={() => setActivePollutants((p) => ({ ...p, no2: !p.no2 }))}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl transition-all font-medium border ${
                activePollutants.no2
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <span className="w-2.5 h-0.5 bg-purple-400 inline-block rounded" />
              <span>NO₂</span>
            </button>

            <button
              onClick={() => setActivePollutants((p) => ({ ...p, o3: !p.o3 }))}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-xl transition-all font-medium border ${
                activePollutants.o3
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block rounded" />
              <span>Ozone (O₃)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Scrub timeline for crosshair inspection</span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[700px] cursor-crosshair select-none"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const svgX = ((e.clientX - rect.left) / rect.width) * chartWidth;
              const relativeX = svgX - padding.left;
              if (relativeX >= 0 && relativeX <= graphWidth && filteredData.length > 1) {
                const idx = Math.round((relativeX / graphWidth) * (filteredData.length - 1));
                setHoverIndex(Math.max(0, Math.min(filteredData.length - 1, idx)));
              }
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padding.top + graphHeight * (1 - pct);
              const val = Math.round(maxY * pct);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray={pct === 0 ? undefined : '3, 3'}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Time labels on X Axis */}
            {filteredData.map((d, i) => {
              const step = Math.ceil(filteredData.length / 8);
              if (i % step !== 0) return null;
              const x = getX(i);
              const dateObj = new Date(d.time);
              const label =
                timeRange === '24h'
                  ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:00`;

              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={padding.top + graphHeight}
                    x2={x}
                    y2={padding.top + graphHeight + 4}
                    stroke="#334155"
                  />
                  <text
                    x={x}
                    y={padding.top + graphHeight + 16}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Render Lines */}
            {activePollutants.pm10 && (
              <path d={pm10Path} fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.8" />
            )}
            {activePollutants.no2 && (
              <path d={no2Path} fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.8" />
            )}
            {activePollutants.o3 && (
              <path d={o3Path} fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.8" />
            )}
            {activePollutants.pm25 && (
              <path d={pm25Path} fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.9" />
            )}
            {activePollutants.aqi && (
              <path
                d={aqiPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Hover Hairline Crosshair */}
            {hoverIndex !== null && hoverPoint && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={padding.top}
                  x2={getX(hoverIndex)}
                  y2={padding.top + graphHeight}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2, 2"
                />
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(standard === 'CPCB' ? hoverPoint.aqiCPCB : hoverPoint.aqiEPA)}
                  r="5"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>

          {/* Hover HUD Telemetry Box */}
          {hoverPoint && hoverIndex !== null && (
            <div
              className="absolute top-2 pointer-events-none bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs font-mono backdrop-blur-xl"
              style={{
                left: `${Math.min(
                  chartWidth - 220,
                  Math.max(padding.left + 10, getX(hoverIndex) - 80)
                )}px`,
              }}
            >
              <div className="text-[10px] text-slate-400 mb-1.5 border-b border-slate-800 pb-1">
                {new Date(hoverPoint.time).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <span className="text-sky-400">
                  AQI: <strong>{standard === 'CPCB' ? hoverPoint.aqiCPCB : hoverPoint.aqiEPA}</strong>
                </span>
                <span className="text-amber-400">
                  PM2.5: <strong>{hoverPoint.pm25} µg</strong>
                </span>
                <span className="text-orange-400">
                  PM10: <strong>{hoverPoint.pm10} µg</strong>
                </span>
                <span className="text-purple-400">
                  NO₂: <strong>{hoverPoint.no2} µg</strong>
                </span>
                <span className="text-emerald-400">
                  O₃: <strong>{hoverPoint.o3} µg</strong>
                </span>
                <span className="text-slate-400">
                  Wind: <strong>{hoverPoint.windSpeed} km/h</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pearson Correlation Coefficient Matrix */}
      <PearsonCorrelationMatrix
        dataPoints={filteredData}
        timeRangeLabel={
          timeRange === '24h'
            ? 'Past 24 Hours'
            : timeRange === '3d'
            ? '3-Day Dynamic Window'
            : '7-Day Synoptic Observation Cycle'
        }
      />
    </div>
  );
};
