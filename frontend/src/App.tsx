import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Compass, Eye, Camera, Layers, Activity,
  Package, History, BarChart2, Radio, MapPin, Maximize2, Crosshair
} from 'lucide-react';
import { useSimulationState, CameraMode } from './state/useSimulationStore';
import { HospitalScene } from './three/HospitalScene';
import { Robot } from './three/Robot';
import { LidarVisualization } from './three/LidarVisualization';
import { RouteVisualization } from './three/RouteVisualization';
import { Obstacles } from './three/Obstacles';
import { CameraRig } from './three/CameraRig';
import { Minimap } from './components/Minimap';
import { ControlPanel } from './dashboard/ControlPanel';
import { MissionPanel } from './dashboard/MissionPanel';
import { TelemetryPanel } from './dashboard/TelemetryPanel';
import { PerceptionPanel } from './dashboard/PerceptionPanel';
import { MetricsPanel } from './dashboard/MetricsPanel';
import { MissionHistory } from './dashboard/MissionHistory';

export function App() {
  const {
    telemetry,
    isConnected,
    isStandalone,
    departments,
    cameraMode,
    setCameraMode,
    focusedDepartment,
    setFocusedDepartment,
    showLidarRays,
    setShowLidarRays,
    showLidarPoints,
    setShowLidarPoints,
    showPlannedPath,
    setShowPlannedPath,
    showLabels,
    setShowLabels,
    showMinimap,
    setShowMinimap,
    pickupDept,
    setPickupDept,
    deliveryDept,
    setDeliveryDept,
    packageType,
    setPackageType,
    priority,
    setPriority,
    handleStartMission,
    handlePauseMission,
    handleResumeMission,
    handleEmergencyStop,
    handleReleaseEmergencyStop,
    handleReturnToBase,
    handleTriggerObstacle,
    handleResetSimulation,
  } = useSimulationState();

  const [activeTab, setActiveTab] = useState<'mission' | 'telemetry' | 'perception' | 'metrics' | 'history'>('mission');

  const robotState = telemetry?.robot;
  const missionState = telemetry?.mission;
  const lidarData = telemetry?.lidar;
  const perceptionData = telemetry?.perception;
  const obstaclesData = telemetry?.obstacles;
  const plannedPath = telemetry?.planned_path;
  const metricsData = telemetry?.metrics;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-gray-100 font-sans select-none overflow-hidden">
      {/* 1. Top Global Mission Control Panel */}
      <ControlPanel
        phase={missionState?.phase || 'DOCKED_CHARGING'}
        isEStop={robotState?.indicators.emergency_stop_triggered || false}
        isConnected={isConnected}
        isStandalone={isStandalone}
        alertBanner={telemetry?.alert_banner}
        onStart={handleStartMission}
        onPause={handlePauseMission}
        onResume={handleResumeMission}
        onEStop={handleEmergencyStop}
        onReleaseEStop={handleReleaseEmergencyStop}
        onReturnToBase={handleReturnToBase}
        onTriggerObstacle={handleTriggerObstacle}
        onReset={handleResetSimulation}
      />

      {/* 2. Main Workspace (3D Viewport + Right Side Dashboard) */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* 3D Canvas Viewport */}
        <div className="flex-1 relative bg-gradient-to-b from-[#0b0f19] to-[#030712]">
          <Canvas
            shadows
            camera={{ position: [0, 22, 22], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
          >
            <color attach="background" args={['#090d16']} />
            <fog attach="fog" args={['#090d16', 30, 75]} />

            {/* Camera Management */}
            <CameraRig
              mode={cameraMode}
              robotPose={robotState?.pose}
              focusedDepartment={focusedDepartment}
            />

            {/* Hospital Environment Geometry */}
            <HospitalScene
              departments={departments}
              focusedDepartment={focusedDepartment}
              onSelectDepartment={(dept) => {
                setFocusedDepartment(dept);
                setCameraMode('orbit');
              }}
              showLabels={showLabels}
            />

            {/* MediBot KP 3D Robot Model */}
            <Robot robotState={robotState} missionState={missionState} />

            {/* Virtual 360-Degree LiDAR Visualization */}
            <LidarVisualization
              lidarData={lidarData}
              robotPose={robotState?.pose}
              showRays={showLidarRays}
              showPoints={showLidarPoints}
            />

            {/* Planned A* Route Visualization */}
            <RouteVisualization
              path={plannedPath}
              visible={showPlannedPath}
            />

            {/* Static & Dynamic Obstacles */}
            <Obstacles obstacles={obstaclesData} />
          </Canvas>

          {/* First-Person HUD Overlay (when in FPS camera mode) */}
          {cameraMode === 'fps' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 bg-gray-900/60 p-2 rounded-lg backdrop-blur-sm border border-cyan-800/40">
                <span className="flex items-center gap-1.5 font-bold">
                  <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                  MEDIBOT KP • FORWARD SENSOR VISION STREAM
                </span>
                <span>FOV: 120° • 1080p SYNTHETIC HUD</span>
              </div>

              {/* Crosshair Center */}
              <div className="self-center flex items-center justify-center">
                <div className="w-12 h-12 border border-cyan-400/50 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>
              </div>

              <div className="text-[10px] text-gray-400 font-mono self-start bg-gray-950/70 p-2 rounded border border-gray-800">
                Simulated AI Object Tracking Active • Real-time bounding box projection
              </div>
            </div>
          )}

          {/* Floating Camera Mode Bar */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-xl border border-gray-800 shadow-xl z-10">
            {(['orbit', 'follow', 'fps', 'topdown'] as CameraMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setCameraMode(mode);
                  setFocusedDepartment(null);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                  cameraMode === mode
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {mode === 'orbit' ? 'Orbit 3D' :
                 mode === 'follow' ? 'Follow Robot' :
                 mode === 'fps' ? 'Robot POV Cam' : 'Top-Down 2D'}
              </button>
            ))}
          </div>

          {/* Department Focus Navigation Pills */}
          <div className="absolute top-14 left-3 flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md px-2 py-1 rounded-xl border border-gray-800/80 shadow-lg z-10">
            <span className="text-[10px] text-gray-500 font-mono mr-1">FOCUS:</span>
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => {
                  setFocusedDepartment(dept);
                  setCameraMode('orbit');
                }}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all cursor-pointer ${
                  focusedDepartment?.id === dept.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800'
                }`}
              >
                {dept.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Floating Visual Display Toggles */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-xl border border-gray-800 shadow-xl z-10 text-[11px]">
            <button
              onClick={() => setShowLidarRays(!showLidarRays)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                showLidarRays ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              LiDAR Rays
            </button>
            <button
              onClick={() => setShowLidarPoints(!showLidarPoints)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                showLidarPoints ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Hit Points
            </button>
            <button
              onClick={() => setShowPlannedPath(!showPlannedPath)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                showPlannedPath ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Planned Route
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                showLabels ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Room Labels
            </button>
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`px-2 py-1 rounded transition-all cursor-pointer ${
                showMinimap ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Minimap
            </button>
          </div>

          {/* Inset 2D Tactical Minimap (Bottom-Right of Canvas) */}
          {showMinimap && (
            <div className="absolute bottom-3 right-3 z-10">
              <Minimap
                robotPose={robotState?.pose}
                plannedPath={plannedPath}
                obstacles={obstaclesData}
                departments={departments}
                lidarHits={lidarData?.hit_points}
                width={220}
                height={150}
              />
            </div>
          )}
        </div>

        {/* 3. Right-Hand Side Robotics Control Dashboard */}
        <div className="w-[390px] bg-gray-950/95 border-l border-gray-800 flex flex-col z-20 shadow-2xl backdrop-blur-md">
          {/* Dashboard Navigation Tabs */}
          <div className="flex border-b border-gray-800 bg-gray-900/60 p-1">
            <button
              onClick={() => setActiveTab('mission')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'mission'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Mission</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('perception')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'perception'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Perception</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'metrics'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {activeTab === 'mission' && (
              <MissionPanel
                departments={departments}
                missionState={missionState}
                cargoState={robotState?.cargo}
                pickupDept={pickupDept}
                setPickupDept={setPickupDept}
                deliveryDept={deliveryDept}
                setDeliveryDept={setDeliveryDept}
                packageType={packageType}
                setPackageType={setPackageType}
                priority={priority}
                setPriority={setPriority}
                onStartMission={handleStartMission}
              />
            )}

            {activeTab === 'telemetry' && (
              <TelemetryPanel robotState={robotState} />
            )}

            {activeTab === 'perception' && (
              <PerceptionPanel
                lidarData={lidarData}
                detections={perceptionData}
                obstacles={obstaclesData}
              />
            )}

            {activeTab === 'metrics' && (
              <MetricsPanel
                metrics={metricsData}
                battery={robotState?.battery}
                missionDuration={missionState?.active_task?.duration_seconds || 0}
              />
            )}

            {activeTab === 'history' && (
              <MissionHistory />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
