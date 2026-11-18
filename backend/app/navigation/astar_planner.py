"""A* Global Path Planner with String-Pulling Smoothing for MediBot KP."""
import heapq
import math
from typing import List, Tuple, Optional, Dict
import numpy as np
from app.navigation.occupancy_grid import OccupancyGrid


class AStarPlanner:
    def __init__(self, occupancy_grid: OccupancyGrid):
        self.grid = occupancy_grid

        # 8 directions: (d_col, d_row, base_cost)
        sqrt2 = math.sqrt(2.0)
        self.neighbors = [
            (1, 0, 1.0),
            (-1, 0, 1.0),
            (0, 1, 1.0),
            (0, -1, 1.0),
            (1, 1, sqrt2),
            (1, -1, sqrt2),
            (-1, 1, sqrt2),
            (-1, -1, sqrt2)
        ]

    def plan(self, start_x: float, start_z: float,
             goal_x: float, goal_z: float,
             costmap: Optional[np.ndarray] = None) -> Optional[List[Dict[str, float]]]:
        """Compute an optimal collision-free path from start to goal."""
        if costmap is None:
            costmap = self.grid.static_costmap

        start_col, start_row = self.grid.world_to_grid(start_x, start_z)
        goal_col, goal_row = self.grid.world_to_grid(goal_x, goal_z)

        # Ensure start and goal are accessible; if not, search nearest free cell
        start_col, start_row = self._find_nearest_free(start_col, start_row, costmap)
        goal_col, goal_row = self._find_nearest_free(goal_col, goal_row, costmap)

        if start_col is None or goal_col is None:
            return None

        # Priority queue entries: (f_score, g_score, (col, row))
        open_set = []
        h_start = math.hypot(goal_col - start_col, goal_row - start_row)
        heapq.heappush(open_set, (h_start, 0.0, (start_col, start_row)))

        came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
        g_scores: Dict[Tuple[int, int], float] = {(start_col, start_row): 0.0}
        closed_set = set()

        max_iterations = 25000
        iterations = 0

        while open_set and iterations < max_iterations:
            iterations += 1
            _, current_g, current = heapq.heappop(open_set)

            if current in closed_set:
                continue
            closed_set.add(current)

            curr_c, curr_r = current
            if curr_c == goal_col and curr_r == goal_row:
                # Reconstruct raw path
                raw_path = self._reconstruct_path(came_from, current)
                # Apply string-pulling / line-of-sight smoothing
                smoothed_path = self._smooth_path(raw_path, costmap)
                return [{"x": p[0], "z": p[1]} for p in smoothed_path]

            for dc, dr, move_dist in self.neighbors:
                neighbor = (curr_c + dc, curr_r + dr)
                nc, nr = neighbor

                if not self.grid.is_in_bounds(nc, nr) or neighbor in closed_set:
                    continue

                cell_cost = costmap[nr, nc]
                if cell_cost >= 90:  # Blocked or severe obstacle cushion
                    continue

                # Add penalty for approaching obstacle cushion
                penalty = (cell_cost / 100.0) * 3.0
                tentative_g = current_g + move_dist + penalty

                if neighbor not in g_scores or tentative_g < g_scores[neighbor]:
                    came_from[neighbor] = current
                    g_scores[neighbor] = tentative_g
                    h_score = math.hypot(goal_col - nc, goal_row - nr)
                    f_score = tentative_g + h_score * 1.05  # slightly greedy heuristic for speed
                    heapq.heappush(open_set, (f_score, tentative_g, neighbor))

        return None

    def _find_nearest_free(self, col: int, row: int, costmap: np.ndarray, max_r: int = 12) -> Tuple[Optional[int], Optional[int]]:
        if self.grid.is_in_bounds(col, row) and costmap[row, col] < 80:
            return col, row

        for r in range(1, max_r + 1):
            for dc in range(-r, r + 1):
                for dr in range(-r, r + 1):
                    nc = col + dc
                    nr = row + dr
                    if self.grid.is_in_bounds(nc, nr) and costmap[nr, nc] < 70:
                        return nc, nr
        return None, None

    def _reconstruct_path(self, came_from: Dict[Tuple[int, int], Tuple[int, int]],
                          current: Tuple[int, int]) -> List[Tuple[float, float]]:
        path = [self.grid.grid_to_world(current[0], current[1])]
        while current in came_from:
            current = came_from[current]
            path.append(self.grid.grid_to_world(current[0], current[1]))
        path.reverse()
        return path

    def _smooth_path(self, raw_path: List[Tuple[float, float]], costmap: np.ndarray) -> List[Tuple[float, float]]:
        """String-pulling algorithm to eliminate unnecessary grid zig-zags."""
        if len(raw_path) <= 2:
            return raw_path

        smoothed = [raw_path[0]]
        current_idx = 0

        while current_idx < len(raw_path) - 1:
            next_idx = len(raw_path) - 1
            while next_idx > current_idx + 1:
                p1 = raw_path[current_idx]
                p2 = raw_path[next_idx]
                if self.grid.is_line_of_sight_clear(p1[0], p1[1], p2[0], p2[1], costmap, max_cost=75):
                    break
                next_idx -= 1

            smoothed.append(raw_path[next_idx])
            current_idx = next_idx

        return smoothed
