import { useState, useEffect, useCallback, useRef } from 'react';
import { TelemetryPacket, Department } from '../types/telemetry';
import * as api from '../api/client';
import { ClientSimulationEngine } from '../simulation/clientSimulationEngine';
import defaultDepartments from '../data/departments.json';

export type CameraMode = 'orbit' | 'follow' | 'fps' | 'topdown';

export function useSimulationState() {
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>(defaultDepartments as Department[]);
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');
  const [focusedDepartment, setFocusedDepartment] = useState<Department | null>(null);

  // Client-side fallback simulation engine for standalone GitHub Pages mode
  const clientSimRef = useRef<ClientSimulationEngine | null>(null);

  // Visual toggles
  const [showLidarRays, setShowLidarRays] = useState(true);
  const [showLidarPoints, setShowLidarPoints] = useState(true);
  const [showPlannedPath, setShowPlannedPath] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  // Mission form state
  const [pickupDept, setPickupDept] = useState('pharmacy');
  const [deliveryDept, setDeliveryDept] = useState('nursing_station');
  const [packageType, setPackageType] = useState('Cold-Chain Biologics');
  const [priority, setPriority] = useState('HIGH');

  // Load departments on mount
  useEffect(() => {
    api.fetchDepartments()
      .then(depts => {
        if (depts && depts.length > 0) setDepartments(depts);
      })
      .catch(() => {
        // Fallback to bundled departments
        setDepartments(defaultDepartments as Department[]);
      });
  }, []);

  // Initialize Dual-Mode Telemetry Connection (Backend WebSocket with Automatic Standalone In-Browser Fallback)
  useEffect(() => {
    if (!clientSimRef.current) {
      clientSimRef.current = new ClientSimulationEngine();
    }

    let backendConnected = false;

    // Timeout: if backend WS doesn't connect within 1.5s (e.g. GitHub Pages), engage client engine
    const fallbackTimer = setTimeout(() => {
      if (!backendConnected) {
        setIsStandalone(true);
        clientSimRef.current?.start((packet) => setTelemetry(packet));
      }
    }, 1500);

    const ws = new api.TelemetryWebSocket(
      (packet) => {
        setTelemetry(packet);
      },
      (connected) => {
        backendConnected = connected;
        setIsConnected(connected);
        if (connected) {
          clearTimeout(fallbackTimer);
          setIsStandalone(false);
          clientSimRef.current?.stop();
        } else {
          // If disconnected, fallback to standalone simulation
          setIsStandalone(true);
          clientSimRef.current?.start((packet) => setTelemetry(packet));
        }
      }
    );

    return () => {
      clearTimeout(fallbackTimer);
      ws.disconnect();
      clientSimRef.current?.stop();
    };
  }, []);

  const handleStartMission = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.createMission(pickupDept, deliveryDept, packageType, priority);
        return;
      } catch (e) {
        console.warn('Backend call failed, using client engine');
      }
    }
    clientSimRef.current?.startMission(pickupDept, deliveryDept, packageType, priority);
  }, [isConnected, isStandalone, pickupDept, deliveryDept, packageType, priority]);

  const handlePauseMission = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.pauseMission();
        return;
      } catch (e) {}
    }
    clientSimRef.current?.pause();
  }, [isConnected, isStandalone]);

  const handleResumeMission = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.resumeMission();
        return;
      } catch (e) {}
    }
    clientSimRef.current?.resume();
  }, [isConnected, isStandalone]);

  const handleEmergencyStop = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.triggerEmergencyStop();
        return;
      } catch (e) {}
    }
    clientSimRef.current?.emergencyStop();
  }, [isConnected, isStandalone]);

  const handleReleaseEmergencyStop = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.releaseEmergencyStop();
        return;
      } catch (e) {}
    }
    clientSimRef.current?.releaseEmergencyStop();
  }, [isConnected, isStandalone]);

  const handleReturnToBase = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.returnToBase();
        return;
      } catch (e) {}
    }
    clientSimRef.current?.returnToBase();
  }, [isConnected, isStandalone]);

  const handleTriggerObstacle = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.triggerDemoObstacle();
        return;
      } catch (e) {}
    }
    clientSimRef.current?.toggleDemoObstacle();
  }, [isConnected, isStandalone]);

  const handleResetSimulation = useCallback(async () => {
    if (isConnected && !isStandalone) {
      try {
        await api.resetSimulation();
        return;
      } catch (e) {}
    }
    clientSimRef.current?.resetSimulation();
  }, [isConnected, isStandalone]);

  return {
    telemetry,
    isConnected: isConnected || isStandalone,
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
    // Mission inputs
    pickupDept,
    setPickupDept,
    deliveryDept,
    setDeliveryDept,
    packageType,
    setPackageType,
    priority,
    setPriority,
    // Actions
    handleStartMission,
    handlePauseMission,
    handleResumeMission,
    handleEmergencyStop,
    handleReleaseEmergencyStop,
    handleReturnToBase,
    handleTriggerObstacle,
    handleResetSimulation,
  };
}
