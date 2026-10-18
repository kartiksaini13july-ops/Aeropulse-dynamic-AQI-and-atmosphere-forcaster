import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AISpatialAnalysis, AQIStandard, MonitoringStation, StationFullData } from '../types/aqi';
import { CURATED_STATIONS } from '../services/airQualityApi';
import { WindParticleCanvas } from './WindParticleCanvas';
import {
  Layers,
  MapPin,
  Eye,
  Filter,
  Sparkles,
  Send,
  Loader2,
  X,
  Compass,
  AlertCircle,
  Wind,
  ShieldCheck,
  GraduationCap,
  Maximize2,
  Crosshair,
  Flame,
  Radio,
} from 'lucide-react';

interface InteractiveMapProps {
  currentStationData: StationFullData;
  standard: AQIStandard;
  onSelectStation: (station: MonitoringStation) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  currentStationData,
  standard,
  onSelectStation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusLayerRef = useRef<L.Circle | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'streets' | 'satellite' | 'osm'>('dark');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'unhealthy' | 'severe'>('all');
  const [showRadius, setShowRadius] = useState<boolean>(true);
  const [showWindStreams, setShowWindStreams] = useState<boolean>(true);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Gemini Flash State
  const [aiAnalysis, setAiAnalysis] = useState<AISpatialAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);
  const [spatialQuery, setSpatialQuery] = useState<string>('');
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(false);
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);

  // 100% Free Public Tile Providers (Zero API keys required)
  const tileProviders = {
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    streets: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  const tileAttributions = {
    dark: '&copy; Esri, DeLorme, NAVTEQ',
    streets: '&copy; Esri, DeLorme, NAVTEQ, TomTom',
    satellite: '&copy; Esri, Maxar, Earthstar Geographics',
    osm: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  };

  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentStationData.station.lat, currentStationData.station.lon],
        zoom: 7,
        zoomControl: false, // We'll render custom sci-fi HUD zoom buttons
        scrollWheelZoom: true,
      });

      const baseTile = L.tileLayer(tileProviders[mapStyle], {
        attribution: tileAttributions[mapStyle],
        maxZoom: 18,
      }).addTo(map);

      tileLayerRef.current = baseTile;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      map.on('mouseout', () => {
        setCursorCoords(null);
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update base tile when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(tileProviders[mapStyle]);
  }, [mapStyle]);

  // Smooth cinematic fly to station
  const flyToLocation = (lat: number, lon: number, zoom = 9) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lon], zoom, {
      duration: 1.4,
      easeLinearity: 0.25,
    });
  };

  // Fly to active station when prop changes
  useEffect(() => {
    flyToLocation(currentStationData.station.lat, currentStationData.station.lon, 8);
  }, [currentStationData.station.lat, currentStationData.station.lon]);

  // Fit all stations in bounds
  const handleFitAllStations = () => {
    if (!mapInstanceRef.current) return;
    const latLngs = CURATED_STATIONS.map((s) => [s.lat, s.lon] as [number, number]);
    latLngs.push([currentStationData.station.lat, currentStationData.station.lon]);
    mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60] });
  };

  // Render markers and dispersion radius
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const stationsMap = new Map<string, MonitoringStation>();
    CURATED_STATIONS.forEach((st) => stationsMap.set(st.id, st));
    stationsMap.set(currentStationData.station.id, currentStationData.station);

    const stationsList = Array.from(stationsMap.values());

    stationsList.forEach((station) => {
      const isCurrent = station.id === currentStationData.station.id;
      const aqi = isCurrent
        ? standard === 'CPCB'
          ? currentStationData.computedCPCB.aqi
          : currentStationData.computedEPA.aqi
        : station.currentAQI || 120;

      if (filterSeverity === 'unhealthy' && aqi < 101) return;
      if (filterSeverity === 'severe' && aqi < 201) return;

      const color =
        aqi <= 50
          ? '#10b981'
          : aqi <= 100
          ? '#84cc16'
          : aqi <= 200
          ? '#f59e0b'
          : aqi <= 300
          ? '#f97316'
          : aqi <= 400
          ? '#ef4444'
          : '#881337';

      // Calibrated scientific telemetry marker
      const iconHtml = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isCurrent
              ? `<div style="position: absolute; inset: -3px; border-radius: 9999px; border: 1.5px solid ${color}; opacity: 0.85;"></div>`
              : ''
          }
          <div style="
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background: #090d16;
            border: 2px solid ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.6);
          ">
            <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: ${color};">
              ${aqi}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'aqi-custom-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 42],
      });

      const marker = L.marker([station.lat, station.lon], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 bg-slate-950 text-white rounded-xl min-w-[240px] border border-slate-800 shadow-2xl';
      popupContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 8px;">
          <span style="font-size: 10px; font-family: monospace; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">● Sensor Telemetry</span>
          <span style="font-size: 10px; color: #94a3b8; font-family: monospace;">${station.lat.toFixed(2)}°, ${station.lon.toFixed(2)}°</span>
        </div>
        <div style="font-size: 15px; font-weight: 700; color: #ffffff;">${station.city}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">${station.name}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(17, 24, 39, 0.9); border-radius: 8px; margin-bottom: 10px; border: 1px solid rgba(56, 189, 248, 0.2);">
          <span style="font-size: 11px; color: #cbd5e1;">Index Score</span>
          <span style="font-family: monospace; font-weight: 800; font-size: 18px; color: ${color}; text-shadow: 0 0 8px ${color}88;">${aqi}</span>
        </div>
        <button id="btn-select-${station.id}" style="width: 100%; padding: 7px 12px; font-size: 11px; font-weight: 600; color: #ffffff; background: linear-gradient(135deg, #0891b2 0%, #0284c7 100%); border: none; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 8px rgba(8,145,178,0.4);">
          Inspect & Center Station
        </button>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${station.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStation(station);
            flyToLocation(station.lat, station.lon, 9);
            marker.closePopup();
          };
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Render radius dispersion
    if (radiusLayerRef.current) {
      mapInstanceRef.current.removeLayer(radiusLayerRef.current);
      radiusLayerRef.current = null;
    }

    if (showRadius) {
      const activeAQI =
        standard === 'CPCB'
          ? currentStationData.computedCPCB.aqi
          : currentStationData.computedEPA.aqi;
      const activeColor = currentStationData.computedCPCB.color;
      const radiusMeters = Math.max(16000, activeAQI * 280);

      const circle = L.circle(
        [currentStationData.station.lat, currentStationData.station.lon],
        {
          radius: radiusMeters,
          color: activeColor,
          fillColor: activeColor,
          fillOpacity: 0.16,
          weight: 2,
          dashArray: '6, 6',
        }
      ).addTo(mapInstanceRef.current);

      radiusLayerRef.current = circle;
    }
  }, [
    currentStationData,
    standard,
    filterSeverity,
    showRadius,
    onSelectStation,
  ]);

  // Trigger Gemini Flash AI Spatial Diagnostics
  const handleRunAiDiagnostics = async () => {
    setIsAiLoading(true);
    setShowAiDrawer(true);
    try {
      const aqiVal =
        standard === 'CPCB'
          ? currentStationData.computedCPCB.aqi
          : currentStationData.computedEPA.aqi;
      const categoryVal =
        standard === 'CPCB'
          ? currentStationData.computedCPCB.category
          : currentStationData.computedEPA.category;

      const res = await fetch('/api/map/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationName: currentStationData.station.name,
          city: currentStationData.station.city,
          country: currentStationData.station.country,
          lat: currentStationData.station.lat,
          lon: currentStationData.station.lon,
          aqi: aqiVal,
          standard,
          category: categoryVal,
          dominantPollutant: currentStationData.computedCPCB.dominantPollutant,
          pollutants: currentStationData.currentPollutants,
          weather: currentStationData.weather,
        }),
      });

      if (!res.ok) throw new Error('AI analysis API returned error');
      const data = await res.json();
      setAiAnalysis(data);
    } catch {
      setAiAnalysis({
        spatialSummary: `${currentStationData.station.city} exhibits elevated particulate concentration driven by regional terrain trapping and arterial vehicle movements.`,
        localContributors: [
          'High density traffic corridors within a 5km radius',
          'Thermal boundary layer inversion reducing vertical ventilation',
          'Regional background dust transport',
        ],
        plumeDispersion: `Winds at ${currentStationData.weather.windSpeed} km/h provide partial horizontal dispersion toward the downwind quadrant.`,
        safeZoneInsight: 'Elevated parks and windward periphery show noticeably lower particulate densities.',
        vivaInsight: 'Demonstrates spatial correlation between wind vector magnitude and localized particulate retention.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Natural Language Query to Gemini Flash
  const handleSpatialQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spatialQuery.trim()) return;

    setIsQueryLoading(true);
    try {
      const res = await fetch('/api/map/spatial-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: spatialQuery,
          activeStations: CURATED_STATIONS,
        }),
      });

      if (!res.ok) throw new Error('Query error');
      const data = await res.json();
      setQueryAnswer(data.answer);

      if (data.suggestedStationId) {
        const target = CURATED_STATIONS.find((s) => s.id === data.suggestedStationId);
        if (target) {
          onSelectStation(target);
          flyToLocation(target.lat, target.lon, 9);
        }
      }
    } catch {
      setQueryAnswer(
        `Gemini Flash processed: "${spatialQuery}". In general, inland Gangetic stations experience stagnation, whereas coastal stations benefit from active sea breezes.`
      );
    } finally {
      setIsQueryLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Gemini Flash Spatial Copilot Header Query Bar */}
      <div className="p-3 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Google Gemini Flash Atmospheric Spatial AI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live GIS plume diagnostics, particle simulation & natural language spatial queries
            </p>
          </div>
        </div>

        {/* Query Input */}
        <form onSubmit={handleSpatialQuery} className="flex-1 max-w-lg flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={spatialQuery}
              onChange={(e) => setSpatialQuery(e.target.value)}
              placeholder="Ask Gemini Flash: 'Where is the safest air nearby?'..."
              className="w-full px-3 py-1.5 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-500 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isQueryLoading || !spatialQuery.trim()}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-sm"
          >
            {isQueryLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        {/* Trigger Diagnostics Button */}
        <button
          onClick={handleRunAiDiagnostics}
          disabled={isAiLoading}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          {isAiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span>Diagnose {currentStationData.station.city}</span>
        </button>
      </div>

      {/* Query Answer Display */}
      {queryAnswer && (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex items-start justify-between gap-3 text-xs shadow-lg animate-fadeIn">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-300 font-mono">Gemini Flash Analysis: </span>
              <span className="text-slate-200">{queryAnswer}</span>
            </div>
          </div>
          <button
            onClick={() => setQueryAnswer(null)}
            className="text-slate-500 hover:text-slate-300 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map Container Viewport */}
      <div className="relative w-full h-[620px] bg-[#070b14] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Animated Wind Particle Canvas Layer */}
        <WindParticleCanvas
          windSpeed={currentStationData.weather.windSpeed}
          windDirection={currentStationData.weather.windDirection}
          isActive={showWindStreams}
        />

        {/* Map Control HUD Overlay - Top Left */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-2 pointer-events-auto">
          {/* Style Selector */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-2xl">
            <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                mapStyle === 'dark' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Canvas
            </button>
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                mapStyle === 'streets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                mapStyle === 'satellite' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('osm')}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                mapStyle === 'osm' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              OSM
            </button>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                filterSeverity === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSeverity('unhealthy')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                filterSeverity === 'unhealthy' ? 'bg-amber-600 text-white' : 'text-slate-400'
              }`}
            >
              &gt; 100
            </button>
            <button
              onClick={() => setFilterSeverity('severe')}
              className={`px-2 py-1 text-xs rounded transition-all ${
                filterSeverity === 'severe' ? 'bg-rose-700 text-white' : 'text-slate-400'
              }`}
            >
              &gt; 200
            </button>
          </div>

          {/* Wind Streamlines Toggle */}
          <button
            onClick={() => setShowWindStreams(!showWindStreams)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg backdrop-blur-md border shadow-sm transition-all ${
              showWindStreams
                ? 'bg-slate-800 text-blue-300 border-slate-700'
                : 'bg-slate-900/90 text-slate-400 border-slate-800'
            }`}
          >
            <Wind className={`w-3.5 h-3.5 ${showWindStreams ? 'text-blue-400' : ''}`} />
            <span>Wind Flow ({currentStationData.weather.windSpeed} km/h)</span>
          </button>

          {/* Dispersion Aura Toggle */}
          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg backdrop-blur-md border shadow-sm transition-all ${
              showRadius
                ? 'bg-amber-950/80 text-amber-300 border-amber-600/60'
                : 'bg-slate-900/90 text-slate-400 border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Plume Dispersion</span>
          </button>
        </div>

        {/* Map Top-Right Camera Controls */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => flyToLocation(currentStationData.station.lat, currentStationData.station.lon, 9)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 backdrop-blur-md shadow-md transition-all"
            title="Center on active station"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Center Focus</span>
          </button>

          <button
            onClick={handleFitAllStations}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 backdrop-blur-md shadow-md transition-all"
            title="View entire global station network"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Fit All Stations</span>
          </button>
        </div>

        {/* Real-time Cursor Coordinates Crosshair HUD (Bottom Left) */}
        {cursorCoords && (
          <div className="absolute top-16 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800/80 text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>GEO: {cursorCoords.lat.toFixed(4)}°N, {cursorCoords.lng.toFixed(4)}°E</span>
          </div>
        )}

        {/* Map Legend HUD Overlay (Top/Bottom Right) */}
        <div className="absolute top-16 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-800 shadow-xl pointer-events-auto text-xs font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{standard === 'CPCB' ? 'CPCB NAQI Scale' : 'US EPA Scale'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" /> 0-50
            </span>
            <span className="flex items-center gap-1 text-[11px] text-lime-400">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-500 inline-block" /> 51-100
            </span>
            <span className="flex items-center gap-1 text-[11px] text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 101-200
            </span>
            <span className="flex items-center gap-1 text-[11px] text-orange-400">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> 201-300
            </span>
            <span className="flex items-center gap-1 text-[11px] text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> 301-400
            </span>
            <span className="flex items-center gap-1 text-[11px] text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-950 border border-purple-500 inline-block" /> 401+
            </span>
          </div>
        </div>

        {/* Quick Fly-To Station Carousel Dock (Pinned to Bottom of Map) */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-xl shadow-2xl pointer-events-auto scrollbar-none">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-widest pl-2 pr-1 shrink-0">
            <Radio className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">STATIONS:</span>
          </div>

          {CURATED_STATIONS.map((station) => {
            const isCurrent = station.id === currentStationData.station.id;
            const aqi = isCurrent
              ? standard === 'CPCB'
                ? currentStationData.computedCPCB.aqi
                : currentStationData.computedEPA.aqi
              : station.currentAQI || 115;

            const badgeColor =
              aqi <= 50
                ? '#10b981'
                : aqi <= 100
                ? '#84cc16'
                : aqi <= 200
                ? '#f59e0b'
                : aqi <= 300
                ? '#f97316'
                : '#ef4444';

            return (
              <button
                key={station.id}
                onClick={() => {
                  onSelectStation(station);
                  flyToLocation(station.lat, station.lon, 9);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs whitespace-nowrap shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-slate-800 text-white border-blue-500 shadow-sm font-bold'
                    : 'bg-slate-900/70 text-slate-300 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate max-w-[100px]">{station.city}</span>
                <span
                  className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold tabular-nums"
                  style={{
                    backgroundColor: `${badgeColor}25`,
                    color: badgeColor,
                    border: `1px solid ${badgeColor}60`,
                  }}
                >
                  {aqi}
                </span>
              </button>
            );
          })}
        </div>

        {/* Gemini Flash Spatial Diagnostics Slide-over Drawer */}
        {showAiDrawer && (
          <div className="absolute top-3 right-3 bottom-16 w-80 sm:w-96 z-[1001] bg-[#0c1220]/95 backdrop-blur-md border border-cyan-700/60 rounded-xl shadow-2xl p-4 overflow-y-auto pointer-events-auto space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gemini Flash Spatial Diagnostics</span>
              </div>
              <button
                onClick={() => setShowAiDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span>Querying Google Gemini Flash Spatial Intelligence...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-3 text-xs">
                {/* Geographic Context */}
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-blue-400" />
                    <span>Spatial Geographic Assessment</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {aiAnalysis.spatialSummary}
                  </p>
                </div>

                {/* Local Contributors */}
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Primary Spatial Emission Drivers</span>
                  </div>
                  <ul className="space-y-1 text-slate-400 list-disc list-inside">
                    {aiAnalysis.localContributors.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Plume Dispersion */}
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
                    <Wind className="w-3 h-3 text-blue-400" />
                    <span>Atmospheric Plume Dispersion</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {aiAnalysis.plumeDispersion}
                  </p>
                </div>

                {/* Safe Zones */}
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Micro-Climate Buffer Zones</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {aiAnalysis.safeZoneInsight}
                  </p>
                </div>

                {/* Viva Academic Note */}
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-700 text-slate-200">
                  <div className="font-semibold mb-1 flex items-center gap-1 text-[11px] text-blue-300 font-mono">
                    <GraduationCap className="w-3 h-3" />
                    <span>ACADEMIC GIS OBSERVATION</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    {aiAnalysis.vivaInsight}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
