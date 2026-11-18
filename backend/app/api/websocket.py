"""Real-time WebSocket Telemetry Hub for MediBot KP Digital Twin."""
import asyncio
import json
from typing import Set, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.simulation_engine import simulation_engine

router = APIRouter(tags=["WebSocket Telemetry"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_json(self, message: Dict[str, Any]):
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


# Register listener on simulation engine to forward telemetry packets
def on_telemetry(packet: Dict[str, Any]):
    if manager.active_connections:
        # Schedule broadcast on the active asyncio event loop
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_json(packet))
        except RuntimeError:
            pass


simulation_engine.add_telemetry_listener(on_telemetry)


@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                action = msg.get("action")
                if action == "start_mission":
                    simulation_engine.start_mission_workflow(
                        pickup_dept_id=msg.get("pickup", "pharmacy"),
                        delivery_dept_id=msg.get("destination", "nursing_station"),
                        package_type=msg.get("package_type", "Cold-Chain Biologics"),
                    )
                elif action == "pause":
                    simulation_engine.pause_mission()
                elif action == "resume":
                    simulation_engine.resume_mission()
                elif action == "emergency_stop":
                    simulation_engine.emergency_stop()
                elif action == "release_emergency_stop":
                    simulation_engine.release_emergency_stop()
                elif action == "return_to_base":
                    simulation_engine.return_to_base()
                elif action == "trigger_obstacle":
                    simulation_engine.trigger_obstacle_event()
                elif action == "reset":
                    simulation_engine.reset_simulation()
            except Exception as e:
                print(f"Error handling websocket command: {e}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
