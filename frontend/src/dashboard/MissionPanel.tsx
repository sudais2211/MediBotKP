import React from 'react';
import {
  Package, MapPin, ArrowRight, Clock, ShieldCheck,
  CheckCircle2, Box, AlertCircle
} from 'lucide-react';
import { Department, MissionState, CargoState } from '../types/telemetry';

interface MissionPanelProps {
  departments: Department[];
  missionState?: MissionState;
  cargoState?: CargoState;
  pickupDept: string;
  setPickupDept: (val: string) => void;
  deliveryDept: string;
  setDeliveryDept: (val: string) => void;
  packageType: string;
  setPackageType: (val: string) => void;
  priority: string;
  setPriority: (val: string) => void;
  onStartMission: () => void;
}

export function MissionPanel({
  departments,
  missionState,
  cargoState,
  pickupDept,
  setPickupDept,
  deliveryDept,
  setDeliveryDept,
  packageType,
  setPackageType,
  priority,
  setPriority,
  onStartMission
}: MissionPanelProps) {
  const activeTask = missionState?.active_task;

  return (
    <div className="space-y-4">
      {/* 1. Active Task Status Card (if running or completed) */}
      {activeTask ? (
        <div className="bg-gray-800/80 rounded-xl p-3.5 border border-cyan-800/50 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between pb-2 border-b border-gray-700/60 mb-2.5">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-white tracking-wide">
                ACTIVE TASK: {activeTask.id}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              activeTask.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
              activeTask.status.startsWith('EN_ROUTE') ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse' :
              'bg-amber-950 text-amber-300 border border-amber-700'
            }`}>
              {activeTask.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Route Header */}
          <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-gray-900/60 rounded-lg mb-2">
            <div className="flex items-center gap-1.5 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{activeTask.pickup_dept_id.toUpperCase()}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            <div className="flex items-center gap-1.5 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{activeTask.delivery_dept_id.toUpperCase()}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
            <div className="bg-gray-900/40 p-2 rounded border border-gray-700/50">
              <span className="text-gray-400 block text-[10px]">PACKAGE TYPE</span>
              <span className="font-semibold text-cyan-200">{activeTask.package_type}</span>
            </div>
            <div className="bg-gray-900/40 p-2 rounded border border-gray-700/50">
              <span className="text-gray-400 block text-[10px]">PRIORITY</span>
              <span className="font-semibold text-amber-400">{activeTask.priority}</span>
            </div>
            <div className="bg-gray-900/40 p-2 rounded border border-gray-700/50">
              <span className="text-gray-400 block text-[10px]">DISTANCE REMAINING</span>
              <span className="font-mono font-bold text-white">
                {missionState ? `${missionState.distance_to_goal_m.toFixed(1)} m` : '--'}
              </span>
            </div>
            <div className="bg-gray-900/40 p-2 rounded border border-gray-700/50">
              <span className="text-gray-400 block text-[10px]">ESTIMATED ETA</span>
              <span className="font-mono font-bold text-emerald-400">
                {missionState ? `${missionState.estimated_eta_seconds.toFixed(0)} s` : '--'}
              </span>
            </div>
          </div>

          {/* Cargo Compartment Status Bar */}
          <div className="bg-gray-900/60 p-2 rounded-lg border border-gray-700/60">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-gray-400 flex items-center gap-1">
                <Box className="w-3 h-3 text-cyan-400" />
                Medical Compartment Lid:
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {cargoState?.lid_open_ratio && cargoState.lid_open_ratio > 0.05
                  ? `OPEN ${(cargoState.lid_open_ratio * 100).toFixed(0)}%`
                  : cargoState?.has_package
                  ? 'LOCKED & SECURED'
                  : 'CLOSED (EMPTY)'}
              </span>
            </div>
            <div className="w-full bg-gray-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${(cargoState?.lid_open_ratio || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. Delivery Task Dispatcher & Form */}
      <div className="bg-gray-900/80 rounded-xl p-3.5 border border-gray-800 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-cyan-400" />
          Create Medical Delivery Task
        </h3>

        <div className="space-y-3">
          {/* Pickup Selection */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              1. Pickup Location
            </label>
            <select
              value={pickupDept}
              onChange={(e) => setPickupDept(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {departments.filter(d => d.id !== 'dock').map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Destination */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              2. Delivery Destination
            </label>
            <select
              value={deliveryDept}
              onChange={(e) => setDeliveryDept(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {departments.filter(d => d.id !== 'dock' && d.id !== pickupDept).map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Package Type */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              3. Medical Supply Cargo Type
            </label>
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="Cold-Chain Biologics">Cold-Chain Biologics (Insulin/Vaccines, 2-8°C)</option>
              <option value="Emergency Blood Units">Emergency Packed Red Blood Cells (Type O-)</option>
              <option value="Controlled Narcotics">Controlled Pharmaceuticals (Secured Dispenser)</option>
              <option value="STAT Pathology Samples">STAT Pathology & Blood Gas Vials</option>
              <option value="Surgical Suture Packs">Sterile Surgical Sutures & Prep Kits</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">
              4. Task Urgency Priority
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['LOW', 'NORMAL', 'HIGH', 'STAT_CRITICAL'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1 text-[10px] font-bold rounded border transition-all ${
                    priority === p
                      ? p === 'STAT_CRITICAL'
                        ? 'bg-red-600 text-white border-red-400'
                        : 'bg-cyan-600 text-white border-cyan-400'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750'
                  }`}
                >
                  {p.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Start Mission Button */}
          <button
            onClick={onStartMission}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Assign Task & Start Mission</span>
          </button>
        </div>
      </div>
    </div>
  );
}
