"""Central Deterministic Simulation Engine for MediBot KP Digital Twin."""
import asyncio
import math
import time
from typing import Optional, Dict, Any, List, Callable, Tuple
from app.config import settings
from app.world.hospital_layout import HospitalLayout
from app.world.department_registry import DepartmentRegistry
from app.world.obstacle_manager import ObstacleManager, SimulatedObstacle
from app.navigation.occupancy_grid import OccupancyGrid
from app.navigation.astar_planner import AStarPlanner
from app.navigation.motion_controller import MotionController
from app.navigation.local_planner import LocalPlanner
from app.perception.lidar_simulator import VirtualLidar, LidarScanResult
from app.perception.simulated_perception import SimulatedPerceptionModule
from app.perception.perception_interface import DetectionResult
from app.robot.differential_drive_model import DifferentialDriveModel
from app.robot.battery_model import SimulatedBatteryModel
from app.robot.robot_state import (
    NavigationStatus, SafetyAlertLevel, CompartmentState,
    RobotPose, RobotVelocity, WheelState, BatteryState, IndicatorsState, CargoState
)
from app.mission.mission_state_machine import MissionStateMachine, MissionPhase
from app.mission.mission_manager import MissionManager
from app.mission.delivery_task import DeliveryTask, TaskStatus, TaskPriority
from app.core.telemetry import SimulationTelemetryPacket


