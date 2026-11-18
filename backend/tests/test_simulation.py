"""Comprehensive Unit Tests for MediBot KP Simulation Engine."""
import pytest
import math
from app.world.hospital_layout import HospitalLayout
from app.world.department_registry import DepartmentRegistry
from app.world.obstacle_manager import ObstacleManager, SimulatedObstacle
from app.navigation.occupancy_grid import OccupancyGrid
from app.navigation.astar_planner import AStarPlanner
from app.navigation.motion_controller import MotionController
from app.perception.lidar_simulator import VirtualLidar
from app.perception.simulated_perception import SimulatedPerceptionModule
from app.robot.differential_drive_model import DifferentialDriveModel
from app.robot.battery_model import SimulatedBatteryModel
from app.mission.mission_state_machine import MissionStateMachine, MissionPhase
from app.mission.delivery_task import DeliveryTask, TaskStatus, TaskPriority


def test_hospital_layout_and_departments():
    layout = HospitalLayout()
    assert layout.dimensions["width"] == 36.0
    assert len(layout.interior_walls) > 0
    assert len(layout.doorways) > 0

    depts = DepartmentRegistry()
    all_depts = depts.get_all()
    assert len(all_depts) >= 6

    pharmacy = depts.get("pharmacy")
    assert pharmacy is not None
    assert pharmacy.name == "Central Pharmacy"

    nurse = depts.get("nursing_station")
    assert nurse is not None
    assert nurse.name == "Nursing Station 3B"


def test_occupancy_grid_and_astar_planning():
    layout = HospitalLayout()
    grid = OccupancyGrid(layout, resolution=0.25)
    planner = AStarPlanner(grid)

    # Plan from dock (-13.0, -6.5) to pharmacy (-12.5, 6.0)
    path = planner.plan(-13.0, -6.5, -12.5, 6.0)
    assert path is not None
    assert len(path) >= 2
    # First point should be near start, last near goal
    assert math.hypot(path[0]["x"] - (-13.0), path[0]["z"] - (-6.5)) < 1.0
    assert math.hypot(path[-1]["x"] - (-12.5), path[-1]["z"] - 6.0) < 1.0

    # Plan from pharmacy (-12.5, 6.0) to nursing station (1.0, -3.5)
    path2 = planner.plan(-12.5, 6.0, 1.0, -3.5)
    assert path2 is not None
    assert len(path2) >= 2


def test_differential_drive_kinematics():
    robot = DifferentialDriveModel(init_x=0.0, init_z=0.0, init_theta=0.0)
    robot.set_command_velocity(1.0, 0.0)

    # Step for 1 second with 0.1s dt
    for _ in range(10):
        robot.step(0.1)

    assert robot.x > 0.0
    assert abs(robot.z) < 0.05
    assert robot.wheel_angle_left > 0.0
    assert robot.wheel_angle_right > 0.0


def test_battery_model():
    bms = SimulatedBatteryModel(initial_soc_percent=80.0)
    # Moving discharges battery
    res = bms.update(dt=10.0, is_moving=True, is_docked=False)
    assert res["percentage"] <= 80.0
    assert not res["is_charging"]

    # Docked charges battery
    res_dock = bms.update(dt=60.0, is_moving=False, is_docked=True)
    assert res_dock["is_charging"]
    assert res_dock["percentage"] >= res["percentage"]


def test_virtual_lidar_and_obstacle_detection():
    layout = HospitalLayout()
    obs_mgr = ObstacleManager()
    lidar = VirtualLidar(layout, obs_mgr)

    # Spawn demo obstacle in corridor at (-4.0, 0.0)
    obs = obs_mgr.trigger_demo_obstacle()
    assert obs.id == "obs_demo_human_1"

    # Scan from (-5.5, 0.0) facing east (theta = 0)
    scan = lidar.scan(robot_x=-5.5, robot_z=0.0, robot_theta=0.0)
    assert scan.num_rays == 180
    assert scan.closest_distance_m < 2.0  # Should detect human obstacle ~1.5m away
    assert scan.alert_level in ["CAUTION", "CRITICAL_STOP"]


def test_mission_state_machine_workflow():
    sm = MissionStateMachine()
    assert sm.phase == MissionPhase.DOCKED_CHARGING

    task = DeliveryTask(pickup_dept_id="pharmacy", delivery_dept_id="nursing_station")
    sm.start_mission(task)
    assert sm.phase == MissionPhase.NAVIGATING_TO_PICKUP
    assert task.status == TaskStatus.EN_ROUTE_PICKUP

    # Simulate arrival at pickup
    sm.phase = MissionPhase.LOADING_CARGO
    for _ in range(35):
        sm.update_actuators(0.1)
    # After 3.5 seconds, loading should be complete and phase transitions to NAVIGATING_TO_DESTINATION
    assert sm.phase == MissionPhase.NAVIGATING_TO_DESTINATION
    assert task.status == TaskStatus.EN_ROUTE_DELIVERY

    # Pause and resume
    sm.pause()
    assert sm.phase == MissionPhase.PAUSED
    sm.resume()
    assert sm.phase == MissionPhase.NAVIGATING_TO_DESTINATION

    # Emergency stop
    sm.trigger_emergency_stop()
    assert sm.phase == MissionPhase.EMERGENCY_STOPPED
    sm.release_emergency_stop()
    assert sm.phase == MissionPhase.NAVIGATING_TO_DESTINATION
