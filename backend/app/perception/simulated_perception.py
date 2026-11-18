"""Simulated Perception Module for MediBot KP.
Generates synthetic AI detections with explicit simulation labels and confidence scores.
"""
import math
import time
from typing import List, Dict, Any, Optional
from app.perception.perception_interface import IPerceptionModule, DetectionResult
from app.world.obstacle_manager import SimulatedObstacle


class SimulatedPerceptionModule(IPerceptionModule):
    def __init__(self, fov_deg: float = 120.0, max_detection_range: float = 7.0):
        self.fov_deg = fov_deg
        self.max_range = max_detection_range
        self.module_name = "Simulated Perception Module (Synthetic Vision Model)"

    def process_frame(self, robot_x: float, robot_z: float, robot_theta: float,
                      active_obstacles: List[SimulatedObstacle]) -> List[DetectionResult]:
        detections = []
        now = time.time()

        for obs in active_obstacles:
            if not obs.is_active:
                continue

            dx = obs.x - robot_x
            dz = obs.z - robot_z
            dist = math.hypot(dx, dz)

            if dist > self.max_range:
                continue

            angle_to_obs = math.atan2(dz, dx)
            # Relative bearing in degrees (-180 to 180)
            rel_angle_rad = (angle_to_obs - robot_theta + math.pi) % (2.0 * math.pi) - math.pi
            rel_angle_deg = math.degrees(rel_angle_rad)

            # Check if within camera field of view
            if abs(rel_angle_deg) <= (self.fov_deg / 2.0):
                # Calculate synthetic bounding box for UI HUD overlay
                # Center around x_center = 0.5 + rel_angle / FOV
                norm_x = 0.5 + (rel_angle_deg / self.fov_deg)
                box_width = max(0.1, min(0.45, 1.2 / dist))
                box_height = max(0.2, min(0.85, 2.0 / dist))

                ymin = max(0.05, 0.5 - box_height / 2.0)
                ymax = min(0.95, ymin + box_height)
                xmin = max(0.05, norm_x - box_width / 2.0)
                xmax = min(0.95, xmin + box_width)

                cat_map = {
                    "VIRTUAL_PERSONNEL": "human",
                    "MEDICAL_CART": "equipment",
                    "HAZARD_CONE": "hazard"
                }

                det = DetectionResult(
                    detection_id=f"SIM-DET-{obs.id}",
                    label=obs.classification_label,
                    category=cat_map.get(obs.type, "obstacle"),
                    confidence=obs.confidence,
                    distance_m=round(dist, 2),
                    bearing_deg=round(rel_angle_deg, 1),
                    world_x=round(obs.x, 2),
                    world_z=round(obs.z, 2),
                    bbox_2d=[round(ymin, 2), round(xmin, 2), round(ymax, 2), round(xmax, 2)],
                    is_simulated=True,
                    disclaimer="Simulated Human/Obstacle Detection - Synthetic Perception Model, Not Physical Camera",
                    timestamp=now
                )
                detections.append(det)

        return detections
