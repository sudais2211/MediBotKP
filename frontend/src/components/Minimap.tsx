import React, { useRef, useEffect } from 'react';
import { RobotPose, Waypoint, SimulatedObstacle, Department, LidarPoint } from '../types/telemetry';

interface MinimapProps {
  robotPose?: RobotPose;
  plannedPath?: Waypoint[];
  obstacles?: SimulatedObstacle[];
  departments?: Department[];
  lidarHits?: LidarPoint[];
  width?: number;
  height?: number;
}

export function Minimap({
  robotPose,
  plannedPath = [],
  obstacles = [],
  departments = [],
  lidarHits = [],
  width = 240,
  height = 160
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // World bounds: x in [-18, 18] (36m), z in [-12, 12] (24m)
  const worldXMin = -18;
  const worldXMax = 18;
  const worldZMin = -12;
  const worldZMax = 12;

  const toCanvas = (wx: number, wz: number) => {
    const cx = ((wx - worldXMin) / (worldXMax - worldXMin)) * width;
    const cy = ((wz - worldZMin) / (worldZMax - worldZMin)) * height;
    return { cx, cy };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = -16; x <= 16; x += 4) {
      const p1 = toCanvas(x, -12);
      const p2 = toCanvas(x, 12);
      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.lineTo(p2.cx, p2.cy);
      ctx.stroke();
    }
    for (let z = -10; z <= 10; z += 4) {
      const p1 = toCanvas(-18, z);
      const p2 = toCanvas(18, z);
      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.lineTo(p2.cx, p2.cy);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Draw main corridors in subtle lighter tone
    ctx.fillStyle = '#172554';
    const c1 = toCanvas(-16, -1.5);
    const c2 = toCanvas(16, 1.5);
    ctx.fillRect(c1.cx, c1.cy, c2.cx - c1.cx, c2.cy - c1.cy);

    // Draw departments
    departments.forEach(dept => {
      const { cx, cy } = toCanvas(dept.coordinates.x, dept.coordinates.z);
      ctx.fillStyle = dept.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '7px sans-serif';
      ctx.fillText(dept.code, cx - 10, cy - 5);
    });

    // Draw Planned Path
    if (plannedPath.length > 1) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      const start = toCanvas(plannedPath[0].x, plannedPath[0].z);
      ctx.moveTo(start.cx, start.cy);
      for (let i = 1; i < plannedPath.length; i++) {
        const pt = toCanvas(plannedPath[i].x, plannedPath[i].z);
        ctx.lineTo(pt.cx, pt.cy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw LiDAR Hit Points
    ctx.fillStyle = '#06b6d4';
    lidarHits.forEach(pt => {
      const { cx, cy } = toCanvas(pt.x, pt.z);
      ctx.fillRect(cx - 0.75, cy - 0.75, 1.5, 1.5);
    });

    // Draw Obstacles
    obstacles.forEach(obs => {
      if (!obs.is_active) return;
      const { cx, cy } = toCanvas(obs.x, obs.z);
      const radPix = (obs.radius / (worldXMax - worldXMin)) * width;

      ctx.fillStyle = obs.type === 'VIRTUAL_PERSONNEL' ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(3, radPix), 0, Math.PI * 2);
      ctx.fill();

      // Outer warning halo
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(6, radPix * 2), 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Robot Pose
    if (robotPose) {
      const { cx, cy } = toCanvas(robotPose.x, robotPose.z);

      // Heading direction arrow
      const arrowLen = 10;
      const tipX = cx + Math.cos(robotPose.theta) * arrowLen;
      const tipY = cy + Math.sin(robotPose.theta) * arrowLen;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      // Robot Body Disc
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [robotPose, plannedPath, obstacles, departments, lidarHits, width, height]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-700/80 bg-gray-900/90 shadow-2xl backdrop-blur-md">
      <div className="absolute top-1 left-2 flex items-center justify-between w-[92%] z-10 pointer-events-none">
        <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-gray-400">
          2D Occupancy Tactical Minimap
        </span>
        <span className="text-[9px] px-1 rounded bg-cyan-950/80 text-cyan-400 font-mono border border-cyan-800/40">
          Scale 1:150
        </span>
      </div>
      <canvas ref={canvasRef} width={width} height={height} className="block" />
    </div>
  );
}
