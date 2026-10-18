import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import { CURATED_STATIONS, searchCities } from '../services/airQualityApi';
import { MonitoringStation } from '../types/aqi';

interface StationSearchProps {
  currentStation: MonitoringStation;
  onSelectStation: (station: MonitoringStation) => void;
}

export const StationSearch: React.FC<StationSearchProps> = ({
  currentStation,
  onSelectStation,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<MonitoringStation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchCities(query);
        setResults(found);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userStation: MonitoringStation = {
          id: `gps-${pos.coords.latitude.toFixed(3)}-${pos.coords.longitude.toFixed(3)}`,
          name: 'Local GPS Sensor Node',
          city: 'Local Proximity',
          country: 'Local Coordinates',
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
          lastUpdated: 'Real-time GPS',
        };
        onSelectStation(userStation);
        setIsOpen(false);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className={`relative w-full max-w-md ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search city, district, monitoring node, or coordinates..."
          className="w-full pl-9 pr-24 py-2 bg-slate-900/90 text-sm text-slate-100 placeholder:text-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all shadow-inner"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {isSearching && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin mr-1" />}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            title="Locate via GPS sensors"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/70 transition-all font-medium"
          >
            <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
            <span className="hidden sm:inline font-mono text-[11px]">GPS</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-80 overflow-y-auto ring-1 ring-black/80">
          {query.trim().length >= 2 ? (
            <div>
              <div className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-slate-800/80 font-semibold">
                Search Results
              </div>
              {results.length > 0 ? (
                results.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSelectStation(st);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/70 flex items-center justify-between border-b border-slate-800/50 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">
                          {st.city} {st.state ? `, ${st.state}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {st.country} · {st.lat.toFixed(2)}°, {st.lon.toFixed(2)}°
                        </div>
                      </div>
                    </div>
                    {currentStation.id === st.id && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </button>
                ))
              ) : !isSearching ? (
                <div className="px-4 py-6 text-xs text-slate-400 text-center font-mono">
                  No monitoring nodes found for &quot;{query}&quot;. Try a prominent city or coordinates.
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between font-semibold">
                <span>Featured Atmospheric Monitoring Stations</span>
                <span className="text-slate-500 font-normal">{CURATED_STATIONS.length} ACTIVE</span>
              </div>
              {CURATED_STATIONS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    onSelectStation(st);
                    setIsOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/70 flex items-center justify-between border-b border-slate-800/40 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {st.city} <span className="text-slate-400 font-normal">({st.name})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {st.state ? `${st.state}, ` : ''}{st.country}
                      </div>
                    </div>
                  </div>
                  {currentStation.id === st.id && (
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
