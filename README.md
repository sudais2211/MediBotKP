# MediBot KP — Autonomous Hospital Delivery Robot Simulator

**Company:** RoboNex Innovations  
**Product:** MediBot KP  
**Event:** AI Innovation Challenge 2026 Live Demonstration  
**Type:** 3D Interactive Simulation Prototype & Digital Twin  

> **Simulation Honesty Disclaimer:**  
> *MediBot KP is a virtual simulation prototype. Sensor readings, AI detections, navigation behavior, and performance metrics are simulated and do not represent physical-robot field testing. No claim is made to physical-robot deployment, clinical validation, or real patient-data processing.*

---

## 1. Overview & Non-Negotiable Demonstration Workflow

MediBot KP is an end-to-end 3D hospital digital twin simulation and robotics control platform built for intra-hospital delivery workflows. It simulates autonomous transit between clinical units, 360° planar LiDAR perception, real-time A* route planning, dynamic obstacle avoidance, cargo compartment locking, and 20 Hz WebSocket telemetry streaming.

### The Live Demonstration Workflow:
1. **Operator Opens Dashboard:** Launches the dark-themed robotics control dashboard connected live to the simulation engine.
2. **Selects Pickup Location:** Operator designates **Central Pharmacy** as the pickup origin.
3. **Selects Delivery Destination:** Operator designates **Nursing Station 3B** as the destination.
4. **Assigns Supply Task:** Configures a medical task (e.g. *Cold-Chain Biologics / STAT Critical*).
5. **Starts Mission:** Presses **Start Mission**.
6. **Autonomous Transit to Pharmacy:** MediBot KP un-docks from the charging pad and follows a collision-free A* route to Pharmacy.
7. **Cargo Loading:** Robot stops at Pharmacy dispensing bay, the motorized lid automatically opens, the medical cargo package is loaded, and the lid closes and locks.
8. **En Route to Nursing Station:** Robot navigates into the main arterial corridor.
9. **Corridor Obstacle Appears:** A virtual human (Dr. Vance, Caregiver) appears in the corridor (triggered via button or script).
10. **Virtual LiDAR Detection:** The 360° LiDAR raycaster detects the obstacle at ~1.8m, flashes an alert banner, and safely decelerates / halts.
11. **Rerouting or Safe Clearance:** Local planner evaluates the corridor, holds safely, or computes an alternate A* route.
12. **Arrival at Nursing Station:** Robot reaches Nursing Station, opens lid, verifies delivery, and transitions status to **Completed**.
13. **Return to Dock:** Robot autonomously navigates back to the maintenance dock, re-engages inductive charging, and logs all telemetry to SQLite.

---

## 2. Technical Stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn, WebSockets, Pydantic v2, NumPy, SQLite / SQLAlchemy, Pytest.
- **Frontend:** React 18, TypeScript, Three.js, React Three Fiber (R3F), @react-three/drei, Tailwind CSS, Lucide Icons.
- **Navigation:** 8-Connected A* with string-pulling smoothing, $0.25\text{ m}$ Occupancy Grid with safety inflation layer, Pure Pursuit local motion controller.
- **Perception:** Virtual 360° planar LiDAR raycaster (180 rays), Simulated AI Perception Module ($120^\circ$ FOV object tracking & classification).
- **Communication:** Bi-directional WebSockets at 20 Hz (`/ws/telemetry`) + REST API (`/api/*`).

---

## 3. Project Directory Structure

```text
MediBotKP/
├── README.md
├── docker-compose.yml
├── .env.example
├── pytest.ini
├── docs/
│   ├── architecture.md             # System design, data flow & schemas
│   ├── demo_script.md              # Live narration script for 2026 Challenge
│   ├── simulation_boundaries.md    # Disclaimers and synthetic data rules
│   └── ros2_migration_plan.md      # Path to ROS 2 Nav2 deployment
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                 # FastAPI app & lifespan runner
│   │   ├── config.py               # Pydantic Settings
│   │   ├── api/                    # REST routes & WebSocket hub
│   │   ├── core/                   # 20 Hz Simulation engine & telemetry
│   │   ├── navigation/             # OccupancyGrid, A*, MotionController
│   │   ├── perception/             # Virtual LiDAR & Simulated AI Perception
│   │   ├── mission/                # State machine & SQLite task manager
│   │   ├── robot/                  # Differential drive kinematics & BMS
│   │   ├── world/                  # Layout geometry & dynamic obstacles
│   │   └── data/                   # hospital_map.json, departments.json
│   └── tests/                      # Unit tests & demo workflow tests
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.tsx                 # Main layout & canvas rig
        ├── api/client.ts           # REST and WebSocket client
        ├── state/                  # Simulation state hook
        ├── three/                  # 3D Hospital, Robot, LiDAR, Route
        ├── dashboard/              # Mission, Telemetry, Perception panels
        └── components/             # 2D Canvas Minimap
```

---

## 4. Quick Start & Run Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Start the Backend Server
```bash
# From workspace root
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```
*Backend will be running at `http://127.0.0.1:8000`. Swagger API docs available at `http://127.0.0.1:8000/docs`.*

### 2. Start the Frontend Application
```bash
# From workspace root
cd frontend
npm run dev
```
*Open your browser to `http://localhost:5173` to launch the MediBot KP 3D Simulator.*

### 3. Run Automated Unit Tests & Workflow Verification
```bash
# Run backend test suite (6 tests)
python -m pytest backend/tests/ -v

# Run full end-to-end demo workflow verification
python backend/tests/test_demo_workflow.py
```

### 4. Running with Docker Compose
```bash
docker-compose up --build
```

---

## 5. REST API & WebSocket Reference

### Core Endpoints:
- `GET  /api/health` — Service health check & simulation state
- `GET  /api/map` — Hospital dimensions, walls, doorways, furniture
- `GET  /api/departments` — Department coordinates and waypoints
- `GET  /api/robot/status` — Current pose, velocity, battery, indicators
- `GET  /api/missions` — Active mission and SQLite audit trail
- `POST /api/missions` — Create and start new delivery task
- `POST /api/robot/emergency-stop` — Trigger emergency hardware brake
- `POST /api/robot/release-emergency-stop` — Release emergency brake
- `POST /api/robot/return-to-base` — Command autonomous return to dock
- `POST /api/simulation/trigger-obstacle` — Toggle demo corridor obstacle
- `POST /api/simulation/reset` — Reset robot pose to dock
- `GET  /api/metrics` — Aggregate simulation performance summary
- `WS   /ws/telemetry` — High-frequency 20 Hz bi-directional telemetry stream

---

## 6. Demo Presentation Guide
Refer to [docs/demo_script.md](docs/demo_script.md) for the live step-by-step narration script tailored for the AI Innovation Challenge 2026.
Refer to [docs/ros2_migration_plan.md](docs/ros2_migration_plan.md) for the detailed ROS 2 Navigation2 migration blueprint.
