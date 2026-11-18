import React from 'react';
import {
  TrendingUp, Award, Clock, Compass, ShieldAlert,
  Zap, Route, CheckCircle
} from 'lucide-react';
import { SimulationMetrics, BatteryState } from '../types/telemetry';

interface MetricsPanelProps {
  metrics?: SimulationMetrics;
  battery?: BatteryState;
  missionDuration?: number;
}

export function MetricsPanel({
  metrics,
  battery,
  missionDuration = 0
}: MetricsPanelProps) {
  return (
    <div className="space-y-3">
      {/* Simulation Metrics Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-3 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>ESTIMATED SIMULATION METRICS</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
            Digital Twin Analytics
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-mono">
          Performance metrics derived deterministically from kinematic integration and A* replanning logs.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-1">
            <Route className="w-3.5 h-3.5 text-cyan-400" />
            <span>TOTAL DISTANCE</span>
          </div>
          <span className="text-xl font-bold text-white">
            {metrics ? metrics.total_distance_traveled_m.toFixed(1) : '0.0'}{' '}
            <span className="text-xs text-gray-400 font-normal">m</span>
          </span>
        </div>

        <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACTIVE RUNTIME</span>
          </div>
          <span className="text-xl font-bold text-white">
            {missionDuration.toFixed(1)}{' '}
            <span className="text-xs text-gray-400 font-normal">s</span>
          </span>
        </div>

        <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>OBSTACLES DETECTED</span>
          </div>
          <span className="text-xl font-bold text-amber-300">
            {metrics ? metrics.obstacles_avoided : 0}
          </span>
        </div>

        <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-1">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>A* REROUTES</span>
          </div>
          <span className="text-xl font-bold text-purple-300">
            {metrics ? metrics.total_reroutes : 0}
          </span>
        </div>

        <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-1">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>OBSTACLE HOLD TIME</span>
          </div>
          <span className="text-xl font-bold text-rose-300">
            {metrics ? metrics.time_stopped_for_obstacles_s.toFixed(1) : '0.0'}{' '}
            <span className="text-xs text-gray-400 font-normal">s</span>
          </span>
        </div>

        <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mb-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>ENERGY USED</span>
          </div>
          <span className="text-xl font-bold text-yellow-300">
            {battery ? battery.wh_consumed.toFixed(1) : '0.0'}{' '}
            <span className="text-xs text-gray-400 font-normal">Wh</span>
          </span>
        </div>
      </div>
    </div>
  );
}