class SimulationEngine:
    def __init__(self):
        # 1. World & Departments
        self.layout = HospitalLayout()
        self.departments = DepartmentRegistry()
        self.obstacle_manager = ObstacleManager()

        # 2. Navigation Stack
        self.grid = OccupancyGrid(self.layout, resolution=settings.GRID_RESOLUTION)
        self.astar = AStarPlanner(self.grid)
        self.motion_controller = MotionController()
        self.local_planner = LocalPlanner(self.astar, self.obstacle_manager)

        # 3. Perception
        self.lidar = VirtualLidar(self.layout, self.obstacle_manager)
        self.perception = SimulatedPerceptionModule()

        # 4. Robot Physics & BMS
        init_spawn = self.layout.raw_data.get("default_robot_spawn", {"x": -13.0, "z": -6.5, "theta": 0.0})
        self.robot = DifferentialDriveModel(
            init_x=init_spawn["x"],
            init_z=init_spawn["z"],
            init_theta=init_spawn["theta"]
        )
        self.battery = SimulatedBatteryModel(initial_soc_percent=92.0)

        # 5. Mission Management
        self.mission_sm = MissionStateMachine()
        self.mission_manager = MissionManager()

        # Active path waypoints
        self.current_path: List[Dict[str, float]] = []
        self.current_target_name: str = "Charging Station"
        self.current_target_waypoint: Optional[Dict[str, float]] = None

        # Simulation Loop state
        self.is_running = False
        self.seq_num = 0
        self.last_tick_time = time.time()
        self.telemetry_subscribers: List[Callable[[Dict[str, Any]], None]] = []

        # Current sensor data cache
        self.latest_lidar_scan: Optional[LidarScanResult] = None
        self.latest_detections: List[DetectionResult] = []
        self.latest_alert_banner: Optional[Dict[str, Any]] = None

    def add_telemetry_listener(self, listener: Callable[[Dict[str, Any]], None]):
        self.telemetry_subscribers.append(listener)

    def remove_telemetry_listener(self, listener: Callable[[Dict[str, Any]], None]):
        if listener in self.telemetry_subscribers:
            self.telemetry_subscribers.remove(listener)

    async def run_loop(self):
        """Main simulation tick loop (20 Hz)."""
        self.is_running = True
        dt = 1.0 / settings.SIMULATION_TICK_HZ

        while self.is_running:
            start_time = time.time()
            self.tick(dt)
            elapsed = time.time() - start_time
            sleep_time = max(0.001, dt - elapsed)
            await asyncio.sleep(sleep_time)

    def tick(self, dt: float):
        self.seq_num += 1
        now = time.time()

        # 1. Update dynamic obstacles (walking personnel, etc.)
        self.obstacle_manager.update(dt)

        # 2. Run Virtual LiDAR scan
        lidar_scan = self.lidar.scan(self.robot.x, self.robot.z, self.robot.theta)
        self.latest_lidar_scan = lidar_scan

        # 3. Run Simulated AI Perception Module
        active_obs = self.obstacle_manager.get_all_active()
        detections = self.perception.process_frame(self.robot.x, self.robot.z, self.robot.theta, active_obs)
        self.latest_detections = detections

        # 4. Mission State Machine & Path Execution
        cmd_v = 0.0
        cmd_omega = 0.0
        safety_level = SafetyAlertLevel.NORMAL
        speed_factor = 1.0
        self.latest_alert_banner = None

        # Check emergency stop condition
        if self.mission_sm.phase == MissionPhase.EMERGENCY_STOPPED:
            self.robot.set_command_velocity(0.0, 0.0, emergency_stop=True)
            safety_level = SafetyAlertLevel.EMERGENCY_STOP
            self.latest_alert_banner = {
                "type": "danger",
                "title": "EMERGENCY STOP ACTIVATED",
                "message": "Hardware e-brake engaged. All motor drives disabled."
            }
        elif self.mission_sm.phase == MissionPhase.PAUSED:
            self.robot.set_command_velocity(0.0, 0.0)
            safety_level = SafetyAlertLevel.NORMAL
            self.latest_alert_banner = {
                "type": "info",
                "title": "SIMULATION PAUSED",
                "message": "Mission temporarily paused by operator."
            }
        elif self.mission_sm.phase in [MissionPhase.DOCKED_CHARGING, MissionPhase.IDLE]:
            self.robot.set_command_velocity(0.0, 0.0)
            self.current_path = []
        elif self.mission_sm.phase in [MissionPhase.LOADING_CARGO, MissionPhase.ARRIVED_DELIVERING]:
            self.robot.set_command_velocity(0.0, 0.0)
            self.mission_sm.update_actuators(dt)
        else:
            # Active navigation phases: NAVIGATING_TO_PICKUP, NAVIGATING_TO_DESTINATION, RETURNING_TO_BASE
            speed_factor, safety_level = self._evaluate_obstacle_safety(lidar_scan, now)
            cmd_v, cmd_omega = self._execute_navigation_step(dt, speed_factor, now)
            self.robot.set_command_velocity(cmd_v, cmd_omega)

        # 5. Step differential drive kinematics
        step_info = self.robot.step(dt, emergency_stop=(self.mission_sm.phase == MissionPhase.EMERGENCY_STOPPED))

        # 6. Step battery model
        is_moving = abs(self.robot.v) > 0.01 or abs(self.robot.omega) > 0.05
        is_docked = (self.mission_sm.phase == MissionPhase.DOCKED_CHARGING)
        bms = self.battery.update(dt, is_moving, is_docked)

        # 7. Update active mission tracking metrics
        if self.mission_sm.active_task:
            self.mission_sm.active_task.distance_traveled_m += step_info["step_dist"]
            if self.mission_sm.mission_start_time:
                self.mission_sm.active_task.duration_seconds = now - self.mission_sm.mission_start_time

        # 8. Broadcast telemetry
        telemetry_pkt = self._build_telemetry_packet(step_info, bms, lidar_scan, detections, safety_level, now)
        for sub in self.telemetry_subscribers:
            try:
                sub(telemetry_pkt)
            except Exception as e:
                print(f"Error publishing telemetry: {e}")

    def _evaluate_obstacle_safety(self, lidar_scan: LidarScanResult, now: float) -> Tuple[float, SafetyAlertLevel]:
        speed_factor = 1.0
        safety_level = SafetyAlertLevel.NORMAL

        # Check if an obstacle is directly in front along the active corridor path
        is_blocked, blocked_obs = self.local_planner.is_path_blocked_by_obstacle(
            self.current_path, self.obstacle_manager.get_all_active(), lookahead_m=3.0
        )

        if is_blocked and blocked_obs:
            self.mission_sm.time_stopped_for_obstacles += (1.0 / settings.SIMULATION_TICK_HZ)
            if self.mission_sm.active_task:
                self.mission_sm.active_task.obstacles_encountered = max(
                    self.mission_sm.active_task.obstacles_encountered, 1
                )

            # Check if close enough to require safe stop
            dist_to_obs = math.hypot(blocked_obs.x - self.robot.x, blocked_obs.z - self.robot.z)
            if dist_to_obs < (blocked_obs.radius + settings.ROBOT_RADIUS + 0.8):
                speed_factor = 0.0
                safety_level = SafetyAlertLevel.CRITICAL_STOP
                self.latest_alert_banner = {
                    "type": "warning",
                    "title": "OBSTACLE DETECTED IN PATH",
                    "message": f"Virtual LiDAR & AI Perception detected '{blocked_obs.name}' at {dist_to_obs:.2f}m. Decelerating to safe stop."
                }

                # Attempt alternate route computation (reroute)
                if self.current_target_waypoint:
                    new_path = self.local_planner.attempt_replan(
                        self.robot.x, self.robot.z,
                        self.current_target_waypoint["x"], self.current_target_waypoint["z"],
                        now
                    )
                    if new_path:
                        self.current_path = new_path
                        if self.mission_sm.active_task:
                            self.mission_sm.active_task.reroutes_count = self.local_planner.reroute_count
                        self.latest_alert_banner = {
                            "type": "info",
                            "title": "ALTERNATE ROUTE COMPUTED",
                            "message": f"A* Planner successfully generated collision-free detour around {blocked_obs.name}."
                        }
            else:
                # Caution zone: decelerate to 35% speed
                speed_factor = 0.35
                safety_level = SafetyAlertLevel.CAUTION
                self.latest_alert_banner = {
                    "type": "caution",
                    "title": "PROXIMITY WARNING",
                    "message": f"Approaching {blocked_obs.name} ({dist_to_obs:.2f}m). Reducing speed for safety."
                }
        elif lidar_scan.alert_level == "CAUTION":
            speed_factor = 0.5
            safety_level = SafetyAlertLevel.CAUTION

        return speed_factor, safety_level

    def _execute_navigation_step(self, dt: float, speed_factor: float, now: float) -> Tuple[float, float]:
        # If no active path, check if we need to plan to current target
        if not self.current_path:
            self._plan_for_current_phase()
            if not self.current_path:
                return 0.0, 0.0

        # Prune passed waypoints
        self.current_path = self.local_planner.prune_passed_waypoints(self.robot.x, self.robot.z, self.current_path)

        final_theta = self.current_target_waypoint.get("theta") if self.current_target_waypoint else None
        cmd_v, cmd_omega, reached_goal, remaining_dist = self.motion_controller.compute_control(
            self.robot.x, self.robot.z, self.robot.theta,
            self.current_path,
            target_final_theta=final_theta,
            speed_factor=speed_factor
        )

        if reached_goal:
            self._handle_phase_arrival()
            return 0.0, 0.0

        return cmd_v, cmd_omega

    def _plan_for_current_phase(self):
        goal_wp = None

        if self.mission_sm.phase == MissionPhase.NAVIGATING_TO_PICKUP and self.mission_sm.active_task:
            dept_id = self.mission_sm.active_task.pickup_dept_id
            goal_wp = self.departments.get_waypoint(dept_id)
            dept = self.departments.get(dept_id)
            self.current_target_name = dept.name if dept else dept_id

        elif self.mission_sm.phase == MissionPhase.NAVIGATING_TO_DESTINATION and self.mission_sm.active_task:
            dept_id = self.mission_sm.active_task.delivery_dept_id
            goal_wp = self.departments.get_waypoint(dept_id)
            dept = self.departments.get(dept_id)
            self.current_target_name = dept.name if dept else dept_id

        elif self.mission_sm.phase == MissionPhase.RETURNING_TO_BASE:
            goal_wp = self.departments.get_waypoint("dock")
            self.current_target_name = "Charging Station"

        if goal_wp:
            self.current_target_waypoint = goal_wp
            active_obs = self.obstacle_manager.get_all_active()
            dynamic_costmap = self.grid.get_dynamic_costmap(active_obs)
            planned = self.astar.plan(
                self.robot.x, self.robot.z,
                goal_wp["x"], goal_wp["z"],
                costmap=dynamic_costmap
            )
            if planned:
                self.current_path = planned

    def _handle_phase_arrival(self):
        if self.mission_sm.phase == MissionPhase.NAVIGATING_TO_PICKUP:
            self.mission_sm.phase = MissionPhase.LOADING_CARGO
            self.current_path = []
        elif self.mission_sm.phase == MissionPhase.NAVIGATING_TO_DESTINATION:
            self.mission_sm.phase = MissionPhase.ARRIVED_DELIVERING
            self.current_path = []
        elif self.mission_sm.phase == MissionPhase.RETURNING_TO_BASE:
            self.mission_sm.phase = MissionPhase.DOCKED_CHARGING
            self.current_path = []
            if self.mission_sm.active_task:
                self.mission_manager.record_mission(self.mission_sm.active_task)

    def _build_telemetry_packet(self, step_info: Dict[str, Any], bms: Dict[str, Any],
                                lidar_scan: LidarScanResult, detections: List[DetectionResult],
                                safety_level: SafetyAlertLevel, now: float) -> Dict[str, Any]:
        task_info = None
        if self.mission_sm.active_task:
            t = self.mission_sm.active_task
            task_info = {
                "id": t.id,
                "title": t.title,
                "pickup_dept_id": t.pickup_dept_id,
                "delivery_dept_id": t.delivery_dept_id,
                "package_type": t.package_type,
                "priority": t.priority.value,
                "status": t.status.value,
                "notes": t.notes,
                "distance_traveled_m": round(t.distance_traveled_m, 2),
                "duration_seconds": round(t.duration_seconds, 1),
                "reroutes_count": t.reroutes_count,
                "obstacles_encountered": t.obstacles_encountered
            }

        # Calculate remaining distance to goal
        dist_to_goal = 0.0
        if self.current_path:
            dist_to_goal = math.hypot(self.current_path[-1]["x"] - self.robot.x, self.current_path[-1]["z"] - self.robot.z)

        # Status lights
        status_light = "green"
        if safety_level == SafetyAlertLevel.EMERGENCY_STOP:
            status_light = "red"
        elif safety_level == SafetyAlertLevel.CRITICAL_STOP or safety_level == SafetyAlertLevel.CAUTION:
            status_light = "amber"
        elif self.mission_sm.phase == MissionPhase.DOCKED_CHARGING:
            status_light = "purple"
        elif self.robot.v > 0.05 or self.current_path:
            status_light = "blue"

        # Active obstacles formatted for JSON
        obs_list = [obs.model_dump() for obs in self.obstacle_manager.get_all_active()]

        return {
            "timestamp": now,
            "seq": self.seq_num,
            "product_name": "MediBot KP",
            "company": "RoboNex Innovations",
            "disclaimer": "MediBot KP is a virtual simulation prototype. Sensor readings, AI detections, navigation behavior, and performance metrics are simulated and do not represent physical-robot field testing.",
            "robot": {
                "pose": {
                    "x": round(self.robot.x, 3),
                    "y": 0.0,
                    "z": round(self.robot.z, 3),
                    "theta": round(self.robot.theta, 3),
                    "theta_deg": round(math.degrees(self.robot.theta), 1)
                },
                "velocity": {
                    "linear": round(self.robot.v, 3),
                    "angular": round(self.robot.omega, 3)
                },
                "wheels": {
                    "left_rad": round(self.robot.wheel_angle_left, 3),
                    "right_rad": round(self.robot.wheel_angle_right, 3)
                },
                "battery": bms,
                "indicators": {
                    "lidar_active": True,
                    "camera_active": True,
                    "headlights_on": True,
                    "status_light": status_light,
                    "safety_level": safety_level.value,
                    "emergency_stop_triggered": (self.mission_sm.phase == MissionPhase.EMERGENCY_STOPPED)
                },
                "cargo": {
                    "lid_open_ratio": round(self.mission_sm.lid_open_ratio, 2),
                    "has_package": (self.mission_sm.phase in [MissionPhase.NAVIGATING_TO_DESTINATION, MissionPhase.ARRIVED_DELIVERING]),
                    "package_type": self.mission_sm.active_task.package_type if self.mission_sm.active_task else None
                }
            },
            "mission": {
                "phase": self.mission_sm.phase.value,
                "active_task": task_info,
                "target_name": self.current_target_name,
                "distance_to_goal_m": round(dist_to_goal, 2),
                "estimated_eta_seconds": round((dist_to_goal / max(0.2, self.robot.v if self.robot.v > 0.1 else 0.6)), 1) if dist_to_goal > 0.1 else 0.0
            },
            "lidar": lidar_scan.model_dump(),
            "perception": [d.model_dump() for d in detections],
            "obstacles": obs_list,
            "planned_path": self.current_path,
            "metrics": {
                "total_distance_traveled_m": round(self.robot.total_distance, 2),
                "total_reroutes": self.local_planner.reroute_count,
                "time_stopped_for_obstacles_s": round(self.mission_sm.time_stopped_for_obstacles, 1),
                "obstacles_avoided": self.mission_sm.active_task.obstacles_encountered if self.mission_sm.active_task else 0
            },
            "alert_banner": self.latest_alert_banner
        }

    # REST Action Handlers
    def start_mission_workflow(self, pickup_dept_id: str = "pharmacy",
                               delivery_dept_id: str = "nursing_station",
                               package_type: str = "Cold-Chain Biologics",
                               priority: TaskPriority = TaskPriority.HIGH) -> DeliveryTask:
        task = self.mission_manager.create_mission(
            pickup_dept_id=pickup_dept_id,
            delivery_dept_id=delivery_dept_id,
            package_type=package_type,
            priority=priority,
            notes=f"AI Innovation Challenge Live Demo: {pickup_dept_id} to {delivery_dept_id}"
        )
        self.mission_sm.start_mission(task)
        self._plan_for_current_phase()
        return task

    def pause_mission(self):
        self.mission_sm.pause()

    def resume_mission(self):
        self.mission_sm.resume()

    def emergency_stop(self):
        self.mission_sm.trigger_emergency_stop()

    def release_emergency_stop(self):
        self.mission_sm.release_emergency_stop()

    def return_to_base(self):
        self.mission_sm.phase = MissionPhase.RETURNING_TO_BASE
        self.current_path = []
        self._plan_for_current_phase()

    def trigger_obstacle_event(self) -> Dict[str, Any]:
        return self.obstacle_manager.toggle_demo_obstacle()

    def reset_simulation(self):
        init_spawn = self.layout.raw_data.get("default_robot_spawn", {"x": -13.0, "z": -6.5, "theta": 0.0})
        self.robot.reset_pose(init_spawn["x"], init_spawn["z"], init_spawn["theta"])
        self.mission_sm = MissionStateMachine()
        self.obstacle_manager.clear_dynamic_obstacles()
        self.obstacle_manager._init_ambient_obstacles()
        self.current_path = []
        self.battery.soc_percent = 92.0
        self.latest_alert_banner = None


# Global Singleton Simulation Engine
simulation_engine = SimulationEngine()
