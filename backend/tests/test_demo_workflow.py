"""End-to-End Demo Workflow Verification Script for MediBot KP."""
import urllib.request
import json
import time
import math


def post_json(url, data=None):
    payload = json.dumps(data).encode("utf-8") if data else b""
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_json(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def test_full_demo():
    base = "http://127.0.0.1:8000/api"

    print("Step 1: Reset simulation...")
    post_json(f"{base}/simulation/reset")
    time.sleep(0.5)

    print("Step 2: Create and start mission (Pharmacy -> Nursing Station)...")
    res = post_json(f"{base}/missions", {
        "pickup_dept_id": "pharmacy",
        "delivery_dept_id": "nursing_station",
        "package_type": "Cold-Chain Biologics",
        "priority": "STAT_CRITICAL"
    })
    print(f"Mission started: {res['mission']['id']}, phase={res['phase']}")

    reached_pharmacy = False
    departed_pharmacy = False
    obstacle_triggered = False
    obstacle_detected = False
    delivery_completed = False

    for tick in range(120):
        time.sleep(0.5)
        st = get_json(f"{base}/robot/status")
        phase = st["mission"]["phase"]
        pose = st["robot"]["pose"]
        v = st["robot"]["velocity"]["linear"]
        lid = st["robot"]["cargo"]["lid_open_ratio"]
        closest = st["lidar"]["closest_distance_m"]
        alert = st["lidar"]["alert_level"]

        if tick % 4 == 0:
            print(f"[{tick*0.5:.1f}s] Phase: {phase} | Pose: ({pose['x']:.2f}, {pose['z']:.2f}) | Speed: {v:.2f} m/s | Lid: {lid:.2f} | Closest: {closest:.2f}m")

        if phase == "LOADING_CARGO" and not reached_pharmacy:
            print(">>> Reached Pharmacy! Compartment lid opening to receive medical supplies.")
            reached_pharmacy = True

        if phase == "NAVIGATING_TO_DESTINATION" and not departed_pharmacy:
            print(">>> Cargo secured! MediBot KP en route to Nursing Station.")
            departed_pharmacy = True

        # When moving along main corridor towards nursing station, trigger demo obstacle
        if departed_pharmacy and not obstacle_triggered and pose["x"] > -7.0:
            print(">>> Step 6: Spawning demo obstacle (Dr. Vance) in delivery corridor!")
            obs_res = post_json(f"{base}/simulation/trigger-obstacle")
            print(f"Obstacle spawned: {obs_res}")
            obstacle_triggered = True

        if obstacle_triggered and not obstacle_detected:
            if alert in ["CAUTION", "CRITICAL_STOP"] or st["mission"].get("time_stopped_for_obstacles_s", 0) > 0.1:
                print(f">>> Step 7: Obstacle successfully detected! Alert={alert}, Distance={closest:.2f}m")
                obstacle_detected = True
                # Remove obstacle after 3 seconds or allow reroute
                time.sleep(2.0)
                post_json(f"{base}/simulation/trigger-obstacle")
                print(">>> Obstacle cleared by personnel. Robot resuming transit.")

        if phase == "ARRIVED_DELIVERING":
            print(">>> Reached Nursing Station! Delivering cargo to care team.")

        if phase in ["COMPLETED", "RETURNING_TO_BASE"] and not delivery_completed:
            print(">>> Delivery status changed to COMPLETED! Returning to charging dock.")
            delivery_completed = True

        if delivery_completed and phase == "DOCKED_CHARGING":
            print(">>> Robot safely returned and docked at Charging Station! Recharging battery.")
            break

    print("Step 8: Fetching mission history and metrics from SQLite...")
    history = get_json(f"{base}/missions")["history"]
    metrics = get_json(f"{base}/metrics")
    print(f"Total recorded missions in SQLite: {len(history)}")
    print(f"Summary metrics: distance={metrics['total_distance_m']}m, success_rate={metrics['success_rate_percent']}%")

    assert reached_pharmacy, "Should have reached Pharmacy"
    assert departed_pharmacy, "Should have loaded cargo and departed"
    assert delivery_completed, "Should have reached Nursing Station and completed delivery"
    print("\nDEMO WORKFLOW VALIDATION SUCCESSFUL: All non-negotiable criteria met!")


if __name__ == "__main__":
    test_full_demo()
