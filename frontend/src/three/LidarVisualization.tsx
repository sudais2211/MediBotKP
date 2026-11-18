import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LidarScan, RobotPose } from '../types/telemetry';

interface LidarVisualizationProps {
  lidarData?: LidarScan;
  robotPose?: RobotPose;
  showRays?: boolean;
  showPoints?: boolean;
}

export function LidarVisualization({
  lidarData,
  robotPose,
  showRays = true,
  showPoints = true
}: LidarVisualizationProps) {
  const sweepRingRef = useRef<THREE.Mesh>(null);

  // Animate the rotating LiDAR sweep indicator
  useFrame((_, delta) => {
    if (sweepRingRef.current) {
      sweepRingRef.current.rotation.z -= delta * 6.0;
    }
  });

  // Build ray lines geometry: pair of vertices [robot_pos, hit_pos]
  const rayLinesGeometry = useMemo(() => {
    if (!lidarData || !robotPose || !showRays) return null;

    const positions: number[] = [];
    const colors: number[] = [];
    const sensorY = 0.62;

    const rx = robotPose.x;
    const rz = robotPose.z;

    // Pick every 2nd or 3rd ray to maintain crisp performance
    for (let i = 0; i < lidarData.hit_points.length; i += 2) {
      const pt = lidarData.hit_points[i];
      // Ray start
      positions.push(rx, sensorY, rz);
      // Ray end (hit point)
      positions.push(pt.x, sensorY, pt.z);

      // Color based on range distance
      if (pt.range < 1.2) {
        colors.push(0.95, 0.2, 0.2); // Red for critical stop zone
        colors.push(0.95, 0.2, 0.2);
      } else if (pt.range < 2.5) {
        colors.push(0.95, 0.65, 0.1); // Amber for warning zone
        colors.push(0.95, 0.65, 0.1);
      } else {
        colors.push(0.02, 0.72, 0.85); // Cyan for normal zone
        colors.push(0.02, 0.72, 0.85);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geom;
  }, [lidarData, robotPose, showRays]);

  // Build point cloud geometry for hit points
  const pointsGeometry = useMemo(() => {
    if (!lidarData || !showPoints) return null;

    const positions: number[] = [];
    const colors: number[] = [];
    const sensorY = 0.62;

    for (const pt of lidarData.hit_points) {
      positions.push(pt.x, sensorY, pt.z);
      if (pt.range < 1.2) {
        colors.push(1.0, 0.15, 0.15);
      } else if (pt.range < 2.5) {
        colors.push(1.0, 0.7, 0.0);
      } else {
        colors.push(0.0, 0.9, 1.0);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geom;
  }, [lidarData, showPoints]);

  if (!robotPose) return null;

  return (
    <group>
      {/* 1. Raycast laser lines */}
      {showRays && rayLinesGeometry && (
        <lineSegments geometry={rayLinesGeometry}>
          <lineBasicMaterial vertexColors transparent opacity={0.35} linewidth={1} />
        </lineSegments>
      )}

      {/* 2. Laser hit points (Point Cloud) */}
      {showPoints && pointsGeometry && (
        <points geometry={pointsGeometry}>
          <pointsMaterial size={0.09} vertexColors transparent opacity={0.9} />
        </points>
      )}

      {/* 3. Safety Proximity Circles centered on robot */}
      <group position={[robotPose.x, 0.02, robotPose.z]}>
        {/* Critical Stop Zone Circle (1.1m) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.08, 1.12, 48]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
        </mesh>

        {/* Caution Warning Zone Circle (2.4m) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.38, 2.42, 64]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} />
        </mesh>

        {/* Rotating LiDAR Sweep Fan Graphic */}
        <mesh ref={sweepRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 3.5, 32, 1, 0, Math.PI / 3]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
