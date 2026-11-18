import React from 'react';
import {
  Radar, Eye, ShieldAlert, AlertTriangle, UserCheck,
  CheckCircle, Target, Sparkles
} from 'lucide-react';
import { LidarScan, PerceptionDetection, SimulatedObstacle } from '../types/telemetry';

interface PerceptionPanelProps {
  lidarData?: LidarScan;
  detections?: PerceptionDetection[];
  obstacles?: SimulatedObstacle[];
}

export function PerceptionPanel({
  lidarData,
  detections = [],
  obstacles = []
}: PerceptionPanelProps) {
  return (
    <div className="space-y-3.5">
      {/* 1. Virtual 360-Degree LiDAR Card */}
      <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
            <Radar className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>VIRTUAL 360° PLANAR LIDAR</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            lidarData?.alert_level === 'CRITICAL_STOP' ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' :
            lidarData?.alert_level === 'CAUTION' ? 'bg-amber-950 text-amber-300 border border-amber-700' :
            'bg-emerald-950 text-emerald-300 border border-emerald-700'
          }`}>
            ZONE: {lidarData?.alert_level || 'NORMAL'}
          </span>
        </div>

        <div className="text-[10px] text-gray-400 font-mono mb-2.5 bg-gray-950/60 p-1.5 rounded border border-gray-800">
          RAYCAST SIMULATION • 180 RAYS • 2° RESOLUTION • 8.0M MAX RANGE
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="bg-gray-800/60 p-2 rounded">
            <span className="text-gray-400 block text-[9px]">CLOSEST OBSTACLE</span>
            <span className={`text-base font-bold ${
              (lidarData?.closest_distance_m || 8) < 1.2 ? 'text-red-400' :
              (lidarData?.closest_distance_m || 8) < 2.5 ? 'text-amber-400' : 'text-cyan-300'
            }`}>
              {lidarData ? `${lidarData.closest_distance_m.toFixed(2)} m` : '--'}
            </span>
          </div>
          <div className="bg-gray-800/60 p-2 rounded">
            <span className="text-gray-400 block text-[9px]">RELATIVE BEARING</span>
            <span className="text-base font-bold text-white">
              {lidarData ? `${lidarData.closest_angle_deg.toFixed(1)}°` : '--'}
            </span>
          </div>
        </div>

        {/* Safety Zone Thresholds */}
        <div className="mt-2.5 pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Stop: &lt; 1.1m
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Caution: &lt; 2.4m
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> Free: &ge; 2.4m
          </span>
        </div>
      </div>

      {/* 2. Simulated AI Perception Module Card */}
      <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>SIMULATED AI PERCEPTION MODULE</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono border border-purple-800">
            Synthetic Detections
          </span>
        </div>

        <div className="text-[10px] text-purple-300/80 font-mono mb-2.5 bg-purple-950/30 p-1.5 rounded border border-purple-900/40">
          CLEAR LABEL: Synthetic Model Inference — Not Physical Camera Data
        </div>

        {/* Detection Cards Feed */}
        <div className="space-y-2">
          {detections.length === 0 ? (
            <div className="text-center p-3 text-gray-500 text-xs font-mono bg-gray-950/40 rounded-lg">
              No obstacles detected in camera FOV (120°)
            </div>
          ) : (
            detections.map((det) => (
              <div
                key={det.detection_id}
                className="bg-gray-800/80 p-2.5 rounded-lg border border-amber-600/40 shadow"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-xs text-white">
                      {det.label}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 text-[10px] font-mono font-bold border border-amber-700">
                    {(det.confidence * 100).toFixed(1)}% CONF
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-gray-300 bg-gray-900/60 p-1.5 rounded">
                  <div>
                    <span className="text-gray-500 block text-[9px]">DISTANCE</span>
                    <span className="font-bold text-cyan-300">{det.distance_m.toFixed(2)} m</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px]">BEARING</span>
                    <span className="font-bold text-gray-200">{det.bearing_deg.toFixed(1)}°</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px]">TRACKING ID</span>
                    <span className="font-bold text-purple-300">{det.detection_id}</span>
                  </div>
                </div>

                <div className="mt-1 text-[9px] text-gray-400 italic">
                  {det.disclaimer}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
