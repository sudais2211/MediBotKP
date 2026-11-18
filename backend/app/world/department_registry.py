"""Hospital Department and Waypoint Registry for MediBot KP."""
import json
import os
from typing import List, Dict, Optional, Any
from pydantic import BaseModel


class Department(BaseModel):
    id: str
    name: str
    code: str
    category: str
    coordinates: Dict[str, float]
    waypoint: Dict[str, float]  # x, z, theta
    description: str
    color: str


class DepartmentRegistry:
    def __init__(self, data_path: Optional[str] = None):
        if data_path is None:
            data_path = os.path.join(os.path.dirname(__file__), "..", "data", "departments.json")
        self.data_path = data_path
        self._departments: Dict[str, Department] = {}
        self.load()

    def load(self):
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for item in data:
                dept = Department(**item)
                self._departments[dept.id] = dept

    def get_all(self) -> List[Department]:
        return list(self._departments.values())

    def get(self, dept_id: str) -> Optional[Department]:
        return self._departments.get(dept_id)

    def get_waypoint(self, dept_id: str) -> Optional[Dict[str, float]]:
        dept = self.get(dept_id)
        return dept.waypoint if dept else None
