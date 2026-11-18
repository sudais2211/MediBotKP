import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Waypoint } from '../types/telemetry';

interface RouteVisualizationProps {
  path?: Waypoint[];
  visible?: boolean;
}

export function RouteVisualization({ path, visible = true }: RouteVisualizationProps) {
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 2.0;
    }
  });

  const lineObject = useMemo(() => {
    if (!path || path.length < 2 || !visible) return null;

    const points: THREE.Vector3[] = path.map(p => new THREE.Vector3(p.x, 0.05, p.z));
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3, transparent: true, opacity: 0.85 });
    return new THREE.Line(geom, mat);
  }, [path, visible]);

  if (!visible || !path || path.length === 0) return null;

  const goal = path[path.length - 1];

  return (
    <group>
      {/* 1. Continuous Path Ribbon */}
      {lineObject && <primitive object={lineObject} />}

      {/* 2. Waypoint discs on floor */}
      {path.map((wp, idx) => (
        <mesh key={idx} position={[wp.x, 0.04, wp.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* 3. Destination Beacon at final waypoint */}
      {goal && (
        <group position={[goal.x, 0, goal.z]}>
          {/* Ground Target Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.35, 0.45, 32]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
          </mesh>
          {/* Pulsing Light Column */}
          <mesh ref={beaconRef} position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.6, 16]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.35} />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color="#10b981" intensity={1.5} distance={3.5} />
        </group>
      )}
    </group>
  );
}
