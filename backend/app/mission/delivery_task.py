"""Delivery Task and Mission Data Models for MediBot KP."""
import time
import uuid
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class TaskPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    STAT_CRITICAL = "STAT_CRITICAL"


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    EN_ROUTE_PICKUP = "EN_ROUTE_PICKUP"
    LOADING = "LOADING"
    EN_ROUTE_DELIVERY = "EN_ROUTE_DELIVERY"
    OBSTACLE_HOLD = "OBSTACLE_HOLD"
    DELIVERING = "DELIVERING"
    COMPLETED = "COMPLETED"
    RETURNING_TO_BASE = "RETURNING_TO_BASE"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class DeliveryTask(BaseModel):
    id: str = Field(default_factory=lambda: f"TASK-{uuid.uuid4().hex[:6].upper()}")
    title: str = "Medical Supply Delivery"
    pickup_dept_id: str = "pharmacy"
    delivery_dept_id: str = "nursing_station"
    package_type: str = "Cold-Chain Biologics"  # Critical Blood, Controlled Narcotics, Stat Lab Vials, General Supplies
    priority: TaskPriority = TaskPriority.HIGH
    status: TaskStatus = TaskStatus.PENDING

    recipient_name: str = "Charge Nurse Station 3B"
    patient_id: Optional[str] = "PT-8842 (Bed 3B-02)"
    notes: str = "Urgent stat replenishment order from central pharmacy."

    created_at: float = Field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    failure_reason: Optional[str] = None

    distance_traveled_m: float = 0.0
    duration_seconds: float = 0.0
    reroutes_count: int = 0
    obstacles_encountered: int = 0
