import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraMode } from '../state/useSimulationStore';
import { RobotPose, Department } from '../types/telemetry';

interface CameraRigProps {
  mode: CameraMode;
  robotPose?: RobotPose;
  focusedDepartment?: Department | null;
}

export function CameraRig({ mode, robotPose, focusedDepartment }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, 24, 22));

  // Handle department focus click
  useEffect(() => {
    if (focusedDepartment && mode === 'orbit') {
      const { x, z } = focusedDepartment.coordinates;
      targetLookAt.current.set(x, 1, z);
      targetCamPos.current.set(x, 9, z + 8);
    }
  }, [focusedDepartment, mode]);

  // Handle camera mode change
  useEffect(() => {
    if (mode === 'topdown') {
      targetLookAt.current.set(0, 0, 0);
      targetCamPos.current.set(0, 32, 0.01);
    } else if (mode === 'orbit' && !focusedDepartment) {
      targetLookAt.current.set(0, 1, 0);
      targetCamPos.current.set(0, 20, 22);
    }
  }, [mode, focusedDepartment]);

  useFrame((_, delta) => {
    const lerpSpeed = Math.min(1.0, delta * 3.5);

    if (mode === 'follow' && robotPose) {
      const distance = 4.8;
      const height = 3.2;
      // Position camera behind robot based on robot's heading theta
      const behindX = robotPose.x - Math.cos(robotPose.theta) * distance;
      const behindZ = robotPose.z - Math.sin(robotPose.theta) * distance;

      targetCamPos.current.set(behindX, height, behindZ);
      targetLookAt.current.set(robotPose.x + Math.cos(robotPose.theta) * 1.5, 0.6, robotPose.z + Math.sin(robotPose.theta) * 1.5);

      camera.position.lerp(targetCamPos.current, lerpSpeed);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, lerpSpeed);
        controlsRef.current.update();
      }
    } else if (mode === 'fps' && robotPose) {
      // First-person view from robot's sensor mast
      const eyeHeight = 0.95;
      const forwardOffset = 0.35;
      const eyeX = robotPose.x + Math.cos(robotPose.theta) * forwardOffset;
      const eyeZ = robotPose.z + Math.sin(robotPose.theta) * forwardOffset;

      targetCamPos.current.set(eyeX, eyeHeight, eyeZ);
      targetLookAt.current.set(
        robotPose.x + Math.cos(robotPose.theta) * 6.0,
        eyeHeight - 0.1,
        robotPose.z + Math.sin(robotPose.theta) * 6.0
      );

      camera.position.lerp(targetCamPos.current, Math.min(1.0, delta * 8.0));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, Math.min(1.0, delta * 8.0));
        controlsRef.current.update();
      }
    } else {
      // Orbit / Top-down mode
      camera.position.lerp(targetCamPos.current, lerpSpeed);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, lerpSpeed);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={mode === 'topdown' ? 0.05 : Math.PI / 2 - 0.05}
      minDistance={2}
      maxDistance={45}
      enabled={mode === 'orbit' || mode === 'topdown'}
    />
  );
}
