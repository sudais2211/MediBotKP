# MediBot KP — Live Demonstration Script
**AI Innovation Challenge 2026**  
**Presenter Guide & Non-Negotiable Demo Workflow**  
**RoboNex Innovations**  

---

## Pre-Flight Checklist (1 Minute Before Demo)
1. Backend running: `http://localhost:8000/api/health` returns `"status": "healthy"`.
2. Frontend open: `http://localhost:5173` (or production build).
3. Confirm green WebSocket indicator: `Telemetry Stream 20 Hz`.
4. Robot stationed at Charging Station (`DOCK-01`), status ring glowing purple (`DOCKED_CHARGING`).
5. Disclaimer visible: *"MediBot KP is a virtual simulation prototype..."*

---

## Live Demo Workflow & Narration

### Step 1: System Introduction (30 Seconds)
**Presenter Narration:**
> "Good morning, judges and colleagues. I am excited to present **MediBot KP**, developed by **RoboNex Innovations**. MediBot KP is our autonomous medical delivery digital twin, engineered to solve acute clinical intra-logistics bottlenecks.
> 
> In this live simulation, our digital twin coordinates real-time A* path planning, virtual 360-degree LiDAR raycasting, synthetic AI perception, and dynamic corridor re-routing. Let's execute our live STAT supply delivery."

**Actions:**
- Point out the 3D hospital environment (Pharmacy, Nursing Station, Emergency Dept, Lab, Patient Rooms).
- Switch camera view: click **Follow Robot** or **Orbit 3D**.
- Point out the 2D Tactical Minimap in the lower-right corner.

---

### Step 2: Task Assignment & Dispatch (30 Seconds)
**Presenter Narration:**
> "On our robotics control dashboard on the right:
> 1. We select **Central Pharmacy** as our pickup origin.
> 2. We designate **Nursing Station 3B** as the delivery destination.
> 3. We set our cargo to **Cold-Chain Biologics (Insulin & Vaccines, 2-8°C)** with **STAT Critical** priority.
> 
> Let's press **Assign Task & Start Mission**."

**Actions:**
- Ensure Pickup is `Central Pharmacy`, Destination is `Nursing Station 3B`.
- Click **Start Mission** or **Assign Task & Start Mission**.
- Observe robot status ring turn cyan/blue, navigation state switch to `NAVIGATING_TO_PICKUP`.

---

### Step 3: Autonomous Transit to Pharmacy & Cargo Loading (30 Seconds)
**Presenter Narration:**
> "MediBot KP un-docks from its charging pad and computes a smoothed A* path into the west corridor. Notice the differential drive kinematics—smooth acceleration, realistic wheel spin, and natural turns without sliding or teleportation.
> 
> As MediBot KP enters the Central Pharmacy dispensing bay:
> - The robot stops smoothly within 0.2 meters of the dispensing counter.
> - The state machine transitions to `LOADING_CARGO`.
> - The motorized medical compartment lid automatically rotates open.
> - The cold-chain supply package is loaded and secured inside the bay.
> - The lid closes and locks for transit."

**Actions:**
- Click **Follow Robot** to get a close-up camera angle of the cargo lid opening, package appearing inside, and lid closing.

---

### Step 4: Corridor Navigation & Dynamic Obstacle Encounter (45 Seconds)
**Presenter Narration:**
> "With cargo locked in transit, MediBot KP navigates into the main arterial corridor heading east toward Nursing Station 3B.
> 
> Now, in any real hospital, corridors are dynamic environments with unexpected personnel and equipment. Let's trigger a real-time obstacle event by clicking **Trigger Demo Obstacle**."

**Actions:**
- Click **Trigger Demo Obstacle**.
- A virtual human (Dr. Vance, Caregiver) appears in the corridor directly along the robot's route.

**Presenter Narration:**
> "Immediately, MediBot KP's virtual 360-degree LiDAR detects the obstacle at 2.4 meters:
> - Notice the green laser ray lines convert to amber and red on the obstacle footprint.
> - The dashboard immediately flashes a **PROXIMITY WARNING / CAUTION** alert banner.
> - The simulated perception module classifies the detection with **96.5% confidence** as 'Simulated Human / Clinical Staff (Dr. Vance)'.
> - In accordance with hospital safety protocols, MediBot KP smoothly decelerates, avoids collision, and evaluates whether to hold or execute a collision-free A* detour!"

---

### Step 5: Resumption & Delivery Completion (30 Seconds)
**Presenter Narration:**
> "Once the corridor clears—or an alternate path is followed—MediBot KP safely continues its trajectory and docks at **Nursing Station 3B**.
> 
> Watch the handover:
> - The robot halts at the nurse station counter.
> - The cargo compartment lid opens smoothly for the care team.
> - The package is retrieved, and the mission status transitions to **COMPLETED**."

**Actions:**
- Observe lid opening and task status transitioning to `COMPLETED`.

---

### Step 6: Autonomous Return to Charging Dock (30 Seconds)
**Presenter Narration:**
> "Upon delivery confirmation, MediBot KP automatically enters `RETURNING_TO_BASE`. It autonomously navigates through the corridor back to the maintenance bay, docks precisely on its inductive charging pad, and resumes high-rate battery replenishment.
> 
> In the **Audit Trail** tab, the complete mission log, distance traveled, obstacle encounters, and energy consumption have been immutably recorded in the backend database.
> 
> Thank you! We welcome your questions."

**Actions:**
- Click **Audit** tab in the dashboard to show the recorded mission row with distance, duration, and metrics.
- Click **Metrics** tab to show live energy consumption and runtime.
