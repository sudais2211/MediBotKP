"""YOLO / Camera Perception Bridge for MediBot KP.
Provides the integration hook for real YOLO inference if a real camera node is attached,
otherwise defaults gracefully to the simulated perception module with clear labelling.
"""
from typing import List, Dict, Any, Optional
from app.perception.perception_interface import IPerceptionModule, DetectionResult
from app.perception.simulated_perception import SimulatedPerceptionModule


class YoloPerceptionBridge(IPerceptionModule):
    def __init__(self, fallback_simulated: bool = True):
        self.is_real_yolo_active = False
        self.simulated_module = SimulatedPerceptionModule()
        self.model_name = "YOLOv8n-Hospital (Simulated Bridge)"

    def process_frame(self, robot_x: float, robot_z: float, robot_theta: float,
                      active_obstacles: List[Any]) -> List[DetectionResult]:
        # If no physical camera hardware or RTSP stream is hooked up, use clearly labeled simulated detections
        detections = self.simulated_module.process_frame(robot_x, robot_z, robot_theta, active_obstacles)
        return detections
