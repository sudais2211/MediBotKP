"""Robot Telemetry and Hardware Control API Routes for MediBot KP."""
from fastapi import APIRouter
from app.core.simulation_engine import simulation_engine

router = APIRouter(prefix="/api/robot", tags=["Robot Control"])


@router.get("/status")
def get_robot_status():
    step_info = {
        "x": simulation_engine.robot.x,
        "y": 0.0,
        "z": simulation_engine.robot.z,
        "theta": simulation_engine.robot.theta,
        "step_dist": 0.0
    }
    bms = {
        "percentage": simulation_engine.battery.soc_percent,
        "voltage": simulation_engine.battery.get_voltage(),
        "is_charging": simulation_engine.battery.is_charging,
        "wh_consumed": simulation_engine.battery.total_wh_consumed
    }
    now = simulation_engine.last_tick_time
    return simulation_engine._build_telemetry_packet(
        step_info, bms,
        simulation_engine.latest_lidar_scan or simulation_engine.lidar.scan(simulation_engine.robot.x, simulation_engine.robot.z, simulation_engine.robot.theta),
        simulation_engine.latest_detections,
        simulation_engine.mission_sm.phase,
        now
    )


@router.post("/emergency-stop")
def trigger_emergency_stop():
    simulation_engine.emergency_stop()
    return {"status": "ok", "message": "Emergency Stop engaged", "phase": simulation_engine.mission_sm.phase.value}


@router.post("/release-emergency-stop")
def release_emergency_stop():
    simulation_engine.release_emergency_stop()
    return {"status": "ok", "message": "Emergency Stop released", "phase": simulation_engine.mission_sm.phase.value}


@router.post("/return-to-base")
def return_to_base():
    simulation_engine.return_to_base()
    return {"status": "ok", "message": "Robot commanded to return to Charging Dock", "phase": simulation_engine.mission_sm.phase.value}
