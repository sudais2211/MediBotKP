export interface RobotPose {
  x: number;
  y: number;
  z: number;
  theta: number;
  theta_deg: number;
}

export interface RobotVelocity {
  linear: number;
  angular: number;
}

export interface WheelState {
  left_rad: number;
  right_rad: number;
}

export interface BatteryState {
  percentage: number;
  voltage: number;
  current_draw_a: number;
  is_charging: boolean;
  wh_consumed: number;
  estimated_runtime_min?: number;
}

export interface IndicatorsState {
  lidar_active: boolean;
  camera_active: boolean;
  headlights_on: boolean;
  status_light: 'green' | 'amber' | 'red' | 'blue' | 'purple' | string;
  safety_level: 'NORMAL' | 'CAUTION' | 'CRITICAL_STOP' | 'EMERGENCY_STOP' | string;
  emergency_stop_triggered: boolean;
}

export interface CargoState {
  lid_open_ratio: number;
  has_package: boolean;
  package_type: string | null;
}

export interface RobotState {
  pose: RobotPose;
  velocity: RobotVelocity;
  wheels: WheelState;
  battery: BatteryState;
  indicators: IndicatorsState;
  cargo: CargoState;
}

export interface DeliveryTask {
  id: string;
  title: string;
  pickup_dept_id: string;
  delivery_dept_id: string;
  package_type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'STAT_CRITICAL';
  status: string;
  notes?: string;
  distance_traveled_m: number;
  duration_seconds: number;
  reroutes_count: number;
  obstacles_encountered: number;
}

export interface MissionState {
  phase: string;
  active_task: DeliveryTask | null;
  target_name: string;
  distance_to_goal_m: number;
  estimated_eta_seconds: number;
}

export interface LidarPoint {
  x: number;
  z: number;
  range: number;
}

export interface LidarScan {
  timestamp: number;
  is_virtual: boolean;
  disclaimer: string;
  num_rays: number;
  max_range: number;
  min_range: number;
  ranges: number[];
  angles_rad: number[];
  hit_points: LidarPoint[];
  closest_distance_m: number;
  closest_angle_deg: number;
  closest_point: { x: number; z: number } | null;
  alert_level: 'NORMAL' | 'CAUTION' | 'CRITICAL_STOP';
  detected_dynamic_count: number;
}

export interface PerceptionDetection {
  detection_id: string;
  label: string;
  category: 'human' | 'equipment' | 'hazard' | 'obstacle';
  confidence: number;
  distance_m: number;
  bearing_deg: number;
  world_x: number;
  world_z: number;
  bbox_2d?: [number, number, number, number];
  is_simulated: boolean;
  disclaimer: string;
  timestamp: number;
}

export interface SimulatedObstacle {
  id: string;
  type: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  is_dynamic: boolean;
  confidence: number;
  classification_label: string;
  is_active: boolean;
}

export interface Waypoint {
  x: number;
  z: number;
}

export interface SimulationMetrics {
  total_distance_traveled_m: number;
  total_reroutes: number;
  time_stopped_for_obstacles_s: number;
  obstacles_avoided: number;
}

export interface AlertBanner {
  type: 'info' | 'warning' | 'caution' | 'danger';
  title: string;
  message: string;
}

export interface TelemetryPacket {
  timestamp: number;
  seq: number;
  product_name: string;
  company: string;
  disclaimer: string;
  robot: RobotState;
  mission: MissionState;
  lidar: LidarScan;
  perception: PerceptionDetection[];
  obstacles: SimulatedObstacle[];
  planned_path: Waypoint[];
  metrics: SimulationMetrics;
  alert_banner?: AlertBanner | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  category: string;
  coordinates: { x: number; y: number; z: number };
  waypoint: { x: number; z: number; theta: number };
  description: string;
  color: string;
}
