"""Perception Module Interface for MediBot KP.
Enables transparent plug-in of simulated perception or real YOLO / depth camera pipeline.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DetectionResult(BaseModel):
    detection_id: str
    label: str
    category: str  # human, equipment, hazard, unknown
    confidence: float
    distance_m: float
    bearing_deg: float
    world_x: float
    world_z: float
    bbox_2d: Optional[List[float]] = None  # [ymin, xmin, ymax, xmax] normalized
    is_simulated: bool = True
    disclaimer: str = "Simulated Detection - Synthetic Perception Model"
    timestamp: float


class IPerceptionModule(ABC):
    @abstractmethod
    def process_frame(self, robot_x: float, robot_z: float, robot_theta: float,
                      active_obstacles: List[Any]) -> List[DetectionResult]:
        """Detect and classify objects in robot vicinity."""
        pass
