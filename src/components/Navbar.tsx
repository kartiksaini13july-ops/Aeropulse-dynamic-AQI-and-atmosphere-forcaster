/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { AQIStandard, AppColorTheme } from '../types/aqi';
import {
  Wind,
  MapPin,
  BarChart3,
  GitCompare,
  GraduationCap,
  RefreshCw,
  Cpu,
  Palette,
  Check,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'overview' | 'map' | 'trends' | 'comparison' | 'ml' | 'viva';
  onViewChange: (view: 'overview' | 'map' | 'trends' | 'comparison' | 'ml' | 'viva') => void;
  standard: AQIStandard;
  onStandardChange: (standard: AQIStandard) => void;
  currentTheme: AppColorTheme;
  onThemeChange: (theme: AppColorTheme) => void;
  activeCityName: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  standard,
  onStandardChange,
  currentTheme,
  onThemeChange,
  activeCityName,
  isRefreshing,
  onRefresh,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const themeOptions: {
    id: AppColorTheme;
    name: string;
    desc: string;
    badgeColor: string;
  }[] = [
    {
      id: 'dynamic',
      name: 'Dynamic Atmospheric',
      desc: 'Adaptive aura morphs with live AQI & wind weather',
      badgeColor: 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500',
    },
    {
      id: 'navy',
      name: 'Executive Navy',
      desc: 'Classic institutional deep sapphire & royal blue',
      badgeColor: 'bg-blue-600',
    },
    {
      id: 'emerald',
      name: 'Boreal Forest',
      desc: 'Deep pine obsidian & calibrated emerald',
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'obsidian',
      name: 'Nordic Slate',
      desc: 'Technical monochrome titanium & slate',
      badgeColor: 'bg-slate-400',
    },
    {
      id: 'amber',
      name: 'Sunset Twilight',
      desc: 'Warm dusk horizon with radiant amber',
      badgeColor: 'bg-amber-600',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0e1422]/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
            <Wind className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
              AeroPulse
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider whitespace-nowrap">
              Atmospheric Observatory · {activeCityName}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onViewChange('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'overview'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Overview</span>
          </button>

          <button
            onClick={() => onViewChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'map'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Interactive Map</span>
          </button>

          <button
            onClick={() => onViewChange('trends')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'trends'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Trend Analysis</span>
          </button>

          <button
            onClick={() => onViewChange('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'comparison'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>City Studio</span>
          </button>

          {/* ML Studio Tab */}
          <button
            onClick={() => onViewChange('ml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'ml'
                ? 'bg-blue-950/80 text-blue-200 border border-blue-700/70 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Studio</span>
          </button>

          <button
            onClick={() => onViewChange('viva')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'viva'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Lab</span>
          </button>
        </nav>

        {/* Zone 3: Color Theme Switcher + 1 Primary Segmented Standard Control + Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Interactive Color Theme Switcher */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 transition-colors shadow-sm"
              title="Change visual atmosphere theme"
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline font-mono text-[11px]">
                {currentTheme === 'dynamic' ? 'Dynamic AQI' : currentTheme}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0e1422] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-[100] text-xs">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>Atmosphere Themes</span>
                  <Sparkles className="w-3 h-3 text-blue-400" />
                </div>
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onThemeChange(opt.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-lg text-left flex items-start justify-between gap-2 transition-colors ${
                      currentTheme === opt.id
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${opt.badgeColor}`} />
                      <div>
                        <div className="font-semibold text-xs leading-none">{opt.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</div>
                      </div>
                    </div>
                    {currentTheme === opt.id && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Standard Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => onStandardChange('CPCB')}
              title="Indian Central Pollution Control Board standard"
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all whitespace-nowrap shrink-0 ${
                standard === 'CPCB'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CPCB
            </button>
            <button
              onClick={() => onStandardChange('EPA')}
              title="US Environmental Protection Agency AQI standard"
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all whitespace-nowrap shrink-0 ${
                standard === 'EPA'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              US EPA
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh real-time telemetry"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors border border-slate-800 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden overflow-x-auto gap-1.5 pt-2 mt-2 border-t border-slate-800 pb-1 scrollbar-none">
        <button
          onClick={() => onViewChange('overview')}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
            currentView === 'overview' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onViewChange('map')}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
            currentView === 'map' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400'
          }`}
        >
          Map
        </button>
        <button
          onClick={() => onViewChange('trends')}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
            currentView === 'trends' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400'
          }`}
        >
          Trends
        </button>
        <button
          onClick={() => onViewChange('comparison')}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
            currentView === 'comparison' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400'
          }`}
        >
          Comparison
        </button>
        <button
          onClick={() => onViewChange('ml')}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
            currentView === 'ml' ? 'bg-blue-950 text-blue-200 font-semibold border border-blue-700/60' : 'text-slate-400'
          }`}
        >
          ML Studio
        </button>
        <button
          onClick={() => onViewChange('viva')}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
            currentView === 'viva' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400'
          }`}
        >
          Academic
        </button>
      </div>
    </header>
  );
};
