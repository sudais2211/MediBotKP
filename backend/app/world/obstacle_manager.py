"""Dynamic Obstacle Manager for MediBot KP Simulation Environment."""
import time
import math
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class SimulatedObstacle(BaseModel):
    id: str
    type: str  # VIRTUAL_PERSONNEL, MEDICAL_CART, HAZARD_CONE, UNKNOWN
    name: str
    x: float
    z: float
    radius: float = 0.40
    is_dynamic: bool = False
    vx: float = 0.0
    vz: float = 0.0
    patrol_points: List[Dict[str, float]] = Field(default_factory=list)
    current_patrol_index: int = 0
    confidence: float = 0.95
    classification_label: str = "Simulated Human Personnel"
    is_active: bool = True
    spawn_time: float = Field(default_factory=time.time)


class ObstacleManager:
    def __init__(self):
        self._obstacles: Dict[str, SimulatedObstacle] = {}
        # Pre-seed a few realistic static/ambient obstacles in rooms
        self._init_ambient_obstacles()

    def _init_ambient_obstacles(self):
        # Place a mobile medical cart parked near reception alcove
        cart = SimulatedObstacle(
            id="obs_cart_lobby",
            type="MEDICAL_CART",
            name="Mobile Crash Cart #04",
            x=-2.5,
            z=3.8,
            radius=0.45,
            is_dynamic=False,
            confidence=0.94,
            classification_label="Medical Supply Cart"
        )
        self._obstacles[cart.id] = cart

    def trigger_demo_obstacle(self) -> SimulatedObstacle:
        """Spawn the live-demo obstacle in the main delivery corridor between Pharmacy and Nursing Station."""
        demo_obs = SimulatedObstacle(
            id="obs_demo_human_1",
            type="VIRTUAL_PERSONNEL",
            name="Dr. Vance (Caregiver)",
            x=-4.0,
            z=0.0,  # Center of main corridor
            radius=0.38,
            is_dynamic=False,
            confidence=0.965,
            classification_label="Simulated Human / Clinical Staff",
            is_active=True
        )
        self._obstacles[demo_obs.id] = demo_obs
        return demo_obs

    def remove_demo_obstacle(self) -> bool:
        if "obs_demo_human_1" in self._obstacles:
            del self._obstacles["obs_demo_human_1"]
            return True
        return False

    def toggle_demo_obstacle(self) -> Dict[str, Any]:
        if "obs_demo_human_1" in self._obstacles:
            del self._obstacles["obs_demo_human_1"]
            return {"active": False, "message": "Demo obstacle removed from corridor"}
        else:
            obs = self.trigger_demo_obstacle()
            return {"active": True, "message": "Demo obstacle spawned in corridor", "obstacle": obs.model_dump()}

    def add_obstacle(self, obstacle: SimulatedObstacle):
        self._obstacles[obstacle.id] = obstacle

    def remove_obstacle(self, obstacle_id: str) -> bool:
        if obstacle_id in self._obstacles:
            del self._obstacles[obstacle_id]
            return True
        return False

    def clear_dynamic_obstacles(self):
        to_del = [k for k, v in self._obstacles.items() if k.startswith("obs_demo") or v.is_dynamic]
        for k in to_del:
            del self._obstacles[k]

    def get_all_active(self) -> List[SimulatedObstacle]:
        return [obs for obs in self._obstacles.values() if obs.is_active]

    def update(self, dt: float):
        """Update positions for dynamic / walking obstacles."""
        for obs in self._obstacles.values():
            if not obs.is_active or not obs.is_dynamic or not obs.patrol_points:
                continue

            target = obs.patrol_points[obs.current_patrol_index]
            dx = target["x"] - obs.x
            dz = target["z"] - obs.z
            dist = math.hypot(dx, dz)
            speed = 0.5  # m/s human walking speed

            if dist < 0.1:
                # Cycle to next patrol point
                obs.current_patrol_index = (obs.current_patrol_index + 1) % len(obs.patrol_points)
            else:
                obs.vx = (dx / dist) * speed
                obs.vz = (dz / dist) * speed
                obs.x += obs.vx * dt
                obs.z += obs.vz * dt
