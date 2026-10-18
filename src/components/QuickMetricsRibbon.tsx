import React, { useState } from 'react';
import { PollutantSubIndex } from '../types/aqi';
import { Sparkles, Info, X, AlertCircle } from 'lucide-react';

interface QuickMetricsRibbonProps {
  subIndices: PollutantSubIndex[];
  onSelectPollutant?: (pollutant: string) => void;
}

export const QuickMetricsRibbon: React.FC<QuickMetricsRibbonProps> = ({
  subIndices,
  onSelectPollutant,
}) => {
  const [selectedPollutant, setSelectedPollutant] = useState<string | null>(null);

  // Chemical & Atmospheric emission profiles
  const chemicalProfiles: Record<
    string,
    {
      fullName: string;
      sources: string;
      healthRisk: string;
      samplingStandard: string;
    }
  > = {
    pm25: {
      fullName: 'Fine Particulate Matter (Aerodynamic Diameter ≤ 2.5 µm)',
      sources: 'Combustion processes, vehicle exhaust, secondary sulfate/nitrate reactions, and biomass burning.',
      healthRisk: 'Penetrates deeply into the alveolar sacs of lungs and directly enters the bloodstream, elevating cardiovascular risks.',
      samplingStandard: 'CPCB 24-hour permissible standard: 60 µg/m³ · WHO 2021 Guideline: 15 µg/m³',
    },
    pm10: {
      fullName: 'Respirable Suspended Particulate Matter (≤ 10 µm)',
      sources: 'Road surface dust, construction debris, mechanical crushing, and industrial material handling.',
      healthRisk: 'Irritates upper bronchial passages and exacerbates allergic asthma and chronic bronchitis.',
      samplingStandard: 'CPCB 24-hour permissible standard: 100 µg/m³ · WHO 2021 Guideline: 45 µg/m³',
    },
    no2: {
      fullName: 'Nitrogen Dioxide (NO₂)',
      sources: 'High-temperature fossil fuel combustion in automobiles, thermal power plants, and industrial boilers.',
      healthRisk: 'Inflames airway linings, reduces lung capacity, and acts as a direct chemical precursor to tropospheric ozone and acid rain.',
      samplingStandard: 'CPCB 24-hour standard: 80 µg/m³ · WHO 2021 Guideline: 25 µg/m³',
    },
    so2: {
      fullName: 'Sulphur Dioxide (SO₂)',
      sources: 'Combustion of sulphur-bearing coal and petroleum in smelting facilities, refineries, and thermal stations.',
      healthRisk: 'Bronchoconstriction, severe eye irritation, and formation of corrosive secondary sulfate aerosols.',
      samplingStandard: 'CPCB 24-hour standard: 80 µg/m³ · WHO 2021 Guideline: 40 µg/m³',
    },
    co: {
      fullName: 'Carbon Monoxide (CO)',
      sources: 'Incomplete internal hydrocarbon combustion in vehicular motors and residential biomass stoves.',
      healthRisk: 'Binds preferentially to blood hemoglobin (forming carboxyhemoglobin), reducing oxygen delivery to vital organs.',
      samplingStandard: 'CPCB 8-hour permissible standard: 2.0 mg/m³',
    },
    o3: {
      fullName: 'Tropospheric Ground-Level Ozone (O₃)',
      sources: 'Secondary photochemical reaction between volatile organic compounds (VOCs) and NOx in the presence of strong solar UV.',
      healthRisk: 'Potent pulmonary irritant; damages lung tissue, triggers asthma attacks, and suppresses crop yields.',
      samplingStandard: 'CPCB 8-hour permissible standard: 100 µg/m³ · WHO Guideline: 100 µg/m³',
    },
  };

  const formattedSymbols: Record<string, string> = {
    pm25: 'PM₂.₅',
    pm10: 'PM₁₀',
    no2: 'NO₂',
    so2: 'SO₂',
    co: 'CO',
    o3: 'O₃',
  };

  const handleCardClick = (pollutant: string) => {
    if (selectedPollutant === pollutant) {
      setSelectedPollutant(null);
    } else {
      setSelectedPollutant(pollutant);
      if (onSelectPollutant) onSelectPollutant(pollutant);
    }
  };

  return (
    <div className="space-y-3">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {subIndices.map((item) => {
          const isSelected = selectedPollutant === item.pollutant;
          const safeLimit: Record<string, number> = {
            pm25: 60,
            pm10: 100,
            no2: 80,
            so2: 80,
            co: 2.0,
            o3: 100,
          };
          const limit = safeLimit[item.pollutant] || 100;
          const ratio = Math.min(200, Math.round((item.concentration / limit) * 100));

          return (
            <div
              key={item.pollutant}
              onClick={() => handleCardClick(item.pollutant)}
              className={`p-3.5 bg-[#0e1422] rounded-xl cursor-pointer transition-all duration-200 flex flex-col justify-between group select-none ${
                isSelected
                  ? 'border border-blue-500 ring-1 ring-blue-500/30'
                  : 'border border-slate-800 hover:border-slate-700 hover:bg-[#121a2c]'
              }`}
              style={{
                borderColor: isSelected ? item.color : undefined,
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold tracking-wider text-slate-200 group-hover:text-blue-300 transition-colors">
                    {formattedSymbols[item.pollutant] || item.pollutant.toUpperCase()}
                  </span>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${item.color}18`,
                      color: item.color,
                      border: `1px solid ${item.color}40`,
                    }}
                  >
                    Sub: {item.subIndex}
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline gap-1">
                  <span
                    className="text-2xl font-black font-mono tabular-nums tracking-tight transition-colors"
                    style={{ color: item.color }}
                  >
                    {item.concentration}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.unit}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>Permissible: {limit}</span>
                  <span className={ratio > 100 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                    {ratio}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ratio)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{item.category}</span>
                  <span className="group-hover:text-blue-400 transition-colors">Details &rarr;</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Chemical & Emission Profile Drawer */}
      {selectedPollutant && chemicalProfiles[selectedPollutant] && (
        <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl shadow-xl animate-fadeIn space-y-3">
          <div className="flex items-start justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-blue-400 mr-2">
                  Chemical Telemetry Profile:
                </span>
                <span className="text-sm text-white font-semibold">
                  {chemicalProfiles[selectedPollutant].fullName}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPollutant(null)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5 text-[11px] font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>PRIMARY ANTHROPOGENIC SOURCES</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                {chemicalProfiles[selectedPollutant].sources}
              </p>
            </div>

            <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5 text-[11px] font-mono">
                <Info className="w-3.5 h-3.5 text-rose-500" />
                <span>PHYSIOLOGICAL & TOXICITY HAZARDS</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                {chemicalProfiles[selectedPollutant].healthRisk}
              </p>
            </div>

            <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800">
              <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5 text-[11px] font-mono">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>REGULATORY SAFETY THRESHOLDS</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-mono">
                {chemicalProfiles[selectedPollutant].samplingStandard}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
