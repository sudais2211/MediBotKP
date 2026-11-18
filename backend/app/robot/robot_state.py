"""Robot State Representation and Status Models for MediBot KP."""
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class NavigationStatus(str, Enum):
    IDLE = "IDLE"
    PLANNING = "PLANNING"
    NAVIGATING = "NAVIGATING"
    OBSTACLE_DECELERATING = "OBSTACLE_DECELERATING"
    OBSTACLE_STOPPED = "OBSTACLE_STOPPED"
    REROUTING = "REROUTING"
    ARRIVED = "ARRIVED"
    DOCKING = "DOCKING"
    DOCKED = "DOCKED"
    PAUSED = "PAUSED"
    EMERGENCY_STOPPED = "EMERGENCY_STOPPED"
    FAILED = "FAILED"


class SafetyAlertLevel(str, Enum):
    NORMAL = "NORMAL"
    CAUTION = "CAUTION"
    CRITICAL_STOP = "CRITICAL_STOP"
    EMERGENCY_STOP = "EMERGENCY_STOP"


class CompartmentState(str, Enum):
    CLOSED_EMPTY = "CLOSED_EMPTY"
    OPENING_FOR_PICKUP = "OPENING_FOR_PICKUP"
    OPEN_PICKUP = "OPEN_PICKUP"
    CLOSING_LOADED = "CLOSING_LOADED"
    LOCKED_IN_TRANSIT = "LOCKED_IN_TRANSIT"
    OPENING_FOR_DELIVERY = "OPENING_FOR_DELIVERY"
    OPEN_DELIVERY = "OPEN_DELIVERY"
    CLOSING_DELIVERED = "CLOSING_DELIVERED"


class RobotPose(BaseModel):
    x: float = -13.0
    y: float = 0.0
    z: float = -6.5
    theta: float = 0.0
    theta_deg: float = 0.0


class RobotVelocity(BaseModel):
    linear: float = 0.0
    angular: float = 0.0


class WheelState(BaseModel):
    left_rad: float = 0.0
    right_rad: float = 0.0
    left_rpm: float = 0.0
    right_rpm: float = 0.0


class BatteryState(BaseModel):
    percentage: float = 88.5
    voltage: float = 25.6
    current_draw_a: float = -18.75
    is_charging: bool = True
    wh_consumed: float = 0.0
    estimated_runtime_min: float = 120.0


class IndicatorsState(BaseModel):
    lidar_active: bool = True
    camera_active: bool = True
    headlights_on: bool = True
    status_light: str = "green"  # green, amber, red, blue, purple
    safety_level: SafetyAlertLevel = SafetyAlertLevel.NORMAL
    emergency_stop_triggered: bool = False
    warning_beep: bool = False


class CargoState(BaseModel):
    state: CompartmentState = CompartmentState.CLOSED_EMPTY
    lid_open_ratio: float = 0.0  # 0.0 closed to 1.0 open
    has_package: bool = False
    package_id: Optional[str] = None
    package_type: Optional[str] = None
    package_weight_kg: float = 0.0
    requires_cold_chain: bool = False


class RobotTelemetry(BaseModel):
    timestamp: float
    product_name: str = "MediBot KP"
    company: str = "RoboNex Innovations"
    is_simulation: bool = True
    simulation_label: str = "Simulated Digital Twin Telemetry - Not Physical Hardware"

    pose: RobotPose
    velocity: RobotVelocity
    wheels: WheelState
    battery: BatteryState
    indicators: IndicatorsState
    cargo: CargoState

    nav_status: NavigationStatus = NavigationStatus.DOCKED
    current_destination: Optional[str] = None
    distance_to_goal: float = 0.0
    estimated_eta_seconds: float = 0.0
    total_distance_traveled_m: float = 0.0
    mission_duration_seconds: float = 0.0
    time_stopped_for_obstacles_s: float = 0.0
