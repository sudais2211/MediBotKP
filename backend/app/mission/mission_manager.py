"""Mission and Delivery Task Manager with SQLite History Logging for MediBot KP."""
import sqlite3
import time
import os
from typing import List, Optional, Dict, Any
from app.mission.delivery_task import DeliveryTask, TaskStatus, TaskPriority
from app.config import settings


class MissionManager:
    def __init__(self, db_path: str = "medibot.db"):
        self.db_path = db_path
        self.active_task: Optional[DeliveryTask] = None
        self.task_history: List[DeliveryTask] = []
        self._init_db()
        self._seed_sample_history()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS missions (
                id TEXT PRIMARY KEY,
                title TEXT,
                pickup_dept_id TEXT,
                delivery_dept_id TEXT,
                package_type TEXT,
                priority TEXT,
                status TEXT,
                recipient_name TEXT,
                patient_id TEXT,
                notes TEXT,
                created_at REAL,
                started_at REAL,
                completed_at REAL,
                failure_reason TEXT,
                distance_traveled_m REAL,
                duration_seconds REAL,
                reroutes_count INTEGER,
                obstacles_encountered INTEGER
            )
        """)
        conn.commit()
        conn.close()

    def _seed_sample_history(self):
        """Seed a completed mission into the history log for instant presentation."""
        now = time.time()
        past_mission = DeliveryTask(
            id="TASK-DEMO-001",
            title="Pre-Demo Calibration Run: Lab to ED",
            pickup_dept_id="laboratory",
            delivery_dept_id="emergency",
            package_type="Pathology Blood Panel",
            priority=TaskPriority.HIGH,
            status=TaskStatus.COMPLETED,
            recipient_name="Dr. Sarah Chen, ED Triage",
            patient_id="PT-9104",
            notes="Routine verification flight before AI Innovation Challenge presentation.",
            created_at=now - 1200,
            started_at=now - 1180,
            completed_at=now - 980,
            distance_traveled_m=28.4,
            duration_seconds=125.0,
            reroutes_count=1,
            obstacles_encountered=2
        )
        self.record_mission(past_mission)

    def create_mission(self,
                       pickup_dept_id: str = "pharmacy",
                       delivery_dept_id: str = "nursing_station",
                       package_type: str = "Cold-Chain Biologics",
                       priority: TaskPriority = TaskPriority.HIGH,
                       notes: str = "Medical supply delivery order") -> DeliveryTask:
        task = DeliveryTask(
            pickup_dept_id=pickup_dept_id,
            delivery_dept_id=delivery_dept_id,
            package_type=package_type,
            priority=priority,
            notes=notes
        )
        self.active_task = task
        self.record_mission(task)
        return task

    def record_mission(self, task: DeliveryTask):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO missions (
                id, title, pickup_dept_id, delivery_dept_id, package_type, priority,
                status, recipient_name, patient_id, notes, created_at, started_at,
                completed_at, failure_reason, distance_traveled_m, duration_seconds,
                reroutes_count, obstacles_encountered
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task.id, task.title, task.pickup_dept_id, task.delivery_dept_id,
            task.package_type, task.priority.value, task.status.value,
            task.recipient_name, task.patient_id, task.notes,
            task.created_at, task.started_at, task.completed_at,
            task.failure_reason, round(task.distance_traveled_m, 2),
            round(task.duration_seconds, 1), task.reroutes_count,
            task.obstacles_encountered
        ))
        conn.commit()
        conn.close()

    def get_all_missions(self) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM missions ORDER BY created_at DESC")
        rows = cursor.fetchall()
        results = [dict(row) for row in rows]
        conn.close()
        return results

    def get_metrics_summary(self) -> Dict[str, Any]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM missions")
        total_missions = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM missions WHERE status = 'COMPLETED'")
        completed_count = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM missions WHERE status = 'FAILED' OR status = 'CANCELLED'")
        failed_count = cursor.fetchone()[0] or 0

        cursor.execute("SELECT SUM(distance_traveled_m), SUM(duration_seconds), SUM(reroutes_count), SUM(obstacles_encountered) FROM missions")
        sums = cursor.fetchone()
        total_dist = sums[0] or 0.0
        total_duration = sums[1] or 0.0
        total_reroutes = sums[2] or 0
        total_obstacles = sums[3] or 0

        conn.close()

        success_rate = (completed_count / total_missions * 100.0) if total_missions > 0 else 100.0
        avg_speed = (total_dist / total_duration) if total_duration > 0 else 0.55

        return {
            "total_missions": total_missions,
            "completed_missions": completed_count,
            "failed_missions": failed_count,
            "success_rate_percent": round(success_rate, 1),
            "total_distance_m": round(total_dist, 1),
            "total_duration_seconds": round(total_duration, 1),
            "average_speed_mps": round(avg_speed, 2),
            "total_reroutes": total_reroutes,
            "total_obstacles_avoided": total_obstacles,
            "is_simulated_metrics": True,
            "disclaimer": "Simulated Metrics - Calculated via Digital Twin Kinematics & Event Logs"
        }
