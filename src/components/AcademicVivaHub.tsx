/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AQIStandard, StationFullData } from '../types/aqi';
import { calculatePollutantSubIndex, CPCB_BREAKPOINTS, EPA_BREAKPOINTS } from '../services/aqiCalculator';
import { Download, Calculator, Table, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface AcademicVivaHubProps {
  stationData: StationFullData;
  standard: AQIStandard;
}

export const AcademicVivaHub: React.FC<AcademicVivaHubProps> = ({
  stationData,
  standard,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'breakpoints' | 'export' | 'viva'>('calculator');

  // Interactive Live Calculator State
  const [testPollutant, setTestPollutant] = useState<'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3'>('pm25');
  const [testConcentration, setTestConcentration] = useState<number>(115);

  const calculatedSubIndex = calculatePollutantSubIndex(
    testPollutant,
    testConcentration,
    standard
  );

  const { bLo, bHi, iLo, iHi } = calculatedSubIndex.breakpoints;
  const deltaB = bHi - bLo;
  const deltaI = iHi - iLo;
  const clampedC = Math.min(Math.max(testConcentration, bLo), bHi);
  const slope = deltaI / deltaB;
  const result = Math.round(slope * (clampedC - bLo) + iLo);

  // CSV Generation Function
  const handleExportCSV = () => {
    const headers = [
      'timestamp_iso',
      'station_id',
      'city',
      'country',
      'latitude',
      'longitude',
      'pm25_ug_m3',
      'pm10_ug_m3',
      'no2_ug_m3',
      'so2_ug_m3',
      'co_mg_m3',
      'o3_ug_m3',
      'aqi_cpcb_index',
      'aqi_epa_index',
      'wind_speed_kmh',
      'temperature_c',
      'humidity_pct',
    ];

    const allPoints = [...stationData.hourlyHistory, ...stationData.forecastHourly];

    const rows = allPoints.map((p) => [
      `"${p.time}"`,
      `"${stationData.station.id}"`,
      `"${stationData.station.city}"`,
      `"${stationData.station.country}"`,
      stationData.station.lat,
      stationData.station.lon,
      p.pm25,
      p.pm10,
      p.no2,
      p.so2,
      p.co,
      p.o3,
      p.aqiCPCB,
      p.aqiEPA,
      p.windSpeed ?? 0,
      p.temperature ?? 0,
      p.humidity ?? 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `aeropulse_${stationData.station.city.toLowerCase().replace(/[^a-z0-9]/g, '_')}_aqi_dataset.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Sub-header & Navigation Tabs */}
      <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <Calculator className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">
              B.Tech Academic Evaluation & Scientific Formula Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Mathematical sub-indexing verification, linear interpolation step-through, and laboratory dataset export
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded transition-all font-medium ${
              activeTab === 'calculator' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Formula Step-Through
          </button>
          <button
            onClick={() => setActiveTab('breakpoints')}
            className={`px-3 py-1.5 rounded transition-all font-medium ${
              activeTab === 'breakpoints' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Breakpoint Matrices
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded transition-all font-medium ${
              activeTab === 'export' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CSV Data Export
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`px-3 py-1.5 rounded transition-all font-medium ${
              activeTab === 'viva' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Viva Q&A Notes
          </button>
        </div>
      </div>

      {/* Tab 1: Live Interactive Formula Step-Through */}
      {activeTab === 'calculator' && (
        <div className="space-y-4">
          <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Standard Linear Interpolation Equation</span>
              <span className="text-xs font-mono text-blue-400 font-normal">
                ({standard === 'CPCB' ? 'Indian MoEFCC / CPCB Protocol' : 'US EPA 40 CFR 58 Appendix G'})
              </span>
            </h3>

            {/* LaTeX-style formula block */}
            <div className="p-4 bg-[#090d17] border border-slate-800 rounded-lg text-center font-mono text-sm sm:text-base text-blue-300">
              {'I_p = \\left[ \\frac{I_{hi} - I_{lo}}{B_{hi} - B_{lo}} \\right] \\times (C_p - B_{lo}) + I_{lo}'}
            </div>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Select Target Pollutant:
                </label>
                <select
                  value={testPollutant}
                  onChange={(e) => setTestPollutant(e.target.value as any)}
                  className="w-full bg-[#090d17] text-xs text-slate-200 border border-slate-700 rounded px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value="pm25">PM2.5 - Fine Particulate Matter (µg/m³)</option>
                  <option value="pm10">PM10 - Respirable Particulate Matter (µg/m³)</option>
                  <option value="no2">NO₂ - Nitrogen Dioxide (µg/m³)</option>
                  <option value="so2">SO₂ - Sulphur Dioxide (µg/m³)</option>
                  <option value="co">CO - Carbon Monoxide (mg/m³)</option>
                  <option value="o3">O₃ - Ozone (µg/m³)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
                  Input Concentration Value (C_p):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={testConcentration}
                    onChange={(e) => setTestConcentration(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#090d17] text-xs text-slate-200 border border-slate-700 rounded px-3 py-2 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                    {calculatedSubIndex.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Derivation Breakdown */}
            <div className="p-4 bg-[#090d17] border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
              <div className="text-slate-400 font-semibold border-b border-slate-800 pb-1 text-[11px] uppercase tracking-wider">
                STEP-BY-STEP MATHEMATICAL DERIVATION:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 py-1">
                <div>
                  <span className="text-slate-500">Breakpoint B_lo:</span> <strong>{bLo}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Breakpoint B_hi:</span> <strong>{bHi}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Index I_lo:</span> <strong>{iLo}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Index I_hi:</span> <strong>{iHi}</strong>
                </div>
              </div>

              <div className="text-slate-300 pt-1">
                1. ΔB = B_hi - B_lo = {bHi} - {bLo} = <strong>{deltaB}</strong>
              </div>
              <div className="text-slate-300">
                2. ΔI = I_hi - I_lo = {iHi} - {iLo} = <strong>{deltaI}</strong>
              </div>
              <div className="text-slate-300">
                3. Slope (ΔI / ΔB) = {deltaI} / {deltaB} ={' '}
                <strong>{slope.toFixed(4)}</strong>
              </div>
              <div className="text-slate-300">
                4. Offset (C_p - B_lo) = {testConcentration} - {bLo} ={' '}
                <strong>{(clampedC - bLo).toFixed(2)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-800 text-sm text-blue-400 font-bold flex items-center justify-between">
                <span>
                  Resulting Sub-Index I_p: [{slope.toFixed(3)} × {(clampedC - bLo).toFixed(1)}] + {iLo}
                </span>
                <span className="text-xl tabular-nums">{result} ({calculatedSubIndex.category})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Breakpoint Tables */}
      {activeTab === 'breakpoints' && (
        <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-400" />
              <span>Official Breakpoint Threshold Reference Matrix</span>
            </h3>
            <span className="text-xs font-mono text-blue-400">
              Active Standard: {standard === 'CPCB' ? 'Indian CPCB Guidelines' : 'US EPA Technical Standard'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left text-slate-300 border-collapse">
              <thead>
                <tr className="bg-[#090d17] text-slate-400 border-b border-slate-800">
                  <th className="p-3">Category</th>
                  <th className="p-3">AQI Range</th>
                  <th className="p-3">PM2.5 (µg/m³)</th>
                  <th className="p-3">PM10 (µg/m³)</th>
                  <th className="p-3">NO₂ (µg/m³)</th>
                  <th className="p-3">SO₂ (µg/m³)</th>
                  <th className="p-3">CO (mg/m³)</th>
                  <th className="p-3">O₃ (µg/m³)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(standard === 'CPCB' ? CPCB_BREAKPOINTS.pm25 : EPA_BREAKPOINTS.pm25).map((row, idx) => {
                  const table = standard === 'CPCB' ? CPCB_BREAKPOINTS : EPA_BREAKPOINTS;
                  const categories =
                    standard === 'CPCB'
                      ? ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe']
                      : ['Good', 'Moderate', 'USG', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];

                  const colors = ['#16a34a', '#65a30d', '#d97706', '#ea580c', '#dc2626', '#991b1b'];

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold" style={{ color: colors[idx] }}>
                        {categories[idx]}
                      </td>
                      <td className="p-3 font-semibold tabular-nums">
                        {row.iLo} - {row.iHi}
                      </td>
                      <td className="p-3 tabular-nums">
                        {table.pm25[idx]?.bLo} - {table.pm25[idx]?.bHi}
                      </td>
                      <td className="p-3 tabular-nums">
                        {table.pm10[idx]?.bLo} - {table.pm10[idx]?.bHi}
                      </td>
                      <td className="p-3 tabular-nums">
                        {table.no2[idx]?.bLo} - {table.no2[idx]?.bHi}
                      </td>
                      <td className="p-3 tabular-nums">
                        {table.so2[idx]?.bLo} - {table.so2[idx]?.bHi}
                      </td>
                      <td className="p-3 tabular-nums">
                        {table.co[idx]?.bLo} - {table.co[idx]?.bHi}
                      </td>
                      <td className="p-3 tabular-nums">
                        {table.o3[idx]?.bLo} - {table.o3[idx]?.bHi}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: CSV Data Export */}
      {activeTab === 'export' && (
        <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">
              Dataset Exporter for Report & Research
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Generate an RFC 4180 compliant CSV file containing complete multi-pollutant telemetry, Indian NAQI indices, US EPA scores, and meteorological dispersion parameters for{' '}
            <strong className="text-slate-200">{stationData.station.city}</strong>. Ready for Python Pandas, Jupyter Notebooks, or submission as project appendices.
          </p>

          <div className="p-4 bg-[#090d17] border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono">
            <div className="space-y-0.5">
              <div className="text-slate-200 font-semibold">
                Station: {stationData.station.name}
              </div>
              <div className="text-slate-400 text-[11px]">
                Total Datapoints: {stationData.hourlyHistory.length + stationData.forecastHourly.length} records (72h past + 48h forecast)
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Viva Technical Q&A Notes */}
      {activeTab === 'viva' && (
        <div className="p-5 bg-[#0e1422] border border-slate-800 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-white">
              Key Engineering Answers for Viva Examiners
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-[#090d17] border border-slate-800 rounded-lg space-y-1.5">
              <div className="font-semibold text-blue-400 font-mono text-[11px]">
                Q1: How is the overall AQI determined from multiple individual pollutants?
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                A: Under Central Pollution Control Board (CPCB) methodology, sub-indices are calculated for each measured pollutant (PM2.5, PM10, NO₂, SO₂, CO, O₃) using linear interpolation against national breakpoints. The overall AQI corresponds to the maximum sub-index observed (AQI = max(I_p)), provided at least three pollutants are measured including at least one particulate matter indicator (PM2.5 or PM10). The pollutant with the maximum sub-index is designated as the &quot;Dominant Pollutant&quot;.
              </p>
            </div>

            <div className="p-4 bg-[#090d17] border border-slate-800 rounded-lg space-y-1.5">
              <div className="font-semibold text-blue-400 font-mono text-[11px]">
                Q2: How does meteorological data influence air quality analysis in this system?
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                A: The system pairs atmospheric pollutant sensors with meteorological telemetry (wind speed, wind direction, temperature, and humidity). Wind speed directly governs atmospheric dispersion; when wind speed drops below 5 km/h during nocturnal winter conditions, boundary layer inversion traps particulate matter. High wind speeds (&gt;15 km/h) enhance physical dilution.
              </p>
            </div>

            <div className="p-4 bg-[#090d17] border border-slate-800 rounded-lg space-y-1.5">
              <div className="font-semibold text-blue-400 font-mono text-[11px]">
                Q3: Why provide both Indian NAQI and US EPA AQI standards?
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                A: Indian ambient conditions frequently experience higher baseline dust and regional topography (such as alluvial soil in the Indo-Gangetic belt), so CPCB defines tailored breakpoints (e.g. PM2.5 Good threshold is 0–30 µg/m³ for 24h, whereas US EPA updated standard is 0–9.0 µg/m³). Supporting both allows scientific benchmarking across jurisdictions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
