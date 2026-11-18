import React from 'react';
import {
  Play, Pause, RotateCcw, AlertTriangle, Home,
  Radio, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { AlertBanner } from '../types/telemetry';

interface ControlPanelProps {
  phase: string;
  isEStop: boolean;
  isConnected: boolean;
  isStandalone?: boolean;
  alertBanner?: AlertBanner | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEStop: () => void;
  onReleaseEStop: () => void;
  onReturnToBase: () => void;
  onTriggerObstacle: () => void;
  onReset: () => void;
}

export function ControlPanel({
  phase,
  isEStop,
  isConnected,
  isStandalone,
  alertBanner,
  onStart,
  onPause,
  onResume,
  onEStop,
  onReleaseEStop,
  onReturnToBase,
  onTriggerObstacle,
  onReset
}: ControlPanelProps) {
  const isNavigating = ['NAVIGATING_TO_PICKUP', 'NAVIGATING_TO_DESTINATION', 'RETURNING_TO_BASE'].includes(phase);
  const isPaused = phase === 'PAUSED';

  return (
    <div className="bg-gray-900/95 border-b border-gray-800 px-4 py-2.5 backdrop-blur-md">
      {/* Simulation Honesty & Prototype Disclaimer Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded text-[11px] text-cyan-200 flex items-center justify-between mb-2 shadow-inner">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-cyan-300">DIGITAL TWIN PROTOTYPE:</span>
          <span>MediBot KP is a virtual simulation prototype. Sensor readings, AI detections, navigation behavior, and performance metrics are simulated and do not represent physical-robot field testing.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-cyan-900/80 text-[10px] font-mono text-cyan-200 border border-cyan-700/60">
            RoboNex Innovations
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-900/80 text-[10px] font-mono text-purple-200 border border-purple-700/60">
            AI Innovation Challenge 2026
          </span>
        </div>
      </div>

      {/* Dynamic Obstacle / Warning Alert Banner */}
      {alertBanner && (
        <div className={`px-3 py-1.5 rounded text-xs flex items-center gap-2 font-medium mb-2 border shadow-lg animate-pulse ${
          alertBanner.type === 'danger'
            ? 'bg-red-950/90 text-red-200 border-red-700'
            : alertBanner.type === 'warning'
            ? 'bg-amber-950/90 text-amber-200 border-amber-600'
            : alertBanner.type === 'caution'
            ? 'bg-yellow-950/80 text-yellow-200 border-yellow-700'
            : 'bg-blue-950/80 text-blue-200 border-blue-700'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="font-bold tracking-wide uppercase">{alertBanner.title}:</span>
          <span>{alertBanner.message}</span>
        </div>
      )}

      {/* Main Mission Control Button Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white">MEDIBOT KP</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-mono border border-gray-700">
                  v1.0-TWIN
                </span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span>{isStandalone ? 'In-Browser Engine (20 Hz Standalone)' : isConnected ? 'Telemetry Stream 20 Hz (WebSocket)' : 'Reconnecting...'}</span>
              </div>
            </div>
          </div>

          {/* Current Navigation Phase Chip */}
          <div className="px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-mono flex items-center gap-2">
            <span className="text-gray-400 text-[10px]">STATE:</span>
            <span className={`font-bold ${
              isEStop ? 'text-red-400' :
              phase === 'COMPLETED' ? 'text-emerald-400' :
              phase.startsWith('OBSTACLE') ? 'text-amber-400' :
              phase === 'DOCKED_CHARGING' ? 'text-purple-400' : 'text-cyan-400'
            }`}>
              {phase.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Start Mission Button */}
          <button
            onClick={onStart}
            disabled={isEStop}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Mission</span>
          </button>

          {/* Pause / Resume */}
          {isPaused ? (
            <button
              onClick={onResume}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              disabled={!isNavigating}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-all cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {/* Return to Base Dock */}
          <button
            onClick={onReturnToBase}
            disabled={isEStop || phase === 'DOCKED_CHARGING'}
            className="px-3 py-1.5 rounded-lg bg-purple-900/70 hover:bg-purple-800/80 disabled:opacity-40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 border border-purple-700/60 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dock</span>
          </button>

          {/* Trigger Demo Obstacle (Corridor Human) */}
          <button
            onClick={onTriggerObstacle}
            className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 text-xs font-semibold flex items-center gap-1.5 border border-amber-600/70 transition-all cursor-pointer"
            title="Spawns/removes simulated personnel in the delivery corridor"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Trigger Demo Obstacle</span>
          </button>

          {/* Emergency Stop Toggle */}
          {isEStop ? (
            <button
              onClick={onReleaseEStop}
              className="px-3.5 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer shadow-lg shadow-red-900/50"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Release E-Stop</span>
            </button>
          ) : (
            <button
              onClick={onEStop}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-900/40 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Emergency Stop</span>
            </button>
          )}

          {/* Reset Simulation */}
          <button
            onClick={onReset}
            className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs border border-gray-700 transition-all cursor-pointer"
            title="Reset robot to dock and clear state"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
