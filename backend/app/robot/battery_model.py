"""Simulated Battery Management System (BMS) for MediBot KP."""
import time
from app.config import settings


class SimulatedBatteryModel:
    def __init__(self, initial_soc_percent: float = 88.5):
        self.capacity_wh = settings.BATTERY_CAPACITY_WH
        self.soc_percent = initial_soc_percent  # 0.0 to 100.0%
        self.total_wh_consumed = 0.0
        self.is_charging = True
        self.nominal_voltage = 25.6  # 8S LiFePO4 battery pack
        self.min_voltage = 21.0
        self.max_voltage = 29.2
        self.last_update = time.time()

    def update(self, dt: float, is_moving: bool, is_docked: bool):
        self.is_charging = is_docked

        if is_docked:
            # Inductive fast charging
            charge_energy_wh = (settings.BATTERY_CHARGE_RATE_W * (dt / 3600.0))
            new_soc = self.soc_percent + (charge_energy_wh / self.capacity_wh) * 100.0
            self.soc_percent = min(100.0, new_soc)
            current_draw = -(settings.BATTERY_CHARGE_RATE_W / self.get_voltage())
        else:
            # Discharging
            power_w = settings.BATTERY_DISCHARGE_MOVING_W if is_moving else settings.BATTERY_DISCHARGE_IDLE_W
            discharge_wh = power_w * (dt / 3600.0)
            self.total_wh_consumed += discharge_wh
            new_soc = self.soc_percent - (discharge_wh / self.capacity_wh) * 100.0
            self.soc_percent = max(2.0, new_soc)
            current_draw = power_w / self.get_voltage()

        return {
            "percentage": round(self.soc_percent, 1),
            "voltage": round(self.get_voltage(), 2),
            "current_draw_a": round(current_draw, 2),
            "is_charging": self.is_charging,
            "wh_consumed": round(self.total_wh_consumed, 2),
            "estimated_runtime_min": round(self.get_estimated_remaining_time_min(is_moving), 1)
        }

    def get_voltage(self) -> float:
        # Linear approximation of discharge curve
        ratio = self.soc_percent / 100.0
        return self.min_voltage + (self.max_voltage - self.min_voltage) * ratio

    def get_estimated_remaining_time_min(self, is_moving: bool) -> float:
        current_wh = (self.soc_percent / 100.0) * self.capacity_wh
        power_w = settings.BATTERY_DISCHARGE_MOVING_W if is_moving else settings.BATTERY_DISCHARGE_IDLE_W
        if power_w <= 0:
            return 999.0
        return (current_wh / power_w) * 60.0
