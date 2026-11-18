"""Mission and Delivery Management API Routes for MediBot KP."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.simulation_engine import simulation_engine
from app.mission.delivery_task import TaskPriority

router = APIRouter(prefix="/api/missions", tags=["Missions"])


class CreateMissionRequest(BaseModel):
    pickup_dept_id: str = "pharmacy"
    delivery_dept_id: str = "nursing_station"
    package_type: str = "Cold-Chain Biologics"
    priority: TaskPriority = TaskPriority.HIGH
    notes: Optional[str] = "Medical supply delivery order"


@router.get("")
def list_missions():
    return {
        "active_mission": simulation_engine.mission_sm.active_task.model_dump() if simulation_engine.mission_sm.active_task else None,
        "history": simulation_engine.mission_manager.get_all_missions()
    }


@router.post("")
def create_and_start_mission(req: CreateMissionRequest):
    task = simulation_engine.start_mission_workflow(
        pickup_dept_id=req.pickup_dept_id,
        delivery_dept_id=req.delivery_dept_id,
        package_type=req.package_type,
        priority=req.priority
    )
    return {
        "status": "started",
        "mission": task.model_dump(),
        "phase": simulation_engine.mission_sm.phase.value
    }


@router.post("/{mission_id}/pause")
def pause_mission(mission_id: str):
    simulation_engine.pause_mission()
    return {"status": "paused", "phase": simulation_engine.mission_sm.phase.value}


@router.post("/{mission_id}/resume")
def resume_mission(mission_id: str):
    simulation_engine.resume_mission()
    return {"status": "resumed", "phase": simulation_engine.mission_sm.phase.value}


@router.post("/{mission_id}/cancel")
def cancel_mission(mission_id: str):
    simulation_engine.mission_sm.abort_mission()
    return {"status": "cancelled", "phase": simulation_engine.mission_sm.phase.value}
