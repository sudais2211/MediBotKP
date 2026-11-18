"""Configuration settings for MediBot KP Simulation Engine."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Service Information
    APP_NAME: str = "MediBot KP Digital Twin Simulation Engine"
    PRODUCT_NAME: str = "MediBot KP"
    COMPANY: str = "RoboNex Innovations"
    EVENT: str = "AI Innovation Challenge 2026"
    VERSION: str = "1.0.0-PROTOTYPE"

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]
    SIMULATION_TICK_HZ: float = 20.0  # 20 Hz simulation loop (dt = 0.05s)

    # Robot Physical & Kinematic Parameters
    ROBOT_RADIUS: float = 0.42       # meters (bounding footprint)
    WHEEL_BASE: float = 0.48         # distance between left/right drive wheels (m)
    WHEEL_RADIUS: float = 0.10       # meters
    MAX_LINEAR_SPEED: float = 0.90   # m/s (~3.2 km/h indoor hospital speed)
    MAX_ANGULAR_SPEED: float = 1.40  # rad/s (~80 deg/s)
    MAX_LINEAR_ACCEL: float = 0.85   # m/s^2
    MAX_ANGULAR_ACCEL: float = 2.20  # rad/s^2
    EMERGENCY_DECEL: float = 3.50    # m/s^2

    # Virtual LiDAR Parameters
    LIDAR_NUM_RAYS: int = 180        # 2-degree angular resolution for 360° scan
    LIDAR_MAX_RANGE: float = 8.0     # meters
    LIDAR_MIN_RANGE: float = 0.1     # meters
    LIDAR_WARNING_ZONE: float = 2.4  # meters (triggers caution alert & deceleration)
    LIDAR_STOP_ZONE: float = 1.1     # meters (triggers safe stop / reroute)

    # Battery Model
    BATTERY_CAPACITY_WH: float = 380.0
    BATTERY_DISCHARGE_MOVING_W: float = 110.0   # Watts when navigating
    BATTERY_DISCHARGE_IDLE_W: float = 18.0      # Watts when stationary / computing
    BATTERY_CHARGE_RATE_W: float = 480.0        # Fast inductive charging on dock pad

    # Occupancy Grid Parameters
    GRID_RESOLUTION: float = 0.25    # meters per cell
    INFLATION_RADIUS: float = 0.50   # safety inflation around walls & obstacles

    # Database
    DATABASE_URL: str = "sqlite:///./medibot.db"


settings = Settings()
