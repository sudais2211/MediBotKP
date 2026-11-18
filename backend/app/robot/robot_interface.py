"""Robot Hardware / Simulation Abstraction Interface for MediBot KP.
Enables plug-and-play swapping between Python simulation and future ROS 2 Navigation2 / Micro-ROS hardware.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from app.robot.robot_state import RobotTelemetry, NavigationStatus


class IRobotInterface(ABC):
    @abstractmethod
    def set_cmd_vel(self, linear_x: float, angular_z: float) -> None:
        """Command linear velocity (m/s) and angular velocity (rad/s)."""
        pass

    @abstractmethod
    def emergency_stop(self) -> None:
        """Trigger immediate emergency brake."""
        pass

    @abstractmethod
    def release_emergency_stop(self) -> None:
        """Clear emergency brake."""
        pass

    @abstractmethod
    def set_cargo_lid(self, target_open_ratio: float) -> None:
        """Set medical compartment lid position (0.0 to 1.0)."""
        pass

    @abstractmethod
    def get_telemetry(self) -> RobotTelemetry:
        """Retrieve latest robot telemetry packet."""
        pass

    @abstractmethod
    def reset_to_pose(self, x: float, z: float, theta: float) -> None:
        """Reset robot pose (for simulation re-initialization)."""
        pass
