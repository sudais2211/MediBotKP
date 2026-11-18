import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RobotState, MissionState } from '../types/telemetry';

interface RobotProps {
  robotState?: RobotState;
  missionState?: MissionState;
}

export function Robot({ robotState, missionState }: RobotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWheelRef = useRef<THREE.Mesh>(null);
  const rightWheelRef = useRef<THREE.Mesh>(null);
  const lidarRotorRef = useRef<THREE.Group>(null);
  const lidHingeRef = useRef<THREE.Group>(null);

  // Smooth position interpolation to avoid micro-jitter
  const currentPos = useRef(new THREE.Vector3(-13, 0, -6.5));
  const currentRot = useRef(0);

  useFrame((_, delta) => {
    if (!robotState) return;

    const { pose, velocity, wheels, cargo } = robotState;

    // Smoothly update robot root pose
    const targetPos = new THREE.Vector3(pose.x, 0, pose.z);
    currentPos.current.lerp(targetPos, Math.min(1.0, delta * 25));

    // Handle smooth angular interpolation (-PI to PI wrap)
    let rotDiff = (pose.theta - currentRot.current + Math.PI) % (Math.PI * 2) - Math.PI;
    currentRot.current += rotDiff * Math.min(1.0, delta * 25);

    if (groupRef.current) {
      groupRef.current.position.copy(currentPos.current);
      // In Three.js, rotation around Y corresponds to 2D yaw angle theta
      // Since theta=0 points along +X in our 2D system, we rotate -theta around Y
      groupRef.current.rotation.y = -currentRot.current;
    }

    // Spin drive wheels according to kinematics
    if (leftWheelRef.current && rightWheelRef.current) {
      leftWheelRef.current.rotation.x = wheels.left_rad;
      rightWheelRef.current.rotation.x = wheels.right_rad;
    }

    // Spin LiDAR sensor head continuously (~10 Hz)
    if (lidarRotorRef.current) {
      lidarRotorRef.current.rotation.y += delta * 12.0;
    }

    // Animate medical compartment lid opening/closing
    if (lidHingeRef.current) {
      const targetLidAngle = -cargo.lid_open_ratio * (Math.PI * 0.42); // Open up to ~75 degrees
      lidHingeRef.current.rotation.z = THREE.MathUtils.lerp(
        lidHingeRef.current.rotation.z,
        targetLidAngle,
        Math.min(1.0, delta * 10)
      );
    }
  });

  const statusLightColor = (() => {
    if (!robotState) return '#10b981';
    const light = robotState.indicators.status_light;
    switch (light) {
      case 'red': return '#ef4444';
      case 'amber': return '#f59e0b';
      case 'purple': return '#8b5cf6';
      case 'blue': return '#06b6d4';
      default: return '#10b981';
    }
  })();

  const isEStop = robotState?.indicators.emergency_stop_triggered;
  const isCharging = robotState?.battery.is_charging;

  return (
    <group ref={groupRef} position={[-13, 0, -6.5]}>
      {/* 1. Main Chassis Base */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.28, 0.62]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Bumper Skirt (Lower Protective Trim) */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.86, 0.08, 0.66]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* LED Perimeter Status Ring / Halo */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.87, 0.025, 0.67]} />
        <meshBasicMaterial color={statusLightColor} />
      </mesh>
      <pointLight position={[0, 0.25, 0]} color={statusLightColor} intensity={0.8} distance={2.5} />

      {/* 2. Drive Wheels (Left & Right) */}
      {/* Left Drive Wheel (Z = -0.34) */}
      <group position={[0, 0.1, -0.34]}>
        <mesh ref={leftWheelRef} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
          {/* Wheel Rim Accent */}
          <mesh position={[0, 0.032, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.005, 12]} />
            <meshStandardMaterial color="#06b6d4" metalness={0.8} />
          </mesh>
        </mesh>
      </group>

      {/* Right Drive Wheel (Z = +0.34) */}
      <group position={[0, 0.1, 0.34]}>
        <mesh ref={rightWheelRef} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
          {/* Wheel Rim Accent */}
          <mesh position={[0, -0.032, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.005, 12]} />
            <meshStandardMaterial color="#06b6d4" metalness={0.8} />
          </mesh>
        </mesh>
      </group>

      {/* Front & Rear Caster Wheel Covers */}
      <mesh position={[0.32, 0.08, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.5} />
      </mesh>
      <mesh position={[-0.32, 0.08, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.5} />
      </mesh>

      {/* 3. Upper Medical Delivery Compartment & Cargo Bay */}
      <mesh position={[-0.04, 0.44, 0]} castShadow>
        <boxGeometry args={[0.54, 0.22, 0.48]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Compartment Interior Cavity */}
      <mesh position={[-0.04, 0.42, 0]}>
        <boxGeometry args={[0.48, 0.16, 0.42]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Medical Supply Package Inside Compartment (visible when loaded or during transit) */}
      {robotState?.cargo.has_package && (
        <group position={[-0.04, 0.42, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.28, 0.14, 0.24]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          {/* Medical Red Cross Icon on Package */}
          <mesh position={[0, 0.072, 0]}>
            <boxGeometry args={[0.12, 0.004, 0.04]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.072, 0]}>
            <boxGeometry args={[0.04, 0.004, 0.12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}

      {/* Compartment Motorized Lid (Animated Hinge at rear X = -0.31) */}
      <group position={[-0.31, 0.55, 0]} ref={lidHingeRef}>
        <mesh position={[0.27, 0.015, 0]} castShadow>
          <boxGeometry args={[0.54, 0.03, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
        </mesh>
        {/* Lid Handle / Status bar */}
        <mesh position={[0.48, 0.035, 0]}>
          <boxGeometry args={[0.08, 0.02, 0.32]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} />
        </mesh>
      </group>

      {/* 4. Sensor Mast & 360-Degree LiDAR */}
      <mesh position={[0.24, 0.44, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.22, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* LiDAR Base Ring */}
      <mesh position={[0.24, 0.57, 0]}>
        <cylinderGeometry args={[0.10, 0.10, 0.03, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>

      {/* Rotating LiDAR Rotor Dome */}
      <group position={[0.24, 0.62, 0]} ref={lidarRotorRef}>
        {/* Smoked Transparent Outer Glass Cover */}
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 24]} />
          <meshPhysicalMaterial
            color="#0ea5e9"
            transparent
            opacity={0.45}
            roughness={0.1}
            transmission={0.8}
            ior={1.4}
          />
        </mesh>
        {/* Inner Laser Diode & Optical Mirror */}
        <mesh position={[0.04, 0, 0]}>
          <boxGeometry args={[0.05, 0.04, 0.05]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} />
        </mesh>
        {/* Laser Emitter Aperture */}
        <mesh position={[0.07, 0, 0]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      </group>

      {/* 5. Front Stereo Vision Camera Bar */}
      <mesh position={[0.42, 0.29, 0]} castShadow>
        <boxGeometry args={[0.04, 0.06, 0.28]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Left Lens */}
      <mesh position={[0.442, 0.29, -0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} />
      </mesh>
      {/* Right Lens */}
      <mesh position={[0.442, 0.29, 0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} />
      </mesh>

      {/* Dual Headlights (casting forward beam) */}
      <mesh position={[0.41, 0.14, -0.22]}>
        <boxGeometry args={[0.02, 0.03, 0.08]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh position={[0.41, 0.14, 0.22]}>
        <boxGeometry args={[0.02, 0.03, 0.08]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <spotLight
        position={[0.45, 0.2, 0]}
        target-position={[4.0, 0, 0]}
        color="#e0f2fe"
        intensity={1.2}
        angle={Math.PI / 5}
        penumbra={0.4}
        distance={6}
      />

      {/* 6. Onboard Robot OLED Status Screen (Facing Rear/Top) */}
      <group position={[-0.26, 0.38, 0]} rotation={[0, 0, Math.PI / 6]}>
        <mesh>
          <boxGeometry args={[0.16, 0.10, 0.02]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.14, 0.08]} />
          <meshBasicMaterial color={isEStop ? '#ef4444' : isCharging ? '#8b5cf6' : '#0369a1'} />
        </mesh>
      </group>

      {/* 7. Branding Badges (RoboNex Innovations / MediBot KP) */}
      {/* Left Flank Badge */}
      <mesh position={[0, 0.26, -0.312]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.34, 0.08]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      {/* Right Flank Badge */}
      <mesh position={[0, 0.26, 0.312]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.34, 0.08]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
    </group>
  );
}
