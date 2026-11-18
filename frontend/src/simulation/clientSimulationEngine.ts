import { TelemetryPacket, Department, SimulatedObstacle } from '../types/telemetry';
import departmentsData from '../data/departments.json';
import hospitalMapData from '../data/hospital_map.json';

interface Wall {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

export class ClientSimulationEngine {
  private x = -13.0;
  private z = -6.5;
  private theta = 0.0;
  private v = 0.0;
  private omega = 0.0;
  private targetV = 0.0;
  private targetOmega = 0.0;

  private wheelLeftRad = 0.0;
  private wheelRightRad = 0.0;

  private batterySoc = 94.0;
  private isCharging = true;
  private totalDistance = 0.0;
  private timeStopped = 0.0;
  private rerouteCount = 0;

  private phase = 'DOCKED_CHARGING';
  private activeTask: any = null;
  private currentPath: { x: number; z: number }[] = [];
  private currentTargetName = 'Charging Station';
  private currentTargetWaypoint: { x: number; z: number; theta?: number } | null = null;

  private lidOpenRatio = 0.0;
  private actionTimer = 0.0;

  private obstacles: SimulatedObstacle[] = [];
  private alertBanner: any = null;

  private walls: Wall[] = [];
  private seq = 0;
  private timer: any = null;
  private onTelemetryCallback: ((pkt: TelemetryPacket) => void) | null = null;

  constructor() {
    this.initWalls();
    this.initAmbientObstacles();
  }

  private initWalls() {
    this.walls = [];
    for (const w of (hospitalMapData as any).outer_walls) {
      this.walls.push({ x1: w.x1, z1: w.z1, x2: w.x2, z2: w.z2 });
    }
    for (const w of (hospitalMapData as any).interior_walls) {
      this.walls.push({ x1: w.x1, z1: w.z1, x2: w.x2, z2: w.z2 });
    }
  }

  private initAmbientObstacles() {
    this.obstacles = [
      {
        id: 'obs_cart_lobby',
        type: 'MEDICAL_CART',
        name: 'Mobile Crash Cart #04',
        x: -2.5,
        z: 3.8,
        radius: 0.45,
        is_dynamic: false,
        confidence: 0.94,
        classification_label: 'Medical Supply Cart',
        is_active: true
      }
    ];
  }

