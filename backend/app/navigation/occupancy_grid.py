"""2D Occupancy Grid and Costmap Generator for MediBot KP Navigation."""
import math
from typing import Tuple, List, Optional
import numpy as np
from app.world.hospital_layout import HospitalLayout
from app.world.obstacle_manager import ObstacleManager, SimulatedObstacle
from app.config import settings


class OccupancyGrid:
    def __init__(self, layout: HospitalLayout, resolution: float = 0.25):
        self.layout = layout
        self.resolution = resolution
        self.x_min = layout.dimensions["x_min"]
        self.x_max = layout.dimensions["x_max"]
        self.z_min = layout.dimensions["z_min"]
        self.z_max = layout.dimensions["z_max"]

        self.width_m = self.x_max - self.x_min
        self.depth_m = self.z_max - self.z_min

        self.cols = int(round(self.width_m / self.resolution))
        self.rows = int(round(self.depth_m / self.resolution))

        # Static obstacle grid: 0 = Free, 100 = Blocked
        self.static_grid = np.zeros((self.rows, self.cols), dtype=np.int8)
        # Costmap with inflation: 0 = Free, 1-99 = Inflated cushion, 100 = Blocked
        self.static_costmap = np.zeros((self.rows, self.cols), dtype=np.uint8)

        self._build_static_grid()

    def world_to_grid(self, x: float, z: float) -> Tuple[int, int]:
        col = int((x - self.x_min) / self.resolution)
        row = int((z - self.z_min) / self.resolution)
        col = max(0, min(self.cols - 1, col))
        row = max(0, min(self.rows - 1, row))
        return col, row

    def grid_to_world(self, col: int, row: int) -> Tuple[float, float]:
        x = self.x_min + (col + 0.5) * self.resolution
        z = self.z_min + (row + 0.5) * self.resolution
        return x, z

    def is_in_bounds(self, col: int, row: int) -> bool:
        return 0 <= col < self.cols and 0 <= row < self.rows

    def _build_static_grid(self):
        inflation_cells = int(math.ceil(settings.INFLATION_RADIUS / self.resolution))
        
        # Populate raw obstacles
        for r in range(self.rows):
            for c in range(self.cols):
                wx, wz = self.grid_to_world(c, r)
                if self.layout.is_point_in_obstacle(wx, wz, safety_margin=0.0):
                    self.static_grid[r, c] = 100
                    self.static_costmap[r, c] = 100

        # Apply inflation cushion around obstacles
        for r in range(self.rows):
            for c in range(self.cols):
                if self.static_grid[r, c] == 100:
                    for dr in range(-inflation_cells, inflation_cells + 1):
                        for dc in range(-inflation_cells, inflation_cells + 1):
                            nr = r + dr
                            nc = c + dc
                            if self.is_in_bounds(nc, nr):
                                dist = math.hypot(dr, dc) * self.resolution
                                if dist <= settings.INFLATION_RADIUS:
                                    # Gradient cost from 90 near obstacle down to 10
                                    cushion_cost = int(90 * (1.0 - dist / settings.INFLATION_RADIUS))
                                    if self.static_costmap[nr, nc] < cushion_cost:
                                        self.static_costmap[nr, nc] = cushion_cost

    def get_dynamic_costmap(self, obstacles: List[SimulatedObstacle]) -> np.ndarray:
        """Combine static costmap with active dynamic obstacles."""
        costmap = np.copy(self.static_costmap)
        inflation_cells = int(math.ceil(settings.INFLATION_RADIUS / self.resolution))

        for obs in obstacles:
            if not obs.is_active:
                continue
            center_c, center_r = self.world_to_grid(obs.x, obs.z)
            obs_radius_cells = int(math.ceil((obs.radius + settings.INFLATION_RADIUS) / self.resolution))

            for dr in range(-obs_radius_cells, obs_radius_cells + 1):
                for dc in range(-obs_radius_cells, obs_radius_cells + 1):
                    nr = center_r + dr
                    nc = center_c + dc
                    if self.is_in_bounds(nc, nr):
                        dist = math.hypot(dr, dc) * self.resolution
                        if dist <= obs.radius:
                            costmap[nr, nc] = 100
                        elif dist <= (obs.radius + settings.INFLATION_RADIUS):
                            cost = int(90 * (1.0 - (dist - obs.radius) / settings.INFLATION_RADIUS))
                            costmap[nr, nc] = max(costmap[nr, nc], cost)

        return costmap

    def is_line_of_sight_clear(self, x1: float, z1: float, x2: float, z2: float,
                               costmap: np.ndarray, max_cost: int = 70) -> bool:
        """Bresenham / ray march to test line of sight clearance."""
        c1, r1 = self.world_to_grid(x1, z1)
        c2, r2 = self.world_to_grid(x2, z2)

        dx = abs(c2 - c1)
        dz = abs(r2 - r1)
        sx = 1 if c1 < c2 else -1
        sz = 1 if r1 < r2 else -1
        err = dx - dz

        curr_c = c1
        curr_r = r1

        while True:
            if not self.is_in_bounds(curr_c, curr_r) or costmap[curr_r, curr_c] >= max_cost:
                return False
            if curr_c == c2 and curr_r == r2:
                break
            e2 = 2 * err
            if e2 > -dz:
                err -= dz
                curr_c += sx
            if e2 < dx:
                err += dx
                curr_r += sz

        return True
