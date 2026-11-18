import React from 'react';
import {
  Battery, BatteryCharging, Gauge, Compass, Zap,
  Activity, Shield, Eye, Layers
} from 'lucide-react';
import { RobotState } from '../types/telemetry';

interface TelemetryPanelProps {
  robotState?: RobotState;
}

export function TelemetryPanel({ robotState }: TelemetryPanelProps) {
  if (!robotState) {
    return (
      <div className="p-4 text-center text-gray-500 text-xs font-mono">
        Waiting for live telemetry stream...
      </div>
    );
  }

  const { pose, velocity, wheels, battery, indicators, cargo } = robotState;

  return (
    <div className="space-y-3">
      {/* Simulation Honesty Badge */}
      <div className="text-[10px] text-gray-400 font-mono bg-gray-900/60 p-2 rounded border border-gray-800 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-cyan-400" />
          SIMULATED KINEMATICS & BMS
        </span>
        <span className="text-cyan-400 font-semibold">20 Hz Stream</span>
      </div>

      {/* 1. Battery Gauge & BMS */}
      <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
            {battery.is_charging ? (
              <BatteryCharging className="w-4 h-4 text-purple-400 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-emerald-400" />
            )}
            <span>SIMULATED BATTERY BMS</span>
          </div>
          <span className={`text-xs font-mono font-bold ${
            battery.is_charging ? 'text-purple-400' : 'text-emerald-400'
          }`}>
            {battery.percentage.toFixed(1)}% {battery.is_charging ? '(CHARGING)' : ''}
          </span>
        </div>

        {/* Battery Bar */}
        <div className="w-full bg-gray-950 rounded-full h-2 mb-2.5 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              battery.is_charging
                ? 'bg-purple-500'
                : battery.percentage > 30 ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ width: `${battery.percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
          <div className="bg-gray-800/60 p-1.5 rounded">
            <span className="text-gray-400 block text-[9px]">VOLTAGE</span>
            <span className="text-gray-200 font-bold">{battery.voltage.toFixed(2)} V</span>
          </div>
          <div className="bg-gray-800/60 p-1.5 rounded">
            <span className="text-gray-400 block text-[9px]">CURRENT</span>
            <span className="text-gray-200 font-bold">{battery.current_draw_a.toFixed(2)} A</span>
          </div>
          <div className="bg-gray-800/60 p-1.5 rounded">
            <span className="text-gray-400 block text-[9px]">CONSUMED</span>
            <span className="text-gray-200 font-bold">{battery.wh_consumed.toFixed(1)} Wh</span>
          </div>
        </div>
      </div>

      {/* 2. Kinematics & Velocity */}
      <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-200 mb-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>VELOCITY & ODOMETRY</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2">
          <div className="bg-gray-800/60 p-2 rounded">
            <span className="text-gray-400 block text-[9px]">LINEAR SPEED</span>
            <span className="text-base font-bold text-white">
              {velocity.linear.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">m/s</span>
            </span>
          </div>
          <div className="bg-gray-800/60 p-2 rounded">
            <span className="text-gray-400 block text-[9px]">ANGULAR SPEED</span>
            <span className="text-base font-bold text-white">
              {velocity.angular.toFixed(2)} <span className="text-[10px] text-gray-400 font-normal">rad/s</span>
            </span>
          </div>
        </div>

        {/* Pose Coordinates */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
          <div className="bg-gray-800/40 p-1.5 rounded">
            <span className="text-gray-400 block text-[9px]">X (EAST)</span>
            <span className="text-cyan-300 font-bold">{pose.x.toFixed(2)} m</span>
          </div>
          <div className="bg-gray-800/40 p-1.5 rounded">
            <span className="text-gray-400 block text-[9px]">Z (NORTH)</span>
            <span className="text-cyan-300 font-bold">{pose.z.toFixed(2)} m</span>
          </div>
          <div className="bg-gray-800/40 p-1.5 rounded">
            <span className="text-gray-400 block text-[9px]">HEADING</span>
            <span className="text-cyan-300 font-bold">{pose.theta_deg.toFixed(1)}°</span>
          </div>
        </div>
      </div>

      {/* 3. Subsystem Health Indicators */}
      <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800">
        <div className="text-xs font-bold text-gray-200 mb-2 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>VIRTUAL SUBSYSTEM STATUS</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="flex items-center justify-between p-1.5 rounded bg-gray-800/40 border border-gray-700/40">
            <span className="text-gray-400">Virtual LiDAR</span>
            <span className="text-emerald-400 font-bold">180 RAYS (ACTIVE)</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-gray-800/40 border border-gray-700/40">
            <span className="text-gray-400">Sim. Perception</span>
            <span className="text-emerald-400 font-bold">ACTIVE (120° FOV)</span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-gray-800/40 border border-gray-700/40">
            <span className="text-gray-400">Safety State</span>
            <span className={`font-bold ${
              indicators.safety_level === 'NORMAL' ? 'text-emerald-400' :
              indicators.safety_level === 'CAUTION' ? 'text-amber-400' : 'text-red-400'
            }`}>
              {indicators.safety_level}
            </span>
          </div>
          <div className="flex items-center justify-between p-1.5 rounded bg-gray-800/40 border border-gray-700/40">
            <span className="text-gray-400">Hardware E-Stop</span>
            <span className={`font-bold ${
              indicators.emergency_stop_triggered ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            }`}>
              {indicators.emergency_stop_triggered ? 'ENGAGED' : 'CLEAR'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
