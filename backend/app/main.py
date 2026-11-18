"""Main FastAPI Entry Point for MediBot KP Digital Twin Simulation Engine.
RoboNex Innovations - AI Innovation Challenge 2026.
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.simulation_engine import simulation_engine
from app.api import routes_simulation, routes_robot, routes_missions, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch the 20 Hz simulation background loop
    sim_task = asyncio.create_task(simulation_engine.run_loop())
    yield
    # Shutdown: Stop simulation loop
    simulation_engine.is_running = False
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    description="Interactive 3D Autonomous Hospital Delivery Robot Simulator for RoboNex Innovations",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(routes_simulation.router)
app.include_router(routes_robot.router)
app.include_router(routes_missions.router)
app.include_router(websocket.router)


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "company": settings.COMPANY,
        "product": settings.PRODUCT_NAME,
        "event": settings.EVENT,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "ws_telemetry": "/ws/telemetry",
        "status": "online",
        "simulation_disclaimer": "MediBot KP is a virtual simulation prototype. Sensor readings, AI detections, navigation behavior, and performance metrics are simulated and do not represent physical-robot field testing."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
