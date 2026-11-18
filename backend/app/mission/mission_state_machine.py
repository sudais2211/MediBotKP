"""Mission State Machine for Autonomous Delivery Lifecycle in MediBot KP."""
import time
from enum import Enum
from typing import Optional, Dict, Any, Tuple
from app.mission.delivery_task import DeliveryTask, TaskStatus
from app.robot.robot_state import NavigationStatus, CompartmentState, SafetyAlertLevel


class MissionPhase(str, Enum):
    IDLE = "IDLE"
    NAVIGATING_TO_PICKUP = "NAVIGATING_TO_PICKUP"
    LOADING_CARGO = "LOADING_CARGO"
    NAVIGATING_TO_DESTINATION = "NAVIGATING_TO_DESTINATION"
    OBSTACLE_DECELERATING = "OBSTACLE_DECELERATING"
    OBSTACLE_STOPPED = "OBSTACLE_STOPPED"
    REROUTING = "REROUTING"
    ARRIVED_DELIVERING = "ARRIVED_DELIVERING"
    COMPLETED = "COMPLETED"
    RETURNING_TO_BASE = "RETURNING_TO_BASE"
    DOCKING = "DOCKING"
    DOCKED_CHARGING = "DOCKED_CHARGING"
    PAUSED = "PAUSED"
    EMERGENCY_STOPPED = "EMERGENCY_STOPPED"
    FAILED = "FAILED"


class MissionStateMachine:
    def __init__(self):
        self.phase: MissionPhase = MissionPhase.DOCKED_CHARGING
        self.previous_phase: Optional[MissionPhase] = None
        self.active_task: Optional[DeliveryTask] = None

        # Cargo lid animation and timing
        self.lid_open_ratio: float = 0.0
        self.action_timer: float = 0.0
        self.action_duration: float = 3.0  # seconds for loading/unloading sequence

        # Obstacle hold timer
        self.obstacle_stop_timer: float = 0.0
        self.time_stopped_for_obstacles: float = 0.0

        # Mission timer
        self.mission_start_time: Optional[float] = None

    def start_mission(self, task: DeliveryTask):
        self.active_task = task
        self.active_task.status = TaskStatus.EN_ROUTE_PICKUP
        self.active_task.started_at = time.time()
        self.mission_start_time = time.time()
        self.phase = MissionPhase.NAVIGATING_TO_PICKUP
        self.lid_open_ratio = 0.0

    def pause(self):
        if self.phase not in [MissionPhase.PAUSED, MissionPhase.EMERGENCY_STOPPED]:
            self.previous_phase = self.phase
            self.phase = MissionPhase.PAUSED
            if self.active_task:
                self.active_task.status = TaskStatus.PAUSED

    def resume(self):
        if self.phase == MissionPhase.PAUSED and self.previous_phase:
            self.phase = self.previous_phase
            self.previous_phase = None
            if self.active_task:
                if self.phase == MissionPhase.NAVIGATING_TO_PICKUP:
                    self.active_task.status = TaskStatus.EN_ROUTE_PICKUP
                elif self.phase == MissionPhase.NAVIGATING_TO_DESTINATION:
                    self.active_task.status = TaskStatus.EN_ROUTE_DELIVERY

    def trigger_emergency_stop(self):
        self.previous_phase = self.phase
        self.phase = MissionPhase.EMERGENCY_STOPPED

    def release_emergency_stop(self):
        if self.phase == MissionPhase.EMERGENCY_STOPPED:
            self.phase = self.previous_phase or MissionPhase.IDLE
            self.previous_phase = None

    def abort_mission(self, reason: str = "Mission cancelled by operator"):
        if self.active_task:
            self.active_task.status = TaskStatus.CANCELLED
            self.active_task.failure_reason = reason
        self.phase = MissionPhase.RETURNING_TO_BASE

    def update_actuators(self, dt: float) -> Tuple[float, CompartmentState]:
        """Update cargo lid animation during loading and delivering phases."""
        compartment_state = CompartmentState.CLOSED_EMPTY

        if self.phase == MissionPhase.LOADING_CARGO:
            self.action_timer += dt
            if self.action_timer < 1.0:
                # Opening lid
                self.lid_open_ratio = min(1.0, self.lid_open_ratio + dt * 1.5)
                compartment_state = CompartmentState.OPENING_FOR_PICKUP
            elif self.action_timer < 2.0:
                # Open, loading cargo
                self.lid_open_ratio = 1.0
                compartment_state = CompartmentState.OPEN_PICKUP
            elif self.action_timer < 3.0:
                # Closing lid with cargo locked
                self.lid_open_ratio = max(0.0, self.lid_open_ratio - dt * 1.5)
                compartment_state = CompartmentState.CLOSING_LOADED
            else:
                # Loading complete!
                self.lid_open_ratio = 0.0
                compartment_state = CompartmentState.LOCKED_IN_TRANSIT
                self.action_timer = 0.0
                self.phase = MissionPhase.NAVIGATING_TO_DESTINATION
                if self.active_task:
                    self.active_task.status = TaskStatus.EN_ROUTE_DELIVERY

        elif self.phase == MissionPhase.ARRIVED_DELIVERING:
            self.action_timer += dt
            if self.action_timer < 1.0:
                # Opening lid for delivery
                self.lid_open_ratio = min(1.0, self.lid_open_ratio + dt * 1.5)
                compartment_state = CompartmentState.OPENING_FOR_DELIVERY
            elif self.action_timer < 2.0:
                # Open, caregiver retrieving supplies
                self.lid_open_ratio = 1.0
                compartment_state = CompartmentState.OPEN_DELIVERY
            elif self.action_timer < 3.0:
                # Closing lid empty
                self.lid_open_ratio = max(0.0, self.lid_open_ratio - dt * 1.5)
                compartment_state = CompartmentState.CLOSING_DELIVERED
            else:
                # Delivery successfully completed!
                self.lid_open_ratio = 0.0
                compartment_state = CompartmentState.CLOSED_EMPTY
                self.action_timer = 0.0
                self.phase = MissionPhase.COMPLETED
                if self.active_task:
                    self.active_task.status = TaskStatus.COMPLETED
                    self.active_task.completed_at = time.time()
                # Transition to return to charging dock
                self.phase = MissionPhase.RETURNING_TO_BASE

        elif self.phase == MissionPhase.NAVIGATING_TO_DESTINATION:
            compartment_state = CompartmentState.LOCKED_IN_TRANSIT
            self.lid_open_ratio = 0.0
        else:
            self.lid_open_ratio = 0.0
            compartment_state = CompartmentState.CLOSED_EMPTY

        return self.lid_open_ratio, compartment_state
