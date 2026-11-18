import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SimulatedObstacle } from '../types/telemetry';

interface ObstaclesProps {
  obstacles?: SimulatedObstacle[];
}

export function Obstacles({ obstacles = [] }: ObstaclesProps) {
  return (
    <group>
      {obstacles.map(obs => {
        if (!obs.is_active) return null;

        if (obs.type === 'VIRTUAL_PERSONNEL') {
          return <HumanObstacle key={obs.id} obstacle={obs} />;
        } else if (obs.type === 'MEDICAL_CART') {
          return <MedicalCartObstacle key={obs.id} obstacle={obs} />;
        } else {
          return <GenericObstacle key={obs.id} obstacle={obs} />;
        }
      })}
    </group>
  );
}

function HumanObstacle({ obstacle }: { obstacle: SimulatedObstacle }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Subtle idle breathing sway
      const t = clock.getElapsedTime() * 2.0;
      groupRef.current.position.y = Math.sin(t) * 0.015;
    }
  });

  return (
    <group position={[obstacle.x, 0, obstacle.z]}>
      <group ref={groupRef}>
        {/* Safety Footprint Cylinder */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[obstacle.radius - 0.03, obstacle.radius, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
        </mesh>

        {/* 1. Legs */}
        <mesh position={[-0.1, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.84, 16]} />
          <meshStandardMaterial color="#0284c7" /> {/* Medical scrubs trousers */}
        </mesh>
        <mesh position={[0.1, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.84, 16]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>

        {/* 2. Torso (Doctor's Lab Coat) */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <boxGeometry args={[0.38, 0.65, 0.22]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>

        {/* Inner Scrub Shirt */}
        <mesh position={[0, 1.25, 0.112]}>
          <planeGeometry args={[0.16, 0.22]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>

        {/* 3. Arms */}
        <mesh position={[-0.24, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.24, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* 4. Head & Face */}
        <mesh ref={headRef} position={[0, 1.62, 0]} castShadow>
          <sphereGeometry args={[0.12, 20, 20]} />
          <meshStandardMaterial color="#fdba74" roughness={0.6} />
        </mesh>

        {/* Doctor's Scrub Cap */}
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.125, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>

        {/* Stethoscope around neck */}
        <mesh position={[0, 1.35, 0.12]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.08, 0.015, 8, 24, Math.PI * 1.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* Floating AI Perception HUD Tag above Head */}
      <Html position={[0, 1.95, 0]} center distanceFactor={12}>
        <div className="bg-gray-900/90 text-amber-400 text-xs px-2 py-1 rounded border border-amber-500/60 shadow-lg whitespace-nowrap pointer-events-none backdrop-blur-sm">
          <div className="font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            {obstacle.name}
          </div>
          <div className="text-[10px] text-gray-300 font-mono">
            {obstacle.classification_label} ({(obstacle.confidence * 100).toFixed(1)}%)
          </div>
        </div>
      </Html>
    </group>
  );
}

function MedicalCartObstacle({ obstacle }: { obstacle: SimulatedObstacle }) {
  return (
    <group position={[obstacle.x, 0, obstacle.z]}>
      {/* Safety Footprint */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[obstacle.radius - 0.03, obstacle.radius, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} />
      </mesh>

      {/* Multi-tier Crash Cart Frame */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.65, 0.85, 0.45]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} /> {/* Emergency Red Cart */}
      </mesh>

      {/* Cart Drawers */}
      <mesh position={[0, 0.65, 0.23]}>
        <boxGeometry args={[0.55, 0.18, 0.02]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0, 0.42, 0.23]}>
        <boxGeometry args={[0.55, 0.18, 0.02]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* Top Defibrillator Monitor */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.25]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 1.05, 0.13]}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Small IV Pole Attached to Corner */}
      <mesh position={[0.28, 1.25, -0.18]}>
        <cylinderGeometry args={[0.012, 0.012, 1.2, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
      </mesh>

      {/* HUD Label */}
      <Html position={[0, 1.4, 0]} center distanceFactor={12}>
        <div className="bg-gray-900/90 text-cyan-400 text-xs px-2 py-0.5 rounded border border-cyan-500/60 shadow whitespace-nowrap pointer-events-none">
          <span className="font-semibold">{obstacle.name}</span>
        </div>
      </Html>
    </group>
  );
}

function GenericObstacle({ obstacle }: { obstacle: SimulatedObstacle }) {
  return (
    <group position={[obstacle.x, 0, obstacle.z]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[obstacle.radius, obstacle.radius, 0.7, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.5} />
      </mesh>
    </group>
  );
}
