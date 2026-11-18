import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Department } from '../types/telemetry';

interface HospitalSceneProps {
  departments: Department[];
  focusedDepartment?: Department | null;
  onSelectDepartment?: (dept: Department) => void;
  showLabels?: boolean;
}

export function HospitalScene({
  departments,
  focusedDepartment,
  onSelectDepartment,
  showLabels = true
}: HospitalSceneProps) {

  return (
    <group>
      {/* 1. Floor Ground Plane */}
      {/* Main Hospital Vinyl Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[36, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Corridor Floor Navigation Markings */}
      {/* Main East-West Corridor Runner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[32, 2.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* West Hallway (Pharmacy to Dock) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.002, 0]}>
        <planeGeometry args={[2.6, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* Center Hallway (Reception to Nursing Station) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[2.6, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* East Hallway (ED to Lab) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0.002, 0]}>
        <planeGeometry args={[2.6, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* 2. Outer Hospital Perimeter Walls (2.6m high) */}
      {/* North Wall */}
      <mesh position={[0, 1.3, -12]} castShadow receiveShadow>
        <boxGeometry args={[36, 2.6, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, 1.3, 12]} castShadow receiveShadow>
        <boxGeometry args={[36, 2.6, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-18, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 2.6, 24]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      {/* East Wall */}
      <mesh position={[18, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 2.6, 24]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* 3. Interior Walls (Configured with Doorways) */}
      {/* Pharmacy South Walls */}
      <mesh position={[-14.25, 1.3, 3]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[-5.5, 1.3, 3]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      {/* Pharmacy East Wall */}
      <mesh position={[-10, 1.3, 8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Dock North Walls */}
      <mesh position={[-14.25, 1.3, -3]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[-5.5, 1.3, -3]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      {/* Dock East Wall */}
      <mesh position={[-10, 1.3, -8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Room 101 / Reception Dividing Walls */}
      <mesh position={[-3.5, 1.3, 8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      {/* Room 103 Dividing Wall */}
      <mesh position={[-3.5, 1.3, -8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Reception / Lobby Walls */}
      <mesh position={[-0.5, 1.3, 8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[3.5, 1.3, 8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Nursing Station Surrounds */}
      <mesh position={[-2.0, 1.3, -7.0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 4.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[4.0, 1.3, -7.0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 4.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[1.0, 1.3, -9.0]} castShadow receiveShadow>
        <boxGeometry args={[6.0, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Room 102 & ED South Walls */}
      <mesh position={[5.5, 1.3, 3]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[14.25, 1.3, 3]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[10.0, 1.3, 8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* Lab & Room 104 North Walls */}
      <mesh position={[5.5, 1.3, -3]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[14.25, 1.3, -3]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 2.6, 0.2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>
      <mesh position={[10.0, 1.3, -8.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 2.6, 7.0]} />
        <meshStandardMaterial color="#475569" roughness={0.4} />
      </mesh>

      {/* 4. Hospital Department Furniture & Fixtures */}

      {/* Charging Dock Station (-13.0, -6.5) */}
      <group position={[-13.0, 0, -6.5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <planeGeometry args={[1.8, 1.8]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[1.4, 0.08, 1.4]} />
          <meshStandardMaterial color="#4c1d95" metalness={0.7} />
        </mesh>
        {/* Dock Station Pillar */}
        <mesh position={[-0.6, 0.45, 0]} castShadow>
          <boxGeometry args={[0.15, 0.9, 0.4]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
        <pointLight position={[0, 0.5, 0]} color="#8b5cf6" intensity={1.5} distance={3.0} />
      </group>

      {/* Nursing Station Hub (1.0, -3.8) */}
      <group position={[1.0, 0, -3.8]}>
        {/* Main Workstation Counter */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 1.1, 1.0]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Counter Top Trim */}
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[3.3, 0.04, 1.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* Nurse Station Computer Monitors */}
        <mesh position={[-0.8, 1.3, 0.1]} castShadow>
          <boxGeometry args={[0.45, 0.3, 0.05]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.8, 1.3, 0.07]}>
          <planeGeometry args={[0.42, 0.27]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0.8, 1.3, 0.1]} castShadow>
          <boxGeometry args={[0.45, 0.3, 0.05]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.8, 1.3, 0.07]}>
          <planeGeometry args={[0.42, 0.27]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Pharmacy (-12.5, 6.0) */}
      <group position={[-12.5, 0, 6.0]}>
        {/* Medicine Storage Wall Cabinets */}
        <mesh position={[-2.5, 1.1, 2.0]} castShadow>
          <boxGeometry args={[3.8, 2.2, 1.0]} />
          <meshStandardMaterial color="#0369a1" />
        </mesh>
        {/* Pharmacy Dispensing Counter */}
        <mesh position={[1.5, 0.55, 0]} castShadow>
          <boxGeometry args={[1.2, 1.1, 2.8]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* Emergency Department (12.5, 6.0) */}
      <group position={[12.5, 0, 6.0]}>
        {/* Emergency Trauma Bed 1 */}
        <group position={[1.5, 0, 2.5]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[1.4, 0.8, 2.4]} />
            <meshStandardMaterial color="#dc2626" /> {/* Red ED Linen */}
          </mesh>
          <mesh position={[0, 0.9, 0.8]}>
            <boxGeometry args={[1.0, 0.15, 0.4]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
        {/* Emergency Trauma Bed 2 */}
        <group position={[1.5, 0, -1.5]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[1.4, 0.8, 2.4]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          <mesh position={[0, 0.9, 0.8]}>
            <boxGeometry args={[1.0, 0.15, 0.4]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* Pathology Laboratory (12.5, -6.0) */}
      <group position={[12.5, 0, -6.0]}>
        {/* Lab Workbenches */}
        <mesh position={[1.5, 0.55, -2.5]} castShadow>
          <boxGeometry args={[4.2, 1.1, 1.4]} />
          <meshStandardMaterial color="#d97706" metalness={0.4} />
        </mesh>
        {/* Analyzer Centrifuge Unit */}
        <mesh position={[1.5, 1.3, -2.5]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 0.4, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.6} />
        </mesh>
      </group>

      {/* Reception / Lobby (-2.0, 6.0) */}
      <group position={[-2.0, 0, 6.0]}>
        {/* Reception Desk */}
        <mesh position={[3.5, 0.55, 2.5]} castShadow>
          <boxGeometry args={[3.4, 1.1, 1.0]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>
        {/* Waiting Lounge Sofas */}
        <mesh position={[0.2, 0.4, 0.5]} castShadow>
          <boxGeometry args={[1.2, 0.8, 2.6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Decorative Hospital Plant */}
        <group position={[-1.2, 0, 2.5]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.25, 0.2, 0.6, 12]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color="#16a34a" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Patient Rooms 101, 102, 103, 104 Beds */}
      {/* Bed 101 (-6.0, 8.5) */}
      <group position={[-6.0, 0, 8.5]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.4, 0.7, 2.4]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      </group>
      {/* Bed 102 (6.0, 8.5) */}
      <group position={[6.0, 0, 8.5]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.4, 0.7, 2.4]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      </group>
      {/* Bed 103 (-6.0, -8.5) */}
      <group position={[-6.0, 0, -8.5]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.4, 0.7, 2.4]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      </group>
      {/* Bed 104 (6.0, -8.5) */}
      <group position={[6.0, 0, -8.5]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.4, 0.7, 2.4]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      </group>

      {/* 5. 3D Department Floating Signage & Waypoint Markers */}
      {showLabels && departments.map(dept => {
        const isFocused = focusedDepartment?.id === dept.id;
        return (
          <group key={dept.id} position={[dept.coordinates.x, 2.8, dept.coordinates.z]}>
            {/* Clickable Signboard Pin */}
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
              <meshBasicMaterial color={dept.color} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color={dept.color} />
            </mesh>

            <Html center distanceFactor={14}>
              <button
                onClick={() => onSelectDepartment?.(dept)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
                  isFocused
                    ? 'bg-cyan-500 text-white ring-2 ring-cyan-300 scale-110'
                    : 'bg-gray-900/90 text-gray-200 border border-gray-700/80 hover:bg-gray-800 hover:border-cyan-400'
                }`}
                style={{ borderLeft: `4px solid ${dept.color}` }}
              >
                <span>{dept.name}</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                  {dept.code}
                </span>
              </button>
            </Html>
          </group>
        );
      })}

      {/* 6. Lighting */}
      <ambientLight color="#f1f5f9" intensity={0.65} />
      <directionalLight
        position={[10, 25, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {/* Corridor Accent Lights */}
      <pointLight position={[-8, 3.2, 0]} color="#38bdf8" intensity={0.8} distance={10} />
      <pointLight position={[0, 3.2, 0]} color="#38bdf8" intensity={0.8} distance={10} />
      <pointLight position={[8, 3.2, 0]} color="#38bdf8" intensity={0.8} distance={10} />
    </group>
  );
}
