"""Local Motion Controller and Waypoint Follower for MediBot KP."""
import math
from typing import List, Dict, Tuple, Optional
from app.config import settings


class MotionController:
    def __init__(self):
        self.lookahead_dist = 0.85      # meters lookahead for Pure Pursuit
        self.goal_tolerance = 0.25      # meters to destination
        self.angle_tolerance = 0.15     # radians (~8.5 degrees)
        self.max_v = settings.MAX_LINEAR_SPEED
        self.max_omega = settings.MAX_ANGULAR_SPEED

    def compute_control(self,
                        current_x: float,
                        current_z: float,
                        current_theta: float,
                        path: List[Dict[str, float]],
                        target_final_theta: Optional[float] = None,
                        speed_factor: float = 1.0) -> Tuple[float, float, bool, float]:
        """
        Compute command velocities (v, omega), reached_goal flag, and remaining distance.
        """
        if not path or len(path) == 0:
            return 0.0, 0.0, True, 0.0

        # Calculate remaining path distance
        remaining_dist = 0.0
        # Distance from robot to first remaining waypoint
        first_pt = path[0]
        remaining_dist += math.hypot(first_pt["x"] - current_x, first_pt["z"] - current_z)
        for i in range(len(path) - 1):
            remaining_dist += math.hypot(path[i+1]["x"] - path[i]["x"], path[i+1]["z"] - path[i]["z"])

        goal_pt = path[-1]
        dist_to_goal = math.hypot(goal_pt["x"] - current_x, goal_pt["z"] - current_z)

        # Check if already within goal tolerance
        if dist_to_goal <= self.goal_tolerance:
            if target_final_theta is not None:
                # Align heading with goal orientation
                angle_diff = (target_final_theta - current_theta + math.pi) % (2 * math.pi) - math.pi
                if abs(angle_diff) > self.angle_tolerance:
                    cmd_omega = max(-self.max_omega, min(self.max_omega, 1.8 * angle_diff))
                    return 0.0, cmd_omega, False, dist_to_goal
            return 0.0, 0.0, True, 0.0

        # Find lookahead target point along the path
        target_point = self._find_lookahead_point(current_x, current_z, path)

        # Vector from robot to lookahead target
        dx = target_point["x"] - current_x
        dz = target_point["z"] - current_z
        target_angle = math.atan2(dz, dx)

        # Heading error
        angle_err = (target_angle - current_theta + math.pi) % (2 * math.pi) - math.pi

        # If heading error is large, prioritize rotation on the spot before surging forward
        if abs(angle_err) > 0.8:  # ~45 degrees
            cmd_v = 0.08 * speed_factor  # crawl forward slowly
            cmd_omega = max(-self.max_omega, min(self.max_omega, 2.2 * angle_err))
        else:
            # Scale linear speed based on distance to goal and heading error
            decel_dist = 1.5  # start slowing down when within 1.5m of goal
            if dist_to_goal < decel_dist:
                speed_scale = max(0.18, (dist_to_goal / decel_dist))
            else:
                speed_scale = 1.0

            # Reduce linear speed when turning
            turn_penalty = max(0.3, 1.0 - abs(angle_err) / 1.0)
            cmd_v = self.max_v * speed_scale * turn_penalty * speed_factor
            cmd_omega = max(-self.max_omega, min(self.max_omega, 2.0 * angle_err))

        return cmd_v, cmd_omega, False, remaining_dist

    def _find_lookahead_point(self, x: float, z: float, path: List[Dict[str, float]]) -> Dict[str, float]:
        if len(path) == 1:
            return path[0]

        # Scan waypoints and pick the first one farther than lookahead_dist,
        # or the final goal if all are within lookahead
        for pt in path:
            dist = math.hypot(pt["x"] - x, pt["z"] - z)
            if dist >= self.lookahead_dist:
                return pt

        return path[-1]
