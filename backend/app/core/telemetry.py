"""Telemetry Packet Bundler and Serializer for MediBot KP WebSocket Stream."""
import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.robot.robot_state import RobotTelemetry
from app.perception.lidar_simulator import LidarScanResult
from app.perception.perception_interface import DetectionResult
from app.mission.mission_state_machine import MissionPhase


class SimulationTelemetryPacket(BaseModel):
    timestamp: float
    seq: int
    product_name: str = "MediBot KP"
    company: str = "RoboNex Innovations"
    disclaimer: str = "MediBot KP is a virtual simulation prototype. Sensor readings, AI detections, navigation behavior, and performance metrics are simulated and do not represent physical-robot field testing."

    robot: Dict[str, Any]
    mission: Dict[str, Any]
    lidar: Dict[str, Any]
    perception: List[Dict[str, Any]]
    obstacles: List[Dict[str, Any]]
    planned_path: List[Dict[str, float]]
    metrics: Dict[str, Any]
    alert_banner: Optional[Dict[str, Any]] = None
