"""Differential Drive Kinematics and Motion Dynamics Model for MediBot KP."""
import math
from app.config import settings


class DifferentialDriveModel:
    def __init__(self, init_x: float = -13.0, init_z: float = -6.5, init_theta: float = 0.0):
        # Pose
        self.x = init_x
        self.y = 0.0
        self.z = init_z
        self.theta = init_theta  # in radians

        # Current Velocities
        self.v = 0.0      # linear velocity (m/s)
        self.omega = 0.0  # angular velocity (rad/s)

        # Target / Commanded Velocities
        self.target_v = 0.0
        self.target_omega = 0.0

        # Physical constants
        self.wheel_base = settings.WHEEL_BASE
        self.wheel_radius = settings.WHEEL_RADIUS
        self.max_v = settings.MAX_LINEAR_SPEED
        self.max_omega = settings.MAX_ANGULAR_SPEED
        self.max_linear_accel = settings.MAX_LINEAR_ACCEL
        self.max_angular_accel = settings.MAX_ANGULAR_ACCEL
        self.emergency_decel = settings.EMERGENCY_DECEL

        # Wheel rotation angles in radians (for 3D mesh wheel spinning)
        self.wheel_angle_left = 0.0
        self.wheel_angle_right = 0.0

        # Odometry tracking
        self.total_distance = 0.0

    def set_command_velocity(self, v: float, omega: float, emergency_stop: bool = False):
        if emergency_stop:
            self.target_v = 0.0
            self.target_omega = 0.0
            return

        # Clamp commanded velocities
        self.target_v = max(-self.max_v * 0.4, min(self.max_v, v))
        self.target_omega = max(-self.max_omega, min(self.max_omega, omega))

    def step(self, dt: float, emergency_stop: bool = False):
        if emergency_stop:
            # Immediate emergency deceleration
            dv_max = self.emergency_decel * dt
            if self.v > 0:
                self.v = max(0.0, self.v - dv_max)
            elif self.v < 0:
                self.v = min(0.0, self.v + dv_max)
            self.omega = 0.0
        else:
            # Smooth acceleration ramp towards target_v
            dv_limit = self.max_linear_accel * dt
            diff_v = self.target_v - self.v
            if abs(diff_v) <= dv_limit:
                self.v = self.target_v
            else:
                self.v += math.copysign(dv_limit, diff_v)

            # Smooth acceleration ramp towards target_omega
            domega_limit = self.max_angular_accel * dt
            diff_omega = self.target_omega - self.omega
            if abs(diff_omega) <= domega_limit:
                self.omega = self.target_omega
            else:
                self.omega += math.copysign(domega_limit, diff_omega)

        # Update pose using standard unicycle / differential drive integration
        dx = self.v * math.cos(self.theta) * dt
        dz = self.v * math.sin(self.theta) * dt
        dtheta = self.omega * dt

        self.x += dx
        self.z += dz
        self.theta = (self.theta + dtheta + math.pi) % (2 * math.pi) - math.pi

        step_dist = math.sqrt(dx * dx + dz * dz)
        self.total_distance += step_dist

        # Compute individual wheel linear speeds
        v_l = self.v - (self.omega * self.wheel_base / 2.0)
        v_r = self.v + (self.omega * self.wheel_base / 2.0)

        # Update cumulative wheel rotation angles
        self.wheel_angle_left += (v_l / self.wheel_radius) * dt
        self.wheel_angle_right += (v_r / self.wheel_radius) * dt

        return {
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "theta": self.theta,
            "theta_deg": math.degrees(self.theta),
            "linear_velocity": self.v,
            "angular_velocity": self.omega,
            "wheel_rot_left": self.wheel_angle_left,
            "wheel_rot_right": self.wheel_angle_right,
            "step_dist": step_dist
        }

    def reset_pose(self, x: float, z: float, theta: float):
        self.x = x
        self.z = z
        self.theta = theta
        self.v = 0.0
        self.omega = 0.0
        self.target_v = 0.0
        self.target_omega = 0.0
