/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComputedAQI } from '../types/aqi';
import { ShieldAlert, HeartPulse, Baby, UserCheck, AlertTriangle } from 'lucide-react';

interface HealthAdvisoryCardProps {
  computedAQI: ComputedAQI;
}

export const HealthAdvisoryCard: React.FC<HealthAdvisoryCardProps> = ({ computedAQI }) => {
  const { aqi, category, dominantPollutant } = computedAQI;

  // Actionable advisory based on standard scientific health tiers
  const getAdvisories = () => {
    if (aqi <= 50) {
      return {
        mask: 'No filtration mask required',
        ventilation: 'Ideal for natural ventilation. Keep windows open freely.',
        outdoor: 'Optimal conditions for intensive outdoor exercise and sports.',
        sensitive: 'Safe for all sensitive groups with respiratory or cardiovascular conditions.',
      };
    } else if (aqi <= 100) {
      return {
        mask: 'Optional along dense vehicular traffic corridors',
        ventilation: 'Acceptable window ventilation throughout the day.',
        outdoor: 'Normal outdoor activities recommended for healthy individuals.',
        sensitive: 'Unusually sensitive individuals should monitor mild throat or eye irritation.',
      };
    } else if (aqi <= 200) {
      return {
        mask: 'Recommended (N95 / FFP2) during peak commute hours',
        ventilation: 'Close windows during rush hour (8-10 AM & 7-10 PM).',
        outdoor: 'Reduce prolonged or heavy outdoor cardiovascular exertion.',
        sensitive: 'Individuals with asthma should carry reliever inhalers at all times.',
      };
    } else if (aqi <= 300) {
      return {
        mask: 'Mandatory N95 respirator mask outdoors',
        ventilation: 'Keep windows shut. Operate indoor HEPA air purification units.',
        outdoor: 'Avoid morning outdoor jogs or strenuous cardio activities outside.',
        sensitive: 'Elderly individuals, cardiac patients, and children must limit outdoor exposure.',
      };
    } else {
      return {
        mask: 'Strict N95 / FFP3 respirator with complete perimeter seal',
        ventilation: 'Seal room doors and windows. Run HEPA filtration at maximum throughput.',
        outdoor: 'Hazardous: suspend all outdoor sports and public assemblies.',
        sensitive: 'Emergency condition: seek immediate medical care if experiencing chest tightness.',
      };
    }
  };

  const advice = getAdvisories();

  return (
    <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
            Health Risk & Preventive Action Guide
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Advisory Tier: <span className="text-slate-100 font-semibold">{category}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1.5">
            <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Respiratory & Cardiac</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {advice.sensitive}
          </p>
        </div>

        <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1.5">
            <Baby className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Pediatric & Geriatric</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Lungs develop acute sensitivity under high {dominantPollutant.split(' ')[0]} concentrations.
          </p>
        </div>

        <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1.5">
            <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Outdoor Athletics</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {advice.outdoor}
          </p>
        </div>

        <div className="p-3 bg-[#090d17] rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Filtration & Ventilation</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {advice.mask}
          </p>
        </div>
      </div>
    </div>
  );
};
