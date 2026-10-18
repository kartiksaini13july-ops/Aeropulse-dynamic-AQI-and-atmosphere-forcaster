import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Play, Pause, RotateCcw, FastForward, Sun, Moon } from 'lucide-react';
import { HourlyAtmosphericPoint } from '../types/aqi';

interface TemporalScrubberProps {
  timelinePoints: HourlyAtmosphericPoint[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isLive: boolean;
  onReturnToLive: () => void;
}

export const TemporalScrubber: React.FC<TemporalScrubberProps> = ({
  timelinePoints,
  currentIndex,
  onIndexChange,
  isLive,
  onReturnToLive,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPoint = timelinePoints[currentIndex];
  if (!currentPoint) return null;

  const dateObj = new Date(currentPoint.time);
  const hourNum = dateObj.getHours();
  const isDaytime = hourNum >= 6 && hourNum < 18;

  const formattedTime = dateObj.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Play / Animation loop
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        if (currentIndex >= timelinePoints.length - 1) {
          setIsPlaying(false);
        } else {
          onIndexChange(currentIndex + 1);
        }
      }, 700);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, currentIndex, timelinePoints.length, onIndexChange]);

  // Mini sparkline heights for 120h curve preview
  const sparklineHeights = useMemo(() => {
    if (!timelinePoints.length) return [];
    let max = 1;
    timelinePoints.forEach((p) => {
      if (p.aqiCPCB > max) max = p.aqiCPCB;
    });
    return timelinePoints.map((p) => Math.max(15, Math.min(100, Math.round((p.aqiCPCB / max) * 100))));
  }, [timelinePoints]);

  return (
    <div className="relative z-10 p-3.5 bg-[#0e1422] border border-slate-800 rounded-xl shadow-lg flex flex-col gap-2.5">
      {/* Top Header Row: Current Timestamp, Diurnal Indicator, Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Time and Diurnal indicator */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white font-bold tracking-tight">{formattedTime}</span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              {isDaytime ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Diurnal Mixing</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-slate-400" />
                  <span>Nocturnal Inversion</span>
                </>
              )}
            </span>
          </div>

          {isLive ? (
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold tracking-wider flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          ) : (
            <button
              onClick={onReturnToLive}
              className="px-2.5 py-1 rounded-md bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 text-[10px] font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RETURN TO LIVE</span>
            </button>
          )}
        </div>

        {/* Right Controls: Play / Step */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-medium transition-all ${
              isPlaying
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
            title={isPlaying ? 'Pause animation' : 'Play 120-hour timeline progression'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-blue-400" />
                <span>Play 120h Time-lapse</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onIndexChange(Math.min(timelinePoints.length - 1, currentIndex + 3));
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-md border border-slate-700 transition-colors"
            title="Step forward +3 hours"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini 120h Sparkline histogram bar preview */}
      <div className="relative h-6 flex items-end gap-[1.5px] px-1 bg-slate-950 rounded-md overflow-hidden border border-slate-800">
        {sparklineHeights.map((h, i) => {
          const isSelected = i === currentIndex;
          const aqiVal = timelinePoints[i]?.aqiCPCB ?? 50;
          const barColor =
            aqiVal > 200
              ? '#dc2626'
              : aqiVal > 100
              ? '#d97706'
              : '#16a34a';

          return (
            <div
              key={i}
              onClick={() => onIndexChange(i)}
              className="flex-1 cursor-pointer transition-all hover:opacity-100 rounded-t-[1px]"
              style={{
                height: `${h}%`,
                backgroundColor: isSelected ? '#2563eb' : barColor,
                opacity: isSelected ? 1 : 0.45,
              }}
            />
          );
        })}
        {/* Needle cursor line across sparkline */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none"
          style={{
            left: `${(currentIndex / Math.max(1, timelinePoints.length - 1)) * 100}%`,
          }}
        />
      </div>

      {/* Scrubber Range Rail with Milestone Labels */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min="0"
          max={timelinePoints.length - 1}
          value={currentIndex}
          onChange={(e) => onIndexChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
        />

        {/* Milestone Tick Marks */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-0.5 select-none">
          <span>-72h (Past History)</span>
          <span>-48h</span>
          <span>-24h</span>
          <span className="font-bold text-blue-400">T-0 (Now)</span>
          <span>+24h</span>
          <span>+48h (Forecast Horizon)</span>
        </div>
      </div>
    </div>
  );
};
