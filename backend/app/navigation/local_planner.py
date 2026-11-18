"""Local Planner and Reactive Obstacle Avoidance for MediBot KP."""
import math
from typing import List, Dict, Tuple, Optional, Any
from app.config import settings
from app.navigation.astar_planner import AStarPlanner
from app.world.obstacle_manager import ObstacleManager, SimulatedObstacle


class LocalPlanner:
    def __init__(self, astar_planner: AStarPlanner, obstacle_manager: ObstacleManager):
        self.astar = astar_planner
        self.obstacle_manager = obstacle_manager
        self.replan_cooldown = 1.5  # seconds between replans
        self.last_replan_time = 0.0
        self.reroute_count = 0
        self.time_stopped = 0.0

    def prune_passed_waypoints(self, current_x: float, current_z: float,
                               path: List[Dict[str, float]], threshold: float = 0.6) -> List[Dict[str, float]]:
        """Remove waypoints that the robot has already passed."""
        if not path or len(path) <= 1:
            return path

        while len(path) > 1:
            dist = math.hypot(path[0]["x"] - current_x, path[0]["z"] - current_z)
            if dist < threshold:
                path.pop(0)
            else:
                break
        return path

    def is_path_blocked_by_obstacle(self, path: List[Dict[str, float]],
                                    obstacles: List[SimulatedObstacle],
                                    lookahead_m: float = 3.5) -> Tuple[bool, Optional[SimulatedObstacle]]:
        """Check if any dynamic or static obstacle intersects the path ahead within lookahead distance."""
        if not path or len(path) < 2:
            return False, None

        accum_dist = 0.0
        for i in range(len(path) - 1):
            p1 = path[i]
            p2 = path[i+1]
            seg_len = math.hypot(p2["x"] - p1["x"], p2["z"] - p1["z"])
            accum_dist += seg_len

            if accum_dist > lookahead_m:
                break

            for obs in obstacles:
                if not obs.is_active:
                    continue
                dist = self.astar.grid.layout.point_to_line_segment_dist(
                    obs.x, obs.z, p1["x"], p1["z"], p2["x"], p2["z"]
                )
                if dist < (obs.radius + settings.ROBOT_RADIUS + 0.15):
                    return True, obs

        return False, None

    def attempt_replan(self, current_x: float, current_z: float,
                       goal_x: float, goal_z: float,
                       now: float) -> Optional[List[Dict[str, float]]]:
        """Attempt to recompute alternate collision-free route avoiding active obstacles."""
        if (now - self.last_replan_time) < self.replan_cooldown:
            return None

        self.last_replan_time = now
        active_obs = self.obstacle_manager.get_all_active()
        dynamic_costmap = self.astar.grid.get_dynamic_costmap(active_obs)

        new_path = self.astar.plan(current_x, current_z, goal_x, goal_z, costmap=dynamic_costmap)
        if new_path:
            self.reroute_count += 1
            return new_path
        return None
