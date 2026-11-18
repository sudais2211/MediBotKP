"""Virtual 360-degree 2D/3D Planar LiDAR Simulator for MediBot KP."""
import math
import time
from typing import List, Dict, Tuple, Optional, Any
from pydantic import BaseModel, Field
from app.config import settings
from app.world.hospital_layout import HospitalLayout
from app.world.obstacle_manager import ObstacleManager, SimulatedObstacle


class LidarScanResult(BaseModel):
    timestamp: float
    is_virtual: bool = True
    disclaimer: str = "Virtual LiDAR - Raycast Simulation, Not Physical Sensor"
    num_rays: int
    max_range: float
    min_range: float
    ranges: List[float]
    angles_rad: List[float]
    hit_points: List[Dict[str, float]]  # [{"x": x, "z": z, "range": r}, ...]
    closest_distance_m: float
    closest_angle_deg: float
    closest_point: Optional[Dict[str, float]] = None
    alert_level: str  # NORMAL, CAUTION, CRITICAL_STOP
    detected_dynamic_count: int


class VirtualLidar:
    def __init__(self, layout: HospitalLayout, obstacle_manager: ObstacleManager):
        self.layout = layout
        self.obstacle_manager = obstacle_manager
        self.num_rays = settings.LIDAR_NUM_RAYS
        self.max_range = settings.LIDAR_MAX_RANGE
        self.min_range = settings.LIDAR_MIN_RANGE
        self.warning_dist = settings.LIDAR_WARNING_ZONE
        self.stop_dist = settings.LIDAR_STOP_ZONE

        # Precompute ray angle offsets (-pi to pi)
        self.ray_offsets = [
            -math.pi + (2.0 * math.pi * i) / self.num_rays
            for i in range(self.num_rays)
        ]

    def scan(self, robot_x: float, robot_z: float, robot_theta: float) -> LidarScanResult:
        ranges = []
        hit_points = []
        closest_dist = self.max_range
        closest_angle = 0.0
        closest_pt = None
        dynamic_hits_count = 0

        active_obstacles = self.obstacle_manager.get_all_active()

        for idx, offset in enumerate(self.ray_offsets):
            angle = (robot_theta + offset + math.pi) % (2.0 * math.pi) - math.pi
            rdx = math.cos(angle)
            rdz = math.sin(angle)

            min_hit_t = self.max_range
            hit_is_dynamic = False

            # 1. Raycast against static walls & furniture
            for seg in self.layout.all_line_segments:
                t = self.layout.ray_segment_intersect(
                    robot_x, robot_z, rdx, rdz,
                    seg[0], seg[1], seg[2], seg[3],
                    min_hit_t
                )
                if t is not None and t < min_hit_t:
                    min_hit_t = t

            # 2. Raycast against dynamic obstacles (circular footprint)
            for obs in active_obstacles:
                t_obs = self._ray_circle_intersect(robot_x, robot_z, rdx, rdz, obs.x, obs.z, obs.radius)
                if t_obs is not None and t_obs < min_hit_t:
                    min_hit_t = t_obs
                    hit_is_dynamic = True

            min_hit_t = max(self.min_range, min(self.max_range, min_hit_t))
            ranges.append(round(min_hit_t, 3))

            # Store hit point if within max range
            if min_hit_t < (self.max_range - 0.05):
                hx = robot_x + rdx * min_hit_t
                hz = robot_z + rdz * min_hit_t
                hit_points.append({"x": round(hx, 3), "z": round(hz, 3), "range": round(min_hit_t, 3)})

                if hit_is_dynamic:
                    dynamic_hits_count += 1

                if min_hit_t < closest_dist:
                    closest_dist = min_hit_t
                    closest_angle = math.degrees(offset)
                    closest_pt = {"x": round(hx, 3), "z": round(hz, 3)}

        # Evaluate safety alert level
        if closest_dist <= self.stop_dist:
            alert = "CRITICAL_STOP"
        elif closest_dist <= self.warning_dist:
            alert = "CAUTION"
        else:
            alert = "NORMAL"

        return LidarScanResult(
            timestamp=time.time(),
            is_virtual=True,
            disclaimer="Virtual LiDAR - Raycast Simulation, Not Physical Sensor",
            num_rays=self.num_rays,
            max_range=self.max_range,
            min_range=self.min_range,
            ranges=ranges,
            angles_rad=self.ray_offsets,
            hit_points=hit_points,
            closest_distance_m=round(closest_dist, 2),
            closest_angle_deg=round(closest_angle, 1),
            closest_point=closest_pt,
            alert_level=alert,
            detected_dynamic_count=dynamic_hits_count
        )

    @staticmethod
    def _ray_circle_intersect(ox: float, oz: float, rdx: float, rdz: float,
                              cx: float, cz: float, radius: float) -> Optional[float]:
        """Ray-circle intersection."""
        vx = ox - cx
        vz = oz - cz
        b = rdx * vx + rdz * vz
        c = (vx * vx + vz * vz) - (radius * radius)

        # If origin inside circle
        if c < 0:
            return 0.05

        discriminant = b * b - c
        if discriminant < 0:
            return None

        t = -b - math.sqrt(discriminant)
        if t > 0.05:
            return t
        return None
