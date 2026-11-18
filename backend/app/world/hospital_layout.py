"""Hospital Layout Geometry, Collision Model, and Raycaster for MediBot KP."""
import json
import os
import math
from typing import List, Dict, Tuple, Optional, Any
from app.config import settings


class WallSegment:
    def __init__(self, x1: float, z1: float, x2: float, z2: float, thickness: float = 0.2, wall_id: str = ""):
        self.x1 = x1
        self.z1 = z1
        self.x2 = x2
        self.z2 = z2
        self.thickness = thickness
        self.id = wall_id

    def as_tuple(self) -> Tuple[float, float, float, float]:
        return (self.x1, self.z1, self.x2, self.z2)


class FurnitureBox:
    def __init__(self, item_id: str, item_type: str, x: float, z: float, w: float, d: float, h: float, color: str):
        self.id = item_id
        self.type = item_type
        self.x = x
        self.z = z
        self.w = w
        self.d = d
        self.h = h
        self.color = color
        self.min_x = x - w / 2.0
        self.max_x = x + w / 2.0
        self.min_z = z - d / 2.0
        self.max_z = z + d / 2.0

    def contains(self, px: float, pz: float) -> bool:
        return (self.min_x <= px <= self.max_x) and (self.min_z <= pz <= self.max_z)


class HospitalLayout:
    def __init__(self, map_path: Optional[str] = None):
        if map_path is None:
            map_path = os.path.join(os.path.dirname(__file__), "..", "data", "hospital_map.json")
        self.map_path = map_path
        self.raw_data: Dict[str, Any] = {}
        self.outer_walls: List[WallSegment] = []
        self.interior_walls: List[WallSegment] = []
        self.furniture: List[FurnitureBox] = []
        self.doorways: List[Dict[str, Any]] = []
        self.all_line_segments: List[Tuple[float, float, float, float]] = []
        self.load()

    def load(self):
        with open(self.map_path, "r", encoding="utf-8") as f:
            self.raw_data = json.load(f)

        self.dimensions = self.raw_data.get("dimensions", {
            "x_min": -18.0, "x_max": 18.0,
            "z_min": -12.0, "z_max": 12.0,
            "grid_resolution": 0.25
        })

        self.outer_walls = []
        for ow in self.raw_data.get("outer_walls", []):
            seg = WallSegment(ow["x1"], ow["z1"], ow["x2"], ow["z2"], ow.get("thickness", 0.3), "outer")
            self.outer_walls.append(seg)
            self.all_line_segments.append(seg.as_tuple())

        self.interior_walls = []
        for iw in self.raw_data.get("interior_walls", []):
            seg = WallSegment(iw["x1"], iw["z1"], iw["x2"], iw["z2"], iw.get("thickness", 0.2), iw.get("id", ""))
            self.interior_walls.append(seg)
            self.all_line_segments.append(seg.as_tuple())

        self.furniture = []
        for fn in self.raw_data.get("furniture", []):
            # Dock pad is walkable, skip adding to static obstacles
            if fn.get("type") == "dock_pad":
                continue
            fbox = FurnitureBox(
                fn["id"], fn["type"], fn["x"], fn["z"],
                fn["w"], fn["d"], fn.get("h", 1.0), fn.get("color", "#64748b")
            )
            self.furniture.append(fbox)
            # Add bounding segments of furniture for raycasting
            self.all_line_segments.append((fbox.min_x, fbox.min_z, fbox.max_x, fbox.min_z))
            self.all_line_segments.append((fbox.max_x, fbox.min_z, fbox.max_x, fbox.max_z))
            self.all_line_segments.append((fbox.max_x, fbox.max_z, fbox.min_x, fbox.max_z))
            self.all_line_segments.append((fbox.min_x, fbox.max_z, fbox.min_x, fbox.min_z))

        self.doorways = self.raw_data.get("doorways", [])

    def is_point_in_obstacle(self, x: float, z: float, safety_margin: float = 0.0) -> bool:
        """Check if a point (x, z) hits any static wall, boundary, or furniture."""
        dim = self.dimensions
        if (x < dim["x_min"] + safety_margin or x > dim["x_max"] - safety_margin or
                z < dim["z_min"] + safety_margin or z > dim["z_max"] - safety_margin):
            return True

        # Check furniture bounding boxes
        for f in self.furniture:
            if (f.min_x - safety_margin <= x <= f.max_x + safety_margin and
                    f.min_z - safety_margin <= z <= f.max_z + safety_margin):
                return True

        # Check distance to wall segments
        for seg in self.all_line_segments:
            dist = self.point_to_line_segment_dist(x, z, seg[0], seg[1], seg[2], seg[3])
            if dist < (0.15 + safety_margin):
                return True

        return False

    @staticmethod
    def point_to_line_segment_dist(px: float, pz: float, x1: float, z1: float, x2: float, z2: float) -> float:
        dx = x2 - x1
        dz = z2 - z1
        l2 = dx * dx + dz * dz
        if l2 == 0:
            return math.hypot(px - x1, pz - z1)
        t = max(0.0, min(1.0, ((px - x1) * dx + (pz - z1) * dz) / l2))
        proj_x = x1 + t * dx
        proj_z = z1 + t * dz
        return math.hypot(px - proj_x, pz - proj_z)

    @staticmethod
    def ray_segment_intersect(ox: float, oz: float, rdx: float, rdz: float,
                              x1: float, z1: float, x2: float, z2: float,
                              max_range: float) -> Optional[float]:
        """Intersect ray: O + t * D with line segment P1 to P2."""
        # Line segment vector: (dx, dz)
        dx = x2 - x1
        dz = z2 - z1
        # Cross product of 2D vectors
        det = rdx * dz - rdz * dx
        if abs(det) < 1e-6:
            return None  # Parallel

        # Solve system: ox + t*rdx = x1 + u*dx, oz + t*rdz = z1 + u*dz
        u = ((ox - x1) * rdz - (oz - z1) * rdx) / det
        t = ((ox - x1) * dz - (oz - z1) * dx) / det

        if t > 0.05 and t <= max_range and 0.0 <= u <= 1.0:
            return t
        return None
