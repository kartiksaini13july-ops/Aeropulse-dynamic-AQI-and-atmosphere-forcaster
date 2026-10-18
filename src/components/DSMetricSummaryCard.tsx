/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { StationFullData } from '../types/aqi';
import { trainAndEvaluateAtmosphericModels } from '../services/mlPredictiveEngine';
import { Cpu, ChevronRight } from 'lucide-react';

interface DSMetricSummaryCardProps {
  stationData: StationFullData;
  onOpenMLStudio: () => void;
}

export const DSMetricSummaryCard: React.FC<DSMetricSummaryCardProps> = ({
  stationData,
  onOpenMLStudio,
}) => {
  const modelResult = useMemo(() => {
    try {
      const models = trainAndEvaluateAtmosphericModels(stationData.hourlyHistory);
      return models.ridge;
    } catch {
      return null;
    }
  }, [stationData.hourlyHistory]);

  if (!modelResult) return null;

  const topFeature = modelResult.features[0];

  return (
    <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Statistical Model & Predictive Diagnostics</h3>
        </div>
        <button
          onClick={onOpenMLStudio}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium font-mono"
        >
          <span>Open ML Studio</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-2.5 bg-[#090d17] rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase">MODEL R² FIDELITY</span>
          <div className="text-xl font-bold text-blue-300 tabular-nums mt-0.5">
            {modelResult.metrics.rSquared}
          </div>
          <span className="text-[9px] text-slate-500">Ridge (L2) Regularized</span>
        </div>

        <div className="p-2.5 bg-[#090d17] rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase">PREDICTIVE RMSE</span>
          <div className="text-xl font-bold text-slate-200 tabular-nums mt-0.5">
            {modelResult.metrics.rmse} <span className="text-[10px] text-slate-400 font-normal">µg</span>
          </div>
          <span className="text-[9px] text-slate-500">Residual dispersion</span>
        </div>
      </div>

      {topFeature && (
        <div className="p-2.5 bg-[#090d17] rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <div className="truncate pr-2">
            <span className="text-[10px] text-slate-500 block">PRIMARY SENSITIVITY DRIVER:</span>
            <span className="text-slate-200 font-bold truncate block">{topFeature.displayName}</span>
          </div>
          <div className="text-right shrink-0">
            <span
              className={`font-bold ${
                topFeature.direction === 'positive' ? 'text-blue-400' : 'text-amber-400'
              }`}
            >
              β = {topFeature.standardizedBeta > 0 ? '+' : ''}
              {topFeature.standardizedBeta}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
