"""Simulation Control, Environment Data, and Metrics API Routes for MediBot KP."""
from fastapi import APIRouter
from app.core.simulation_engine import simulation_engine
from app.config import settings

router = APIRouter(prefix="/api", tags=["Simulation"])


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "product": settings.PRODUCT_NAME,
        "company": settings.COMPANY,
        "event": settings.EVENT,
        "simulation_running": simulation_engine.is_running,
        "disclaimer": "Software Simulation Prototype - Not Physical Hardware"
    }


@router.get("/map")
def get_hospital_map():
    return simulation_engine.layout.raw_data


@router.get("/departments")
def get_departments():
    return [d.model_dump() for d in simulation_engine.departments.get_all()]


@router.post("/simulation/trigger-obstacle")
def trigger_obstacle():
    res = simulation_engine.trigger_obstacle_event()
    return res


@router.post("/simulation/reset")
def reset_simulation():
    simulation_engine.reset_simulation()
    return {"status": "reset", "message": "Simulation reset to starting charging dock"}


@router.get("/metrics")
def get_metrics():
    return simulation_engine.mission_manager.get_metrics_summary()
