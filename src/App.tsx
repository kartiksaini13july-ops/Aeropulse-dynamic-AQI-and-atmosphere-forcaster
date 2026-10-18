/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AQIStandard,
  AppColorTheme,
  HourlyAtmosphericPoint,
  MonitoringStation,
  PollutantConcentrations,
  StationFullData,
} from './types/aqi';
import { CURATED_STATIONS, fetchStationFullData } from './services/airQualityApi';
import { computeFullAQI } from './services/aqiCalculator';
import { Navbar } from './components/Navbar';
import { StationSearch } from './components/StationSearch';
import { AQIGauge } from './components/AQIGauge';
import { QuickMetricsRibbon } from './components/QuickMetricsRibbon';
import { WeatherAtmosphericCard } from './components/WeatherAtmosphericCard';
import { HealthAdvisoryCard } from './components/HealthAdvisoryCard';
import { InteractiveMap } from './components/InteractiveMap';
import { TrendAnalysisView } from './components/TrendAnalysisView';
import { CityComparisonStudio } from './components/CityComparisonStudio';
import { AcademicVivaHub } from './components/AcademicVivaHub';
import { MLStudioView } from './components/MLStudioView';
import { DSMetricSummaryCard } from './components/DSMetricSummaryCard';
import { AtmosphericAmbientBackground } from './components/AtmosphericAmbientBackground';
import { TemporalScrubber } from './components/TemporalScrubber';
import {
  MapPin,
  ChevronRight,
  Layers,
  BarChart3,
  Wind,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [currentStation, setCurrentStation] = useState<MonitoringStation>(CURATED_STATIONS[0]);
  const [standard, setStandard] = useState<AQIStandard>('CPCB');
  const [theme, setTheme] = useState<AppColorTheme>('dynamic');
  const [currentView, setCurrentView] = useState<'overview' | 'map' | 'trends' | 'comparison' | 'ml' | 'viva'>('overview');
  const [stationData, setStationData] = useState<StationFullData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Temporal Scrubber state
  const [scrubberIndex, setScrubberIndex] = useState<number>(-1);

  // Load telemetry when currentStation changes
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchStationFullData(currentStation);
        if (isMounted) {
          setStationData(data);
          setScrubberIndex(data.hourlyHistory.length - 1);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentStation]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const data = await fetchStationFullData(currentStation);
      setStationData(data);
      setScrubberIndex(data.hourlyHistory.length - 1);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Combined timeline (past 72h + future 48h)
  const fullTimeline: HourlyAtmosphericPoint[] = useMemo(() => {
    if (!stationData) return [];
    return [...stationData.hourlyHistory, ...stationData.forecastHourly];
  }, [stationData]);

  const liveIndex = stationData ? stationData.hourlyHistory.length - 1 : 0;
  const isLive = scrubberIndex === -1 || scrubberIndex === liveIndex;

  // Daytime detector based on scrubber point or current clock
  const isDaytime = useMemo(() => {
    if (scrubberIndex >= 0 && fullTimeline[scrubberIndex]) {
      const hour = new Date(fullTimeline[scrubberIndex].time).getHours();
      return hour >= 6 && hour < 18;
    }
    const currentHour = new Date().getHours();
    return currentHour >= 6 && currentHour < 18;
  }, [scrubberIndex, fullTimeline]);

  // Derive active atmospheric data based on temporal scrubber
  const activePollutants: PollutantConcentrations = useMemo(() => {
    if (!stationData) {
      return { pm25: 45, pm10: 80, no2: 35, so2: 12, co: 1.1, o3: 40 };
    }
    if (isLive || scrubberIndex < 0 || scrubberIndex >= fullTimeline.length) {
      return stationData.currentPollutants;
    }
    const pt = fullTimeline[scrubberIndex];
    return {
      pm25: pt.pm25,
      pm10: pt.pm10,
      no2: pt.no2,
      so2: pt.so2,
      co: pt.co,
      o3: pt.o3,
    };
  }, [stationData, isLive, scrubberIndex, fullTimeline]);

  // Dynamically computed AQI based on scrubber position & selected standard
  const activeComputedAQI = useMemo(() => {
    return computeFullAQI(activePollutants, standard);
  }, [activePollutants, standard]);

  // Dynamic atmospheric status description
  const atmosphericStatusText = useMemo(() => {
    if (!stationData) return 'Connecting to monitoring node...';
    const aqi = activeComputedAQI.aqi;
    const wind = stationData.weather.windSpeed;
    const dayNight = isDaytime ? 'Daytime' : 'Nocturnal';

    if (aqi <= 50) {
      return `${dayNight} Clear Troposphere · Active Advection (${wind} km/h)`;
    } else if (aqi <= 100) {
      return `${dayNight} Moderate Particulate Haze · Ambient Ventilation`;
    } else if (aqi <= 200) {
      return `${dayNight} Elevated Smog Layer · Convective Boundary Layer`;
    } else if (aqi <= 300) {
      return `${dayNight} Severe Thermal Inversion · Particulate Entrapment`;
    } else {
      return `${dayNight} Hazardous Smog Ceiling · Stagnant Atmospheric Box`;
    }
  }, [stationData, activeComputedAQI, isDaytime]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative selection:bg-blue-600/30 selection:text-blue-200">
      {/* Living Atmospheric Ambient Canvas Background */}
      <AtmosphericAmbientBackground
        computedAQI={activeComputedAQI}
        weather={stationData ? stationData.weather : null}
        theme={theme}
        isDaytime={isDaytime}
      />

      {/* Top Bar Navigation with Theme Switcher */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        standard={standard}
        onStandardChange={setStandard}
        currentTheme={theme}
        onThemeChange={setTheme}
        activeCityName={currentStation.city}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Search & Location Bar with Quick Stations */}
        <div className="relative z-40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#0e1422]/90 border border-slate-800 rounded-xl backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2 relative z-50">
            <StationSearch
              currentStation={currentStation}
              onSelectStation={(st) => setCurrentStation(st)}
            />
          </div>

          {/* Quick preset city selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <span className="text-slate-500 text-[11px] font-mono shrink-0 mr-1">STATIONS:</span>
            {CURATED_STATIONS.slice(0, 5).map((st) => (
              <button
                key={st.id}
                onClick={() => setCurrentStation(st)}
                className={`px-2.5 py-1 rounded transition-all whitespace-nowrap shrink-0 text-xs font-mono ${
                  currentStation.id === st.id
                    ? 'bg-slate-800 text-blue-200 border border-blue-700/80 font-semibold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st.city.split('-')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Global 120-Hour Temporal Scrubber Bar */}
        {stationData && fullTimeline.length > 0 && (
          <TemporalScrubber
            timelinePoints={fullTimeline}
            currentIndex={scrubberIndex >= 0 ? scrubberIndex : liveIndex}
            onIndexChange={setScrubberIndex}
            isLive={isLive}
            onReturnToLive={() => setScrubberIndex(liveIndex)}
          />
        )}

        {/* Loading Skeleton */}
        {isLoading && !stationData && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-[#0e1422] rounded-xl border border-slate-800" />
              <div className="lg:col-span-2 h-64 bg-[#0e1422] rounded-xl border border-slate-800" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 bg-[#0e1422] rounded-xl border border-slate-800" />
              ))}
            </div>
          </div>
        )}

        {/* View 1: Main Overview Dashboard */}
        {stationData && activeComputedAQI && currentView === 'overview' && (
          <div className="space-y-6">
            {/* Station Header Banner with Atmospheric State Readout */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                    <span>{stationData.station.city}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({stationData.station.name})
                    </span>
                  </h1>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>{stationData.station.country}</span>
                    <span>·</span>
                    <span>
                      {stationData.station.lat.toFixed(3)}°N, {stationData.station.lon.toFixed(3)}°E
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-Time Atmospheric Dynamics Readout */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                <div className="px-2.5 py-1 rounded bg-[#0e1422] border border-slate-800 text-slate-300 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate max-w-[260px] sm:max-w-none">{atmosphericStatusText}</span>
                </div>

                <div className="hidden lg:flex items-center gap-2 text-slate-400">
                  <span>·</span>
                  <span className="text-blue-400 font-medium">
                    Standard: {standard === 'CPCB' ? 'Indian NAQI' : 'US EPA AQI'}
                  </span>
                </div>
              </div>
            </div>

            {/* Split Console: Left Gauge, Right Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-4 flex flex-col">
                <AQIGauge computedAQI={activeComputedAQI} />
              </div>

              <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                <WeatherAtmosphericCard weather={stationData.weather} />
                <HealthAdvisoryCard computedAQI={activeComputedAQI} />
              </div>
            </div>

            {/* Multi-pollutant Quick Metrics Strip */}
            <div>
              <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-400">
                <span>POLLUTANT CONCENTRATIONS & SUB-INDICES</span>
                <span className="text-slate-500">Select parameter to inspect health benchmarks</span>
              </div>
              <QuickMetricsRibbon subIndices={activeComputedAQI.subIndices} />
            </div>

            {/* Executive Data Science Telemetry Card */}
            <DSMetricSummaryCard
              stationData={stationData}
              onOpenMLStudio={() => setCurrentView('ml')}
            />

            {/* Teaser Modules Grid: Map & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
              {/* Map Teaser Box */}
              <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Geospatial Station Network & Wind Vectors</h3>
                  </div>
                  <button
                    onClick={() => setCurrentView('map')}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium font-mono"
                  >
                    <span>Launch Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div
                  onClick={() => setCurrentView('map')}
                  className="h-36 rounded-lg overflow-hidden border border-slate-800 relative cursor-pointer group bg-[#090d17] p-3 flex flex-col justify-between"
                >
                  <div className="text-[11px] font-mono text-slate-400">
                    Station Coordinate Network ({CURATED_STATIONS.length} active monitors)
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <Wind className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-semibold text-white font-mono">
                      {stationData.station.city}: Wind {stationData.weather.windSpeed} km/h from {stationData.weather.windDirection}°
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Active vector field simulation</span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <span>View GIS Map &rarr;</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Trends Teaser Box */}
              <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Pearson Correlation & Time Series</h3>
                  </div>
                  <button
                    onClick={() => setCurrentView('trends')}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium font-mono"
                  >
                    <span>Inspect Matrix</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div
                  onClick={() => setCurrentView('trends')}
                  className="h-36 rounded-lg bg-[#090d17] border border-slate-800 p-3 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>24h Trend Horizon</span>
                    <span className="text-blue-400">
                      Mean: {Math.round(stationData.hourlyHistory.slice(-24).reduce((a, b) => a + b.pm25, 0) / 24)} µg PM2.5
                    </span>
                  </div>

                  <div className="h-16 flex items-end gap-1 px-1">
                    {stationData.hourlyHistory.slice(-24).map((p, idx) => {
                      const val = standard === 'CPCB' ? p.aqiCPCB : p.aqiEPA;
                      const heightPct = Math.min(100, Math.max(15, (val / 300) * 100));
                      const barColor =
                        val > 200 ? '#dc2626' : val > 100 ? '#d97706' : '#16a34a';
                      return (
                        <div
                          key={idx}
                          className="flex-1 rounded-t opacity-85 hover:opacity-100 transition-opacity"
                          style={{ height: `${heightPct}%`, backgroundColor: barColor }}
                        />
                      );
                    })}
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                    <span>Bivariate coupling (PM2.5, NO₂, O₃)</span>
                    <span className="text-blue-400">Open matrix &rarr;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Interactive Geospatial Map */}
        {stationData && currentView === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Geospatial Station Network & Atmospheric Vector Flow</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Click any station marker or carousel pill to inspect full atmospheric telemetry
              </span>
            </div>
            <InteractiveMap
              currentStationData={stationData}
              standard={standard}
              onSelectStation={(st) => setCurrentStation(st)}
            />
          </div>
        )}

        {/* View 3: Multi-Pollutant Trend Analysis */}
        {stationData && currentView === 'trends' && (
          <TrendAnalysisView
            stationData={stationData}
            standard={standard}
          />
        )}

        {/* View 4: City Comparison Studio */}
        {currentView === 'comparison' && (
          <CityComparisonStudio standard={standard} />
        )}

        {/* View 5: Dedicated Data Science & Predictive ML Studio */}
        {stationData && currentView === 'ml' && (
          <MLStudioView
            stationData={stationData}
            standard={standard}
          />
        )}

        {/* View 6: Academic Viva & CSV Hub */}
        {stationData && currentView === 'viva' && (
          <AcademicVivaHub
            stationData={stationData}
            standard={standard}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0e1422]/90 backdrop-blur-md px-4 lg:px-8 py-5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold">AeroPulse Atmospheric Observatory</span>
            <span>·</span>
            <span>Environmental Telemetry Console</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Dynamic Weather & Wind Simulation</span>
            <span>·</span>
            <span className="text-blue-400">Ridge & ARDL Predictive Modeling</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