  public start(onTelemetry: (pkt: TelemetryPacket) => void) {
    this.onTelemetryCallback = onTelemetry;
    if (this.timer) clearInterval(this.timer);
    const dt = 0.05; // 20 Hz
    this.timer = setInterval(() => this.tick(dt), 50);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public startMission(pickupId: string, deliveryId: string, packageType: string, priority: string = 'HIGH') {
    this.activeTask = {
      id: `TASK-${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
      title: 'Medical Supply Delivery',
      pickup_dept_id: pickupId,
      delivery_dept_id: deliveryId,
      package_type: packageType,
      priority: priority,
      status: 'EN_ROUTE_PICKUP',
      distance_traveled_m: 0.0,
      duration_seconds: 0.0,
      reroutes_count: 0,
      obstacles_encountered: 0
    };
    this.phase = 'NAVIGATING_TO_PICKUP';
    this.planForCurrentPhase();
  }

  public pause() {
    if (this.phase !== 'PAUSED' && this.phase !== 'EMERGENCY_STOPPED') {
      this.phase = 'PAUSED';
    }
  }

  public resume() {
    if (this.phase === 'PAUSED') {
      this.phase = this.activeTask?.status === 'EN_ROUTE_DELIVERY' ? 'NAVIGATING_TO_DESTINATION' : 'NAVIGATING_TO_PICKUP';
    }
  }

  public emergencyStop() {
    this.phase = 'EMERGENCY_STOPPED';
    this.targetV = 0.0;
    this.targetOmega = 0.0;
    this.v = 0.0;
  }

  public releaseEmergencyStop() {
    if (this.phase === 'EMERGENCY_STOPPED') {
      this.phase = this.activeTask ? 'NAVIGATING_TO_DESTINATION' : 'DOCKED_CHARGING';
    }
  }

  public returnToBase() {
    this.phase = 'RETURNING_TO_BASE';
    this.planForCurrentPhase();
  }

  public toggleDemoObstacle() {
    const existing = this.obstacles.find(o => o.id === 'obs_demo_human_1');
    if (existing) {
      this.obstacles = this.obstacles.filter(o => o.id !== 'obs_demo_human_1');
      this.alertBanner = null;
      return { active: false };
    } else {
      const obs: SimulatedObstacle = {
        id: 'obs_demo_human_1',
        type: 'VIRTUAL_PERSONNEL',
        name: 'Dr. Vance (Caregiver)',
        x: -4.0,
        z: 0.0,
        radius: 0.38,
        is_dynamic: false,
        confidence: 0.965,
        classification_label: 'Simulated Human / Clinical Staff',
        is_active: true
      };
      this.obstacles.push(obs);
      return { active: true, obstacle: obs };
    }
  }

  public resetSimulation() {
    this.x = -13.0;
    this.z = -6.5;
    this.theta = 0.0;
    this.v = 0.0;
    this.omega = 0.0;
    this.targetV = 0.0;
    this.targetOmega = 0.0;
    this.phase = 'DOCKED_CHARGING';
    this.activeTask = null;
    this.currentPath = [];
    this.lidOpenRatio = 0.0;
    this.alertBanner = null;
    this.initAmbientObstacles();
  }

  private planForCurrentPhase() {
    let targetWp: { x: number; z: number; theta?: number } | null = null;
    const depts = departmentsData as Department[];

    if (this.phase === 'NAVIGATING_TO_PICKUP' && this.activeTask) {
      const d = depts.find(dept => dept.id === this.activeTask.pickup_dept_id);
      if (d) {
        targetWp = d.waypoint;
        this.currentTargetName = d.name;
      }
    } else if (this.phase === 'NAVIGATING_TO_DESTINATION' && this.activeTask) {
      const d = depts.find(dept => dept.id === this.activeTask.delivery_dept_id);
      if (d) {
        targetWp = d.waypoint;
        this.currentTargetName = d.name;
      }
    } else if (this.phase === 'RETURNING_TO_BASE') {
      const d = depts.find(dept => dept.id === 'dock');
      if (d) {
        targetWp = d.waypoint;
        this.currentTargetName = 'Charging Station';
      }
    }

    if (targetWp) {
      this.currentTargetWaypoint = targetWp;
      this.currentPath = this.computeWaypoints(this.x, this.z, targetWp.x, targetWp.z);
    }
  }

  private computeWaypoints(sx: number, sz: number, gx: number, gz: number): { x: number; z: number }[] {
    // Generate clean corridor waypoints connecting zones
    const waypoints: { x: number; z: number }[] = [{ x: sx, z: sz }];

    // If starting in dock / pharmacy zone (x < -10)
    if (sx < -10) {
      waypoints.push({ x: -8.0, z: sz > 0 ? 4.0 : -4.0 });
      waypoints.push({ x: -8.0, z: 0.0 });
    }

    // Corridor transit point
    if (gx > 0 && sx < 0) {
      // Check if demo obstacle is present at (-4.0, 0.0)
      const hasObstacle = this.obstacles.some(o => o.id === 'obs_demo_human_1' && o.is_active);
      if (hasObstacle) {
        // Detour through lobby hallway
        waypoints.push({ x: -4.0, z: 2.2 });
        waypoints.push({ x: 0.0, z: 2.2 });
      } else {
        waypoints.push({ x: -4.0, z: 0.0 });
      }
      waypoints.push({ x: 0.0, z: 0.0 });
    }

    if (gx > 8.0) {
      waypoints.push({ x: 8.0, z: 0.0 });
      waypoints.push({ x: 8.0, z: gz > 0 ? 4.0 : -4.0 });
    } else if (gx >= -2.0 && gx <= 4.0) {
      waypoints.push({ x: gx, z: 0.0 });
    }

    waypoints.push({ x: gx, z: gz });
    return waypoints;
  }

  private tick(dt: number) {
    this.seq++;
    const now = Date.now() / 1000;

    // 1. Evaluate obstacle proximity
    let speedFactor = 1.0;
    const demoObs = this.obstacles.find(o => o.is_active && o.id === 'obs_demo_human_1');

    if (demoObs && ['NAVIGATING_TO_DESTINATION', 'NAVIGATING_TO_PICKUP'].includes(this.phase)) {
      const dist = Math.hypot(demoObs.x - this.x, demoObs.z - this.z);
      if (dist < 1.3) {
        speedFactor = 0.0;
        this.timeStopped += dt;
        this.alertBanner = {
          type: 'danger',
          title: 'OBSTACLE DETECTED IN PATH',
          message: `Virtual LiDAR & Perception detected '${demoObs.name}' at ${dist.toFixed(2)}m. Holding safe stop.`
        };
        // Reroute around obstacle
        if (this.currentPath.length > 0 && Math.abs(this.currentPath[0].z) < 0.5) {
          this.currentPath = this.computeWaypoints(this.x, this.z, this.currentTargetWaypoint?.x || 1.0, this.currentTargetWaypoint?.z || -3.5);
          this.rerouteCount++;
          if (this.activeTask) this.activeTask.reroutes_count = this.rerouteCount;
        }
      } else if (dist < 2.5) {
        speedFactor = 0.35;
        this.alertBanner = {
          type: 'caution',
          title: 'PROXIMITY WARNING',
          message: `Approaching ${demoObs.name} (${dist.toFixed(2)}m). Decelerating for safety.`
        };
      } else {
        this.alertBanner = null;
      }
    } else if (this.phase !== 'EMERGENCY_STOPPED') {
      this.alertBanner = null;
    }

    // 2. Navigation Step
    if (['NAVIGATING_TO_PICKUP', 'NAVIGATING_TO_DESTINATION', 'RETURNING_TO_BASE'].includes(this.phase)) {
      this.isCharging = false;
      this.stepNavigation(dt, speedFactor);
    } else if (this.phase === 'LOADING_CARGO') {
      this.targetV = 0.0;
      this.targetOmega = 0.0;
      this.actionTimer += dt;
      if (this.actionTimer < 1.0) {
        this.lidOpenRatio = Math.min(1.0, this.lidOpenRatio + dt * 1.5);
      } else if (this.actionTimer < 2.0) {
        this.lidOpenRatio = 1.0;
      } else if (this.actionTimer < 3.0) {
        this.lidOpenRatio = Math.max(0.0, this.lidOpenRatio - dt * 1.5);
      } else {
        this.lidOpenRatio = 0.0;
        this.actionTimer = 0.0;
        this.phase = 'NAVIGATING_TO_DESTINATION';
        if (this.activeTask) this.activeTask.status = 'EN_ROUTE_DELIVERY';
        this.planForCurrentPhase();
      }
    } else if (this.phase === 'ARRIVED_DELIVERING') {
      this.targetV = 0.0;
      this.targetOmega = 0.0;
      this.actionTimer += dt;
      if (this.actionTimer < 1.0) {
        this.lidOpenRatio = Math.min(1.0, this.lidOpenRatio + dt * 1.5);
      } else if (this.actionTimer < 2.0) {
        this.lidOpenRatio = 1.0;
      } else if (this.actionTimer < 3.0) {
        this.lidOpenRatio = Math.max(0.0, this.lidOpenRatio - dt * 1.5);
      } else {
        this.lidOpenRatio = 0.0;
        this.actionTimer = 0.0;
        this.phase = 'COMPLETED';
        if (this.activeTask) this.activeTask.status = 'COMPLETED';
        // Auto return to base
        setTimeout(() => {
          this.phase = 'RETURNING_TO_BASE';
          this.planForCurrentPhase();
        }, 1200);
      }
    } else if (this.phase === 'DOCKED_CHARGING') {
      this.targetV = 0.0;
      this.targetOmega = 0.0;
      this.isCharging = true;
      this.batterySoc = Math.min(100.0, this.batterySoc + dt * 0.15);
    }

    // Kinematic Integration
    const dvLimit = 0.85 * dt;
    const diffV = this.targetV - this.v;
    this.v += Math.abs(diffV) <= dvLimit ? diffV : Math.sign(diffV) * dvLimit;

    const domegaLimit = 2.2 * dt;
    const diffOmega = this.targetOmega - this.omega;
    this.omega += Math.abs(diffOmega) <= domegaLimit ? diffOmega : Math.sign(diffOmega) * domegaLimit;

    const dx = this.v * Math.cos(this.theta) * dt;
    const dz = this.v * Math.sin(this.theta) * dt;
    this.x += dx;
    this.z += dz;
    this.theta = (this.theta + this.omega * dt + Math.PI) % (2 * Math.PI) - Math.PI;

    const stepDist = Math.hypot(dx, dz);
    this.totalDistance += stepDist;
    if (this.activeTask) {
      this.activeTask.distance_traveled_m += stepDist;
      this.activeTask.duration_seconds += dt;
    }

    // Spin wheels
    this.wheelLeftRad += (this.v / 0.1) * dt;
    this.wheelRightRad += (this.v / 0.1) * dt;

    if (!this.isCharging && Math.abs(this.v) > 0.01) {
      this.batterySoc = Math.max(5.0, this.batterySoc - dt * 0.02);
    }

    // Generate Virtual LiDAR scan
    const lidarScan = this.generateLidarScan();
    const detections = this.generateDetections();

    const pkt: TelemetryPacket = {
      timestamp: now,
      seq: this.seq,
      product_name: 'MediBot KP',
      company: 'RoboNex Innovations',
      disclaimer: 'MediBot KP is a virtual simulation prototype. Sensor readings, AI detections, navigation behavior, and performance metrics are simulated and do not represent physical-robot field testing.',
      robot: {
        pose: {
          x: Math.round(this.x * 1000) / 1000,
          y: 0.0,
          z: Math.round(this.z * 1000) / 1000,
          theta: Math.round(this.theta * 1000) / 1000,
          theta_deg: Math.round(((this.theta * 180) / Math.PI) * 10) / 10
        },
        velocity: {
          linear: Math.round(this.v * 100) / 100,
          angular: Math.round(this.omega * 100) / 100
        },
        wheels: {
          left_rad: Math.round(this.wheelLeftRad * 100) / 100,
          right_rad: Math.round(this.wheelRightRad * 100) / 100
        },
        battery: {
          percentage: Math.round(this.batterySoc * 10) / 10,
          voltage: Math.round((21.0 + (this.batterySoc / 100) * 8.2) * 100) / 100,
          current_draw_a: this.isCharging ? -18.5 : Math.round((this.v > 0.05 ? 4.6 : 0.8) * 100) / 100,
          is_charging: this.isCharging,
          wh_consumed: Math.round(this.totalDistance * 0.35 * 10) / 10
        },
        indicators: {
          lidar_active: true,
          camera_active: true,
          headlights_on: true,
          status_light: this.alertBanner ? 'amber' : this.isCharging ? 'purple' : this.phase === 'COMPLETED' ? 'green' : 'blue',
          safety_level: this.alertBanner ? 'CAUTION' : 'NORMAL',
          emergency_stop_triggered: this.phase === 'EMERGENCY_STOPPED'
        },
        cargo: {
          lid_open_ratio: Math.round(this.lidOpenRatio * 100) / 100,
          has_package: ['NAVIGATING_TO_DESTINATION', 'ARRIVED_DELIVERING'].includes(this.phase),
          package_type: this.activeTask?.package_type || null
        }
      },
      mission: {
        phase: this.phase,
        active_task: this.activeTask,
        target_name: this.currentTargetName,
        distance_to_goal_m: this.currentPath.length > 0
          ? Math.round(Math.hypot(this.currentPath[this.currentPath.length - 1].x - this.x, this.currentPath[this.currentPath.length - 1].z - this.z) * 10) / 10
          : 0.0,
        estimated_eta_seconds: 12.0
      },
      lidar: lidarScan,
      perception: detections,
      obstacles: this.obstacles,
      planned_path: this.currentPath,
      metrics: {
        total_distance_traveled_m: Math.round(this.totalDistance * 10) / 10,
        total_reroutes: this.rerouteCount,
        time_stopped_for_obstacles_s: Math.round(this.timeStopped * 10) / 10,
        obstacles_avoided: this.activeTask?.obstacles_encountered || (demoObs ? 1 : 0)
      },
      alert_banner: this.alertBanner
    };

    if (this.onTelemetryCallback) {
      this.onTelemetryCallback(pkt);
    }
  }

  private stepNavigation(dt: number, speedFactor: number) {
    if (this.currentPath.length === 0) {
      this.handleArrival();
      return;
    }

    // Prune reached waypoints
    while (this.currentPath.length > 1) {
      const d = Math.hypot(this.currentPath[0].x - this.x, this.currentPath[0].z - this.z);
      if (d < 0.6) {
        this.currentPath.shift();
      } else {
        break;
      }
    }

    const targetPt = this.currentPath[0];
    const dx = targetPt.x - this.x;
    const dz = targetPt.z - this.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.35 && this.currentPath.length === 1) {
      this.handleArrival();
      return;
    }

    const targetAngle = Math.atan2(dz, dx);
    const angleErr = (targetAngle - this.theta + Math.PI) % (2 * Math.PI) - Math.PI;

    if (Math.abs(angleErr) > 0.8) {
      this.targetV = 0.08 * speedFactor;
      this.targetOmega = Math.max(-1.4, Math.min(1.4, 2.2 * angleErr));
    } else {
      this.targetV = 0.85 * speedFactor;
      this.targetOmega = Math.max(-1.4, Math.min(1.4, 2.0 * angleErr));
    }
  }

  private handleArrival() {
    this.targetV = 0.0;
    this.targetOmega = 0.0;
    this.v = 0.0;
    this.currentPath = [];

    if (this.phase === 'NAVIGATING_TO_PICKUP') {
      this.phase = 'LOADING_CARGO';
    } else if (this.phase === 'NAVIGATING_TO_DESTINATION') {
      this.phase = 'ARRIVED_DELIVERING';
    } else if (this.phase === 'RETURNING_TO_BASE') {
      this.phase = 'DOCKED_CHARGING';
    }
  }

  private generateLidarScan(): any {
    const numRays = 180;
    const hitPoints: any[] = [];
    const ranges: number[] = [];
    let closestDist = 8.0;
    let closestAngle = 0.0;

    for (let i = 0; i < numRays; i += 2) {
      const rayAngleOffset = -Math.PI + (i * (2 * Math.PI)) / numRays;
      const angle = this.theta + rayAngleOffset;
      const rdx = Math.cos(angle);
      const rdz = Math.sin(angle);

      let minT = 8.0;

      // Check walls
      for (const w of this.walls) {
        const t = this.raySegmentIntersect(this.x, this.z, rdx, rdz, w.x1, w.z1, w.x2, w.z2);
        if (t !== null && t < minT) minT = t;
      }

      // Check obstacles
      for (const obs of this.obstacles) {
        if (!obs.is_active) continue;
        const to = this.rayCircleIntersect(this.x, this.z, rdx, rdz, obs.x, obs.z, obs.radius);
        if (to !== null && to < minT) minT = to;
      }

      ranges.push(minT);
      if (minT < 7.9) {
        const hx = this.x + rdx * minT;
        const hz = this.z + rdz * minT;
        hitPoints.push({ x: hx, z: hz, range: minT });

        if (minT < closestDist) {
          closestDist = minT;
          closestAngle = (rayAngleOffset * 180) / Math.PI;
        }
      }
    }

    return {
      timestamp: Date.now() / 1000,
      is_virtual: true,
      disclaimer: 'Virtual LiDAR - Raycast Simulation, Not Physical Sensor',
      num_rays: numRays,
      max_range: 8.0,
      min_range: 0.1,
      ranges: ranges,
      angles_rad: [],
      hit_points: hitPoints,
      closest_distance_m: Math.round(closestDist * 100) / 100,
      closest_angle_deg: Math.round(closestAngle * 10) / 10,
      alert_level: closestDist < 1.2 ? 'CRITICAL_STOP' : closestDist < 2.5 ? 'CAUTION' : 'NORMAL',
      detected_dynamic_count: this.obstacles.length
    };
  }

  private generateDetections(): any[] {
    const results: any[] = [];
    for (const obs of this.obstacles) {
      if (!obs.is_active) continue;
      const dist = Math.hypot(obs.x - this.x, obs.z - this.z);
      if (dist < 7.0) {
        results.push({
          detection_id: `SIM-DET-${obs.id}`,
          label: obs.classification_label,
          category: obs.type === 'VIRTUAL_PERSONNEL' ? 'human' : 'equipment',
          confidence: obs.confidence,
          distance_m: Math.round(dist * 100) / 100,
          bearing_deg: Math.round(((Math.atan2(obs.z - this.z, obs.x - this.x) - this.theta) * 180) / Math.PI),
          world_x: obs.x,
          world_z: obs.z,
          is_simulated: true,
          disclaimer: 'Simulated Detection - Synthetic Perception Model, Not Physical Camera',
          timestamp: Date.now() / 1000
        });
      }
    }
    return results;
  }

  private raySegmentIntersect(ox: number, oz: number, rdx: number, rdz: number, x1: number, z1: number, x2: number, z2: number): number | null {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const det = rdx * dz - rdz * dx;
    if (Math.abs(det) < 1e-5) return null;
    const u = ((ox - x1) * rdz - (oz - z1) * rdx) / det;
    const t = ((ox - x1) * dz - (oz - z1) * dx) / det;
    if (t > 0.05 && t <= 8.0 && u >= 0.0 && u <= 1.0) return t;
    return null;
  }

  private rayCircleIntersect(ox: number, oz: number, rdx: number, rdz: number, cx: number, cz: number, r: number): number | null {
    const vx = ox - cx;
    const vz = oz - cz;
    const b = rdx * vx + rdz * vz;
    const c = vx * vx + vz * vz - r * r;
    const disc = b * b - c;
    if (disc < 0) return null;
    const t = -b - Math.sqrt(disc);
    if (t > 0.05 && t <= 8.0) return t;
    return null;
  }
}
