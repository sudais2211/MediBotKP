# MediBot KP — Simulation Boundaries & Disclaimers
**RoboNex Innovations — AI Innovation Challenge 2026**

---

## 1. Prototype Scope and Boundaries

MediBot KP is an interactive 3D software simulation prototype and digital twin designed solely for algorithmic demonstration and evaluation during the AI Innovation Challenge 2026.

### Key Simulation Boundaries:
1. **Software Simulation Prototype:** All demonstrations take place within an in-silico 3D simulation environment using Three.js and Python. No physical robot hardware, physical chassis, or physical microcontroller is present or claimed.
2. **Virtual 360-Degree LiDAR:** Laser rays, point clouds, range calculations, and distance metrics are generated via mathematical ray-segment and ray-circle intersection algorithms in Python. They simulate the geometric properties of a planar scanning LiDAR (e.g. SICK TiM or RPLiDAR) but do not involve physical optical sensors or physical laser emissions.
3. **Simulated AI Perception Module:** Object classifications (e.g. "Simulated Human Personnel", "Medical Supply Cart"), bounding boxes, and confidence scores are synthetically generated from spatial queries against active simulated world objects. They simulate the output format of a YOLOv8 or torchvision object detection pipeline.
4. **Estimated Telemetry & Metrics:** Battery state of charge (SoC %), cell voltage, motor current draw, Watt-hours consumed, odometry, velocity, and transit durations are simulated values computed using discrete-time mathematical models (differential drive unicycle kinematics, Coulomb counting battery models).
5. **No Medical Certification or Clinical Deployment:** MediBot KP is not a certified medical device (FDA 510(k), CE-MDR Class I/IIa, or ISO 13485). It is not deployed in any real-world hospital, clinic, or healthcare facility.
6. **No Real Patient Data:** All patient identifiers (e.g., `PT-8842`), prescription details, bed numbers, and staff names (e.g., `Dr. Vance`) are fictitious, synthetic demo placeholders. No Protected Health Information (PHI) or Personally Identifiable Information (PII) under HIPAA or GDPR is stored or transmitted.

---

## 2. Standard Display Disclaimer

The following disclaimer is permanently embedded in the user interface, telemetry stream, API documentation, and audit records:

> **"MediBot KP is a virtual simulation prototype. Sensor readings, AI detections, navigation behavior, and performance metrics are simulated and do not represent physical-robot field testing."**

---

## 3. UI Labeling Matrix

| Dashboard Component | Applied Label | Functional Reality |
|---|---|---|
| LiDAR Scanner | `VIRTUAL 360° PLANAR LIDAR` | Raycast geometric intersection against 2D wall and obstacle geometry |
| Object Detection | `SIMULATED PERCEPTION MODULE` | Synthetic classification and confidence generation |
| Battery Indicator | `SIMULATED BATTERY BMS` | Linear discharge/charge model based on unicycle power assumptions |
| Odometry / Speed | `ESTIMATED ODOMETRY & KINEMATICS` | Numerical Euler integration of differential wheel speeds ($dt = 0.05\text{s}$) |
| Performance Metrics | `ESTIMATED SIMULATION METRICS` | Aggregated counters from software state machine transitions |
