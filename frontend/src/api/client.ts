import { TelemetryPacket, Department } from '../types/telemetry';

const API_BASE = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws/telemetry';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchHospitalMap() {
  const res = await fetch(`${API_BASE}/map`);
  return res.json();
}

export async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch(`${API_BASE}/departments`);
  return res.json();
}

export async function fetchMissions() {
  const res = await fetch(`${API_BASE}/missions`);
  return res.json();
}

export async function createMission(pickup: string, destination: string, packageType: string, priority: string = 'HIGH') {
  const res = await fetch(`${API_BASE}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup_dept_id: pickup,
      delivery_dept_id: destination,
      package_type: packageType,
      priority: priority
    })
  });
  return res.json();
}

export async function pauseMission(id: string = 'active') {
  const res = await fetch(`${API_BASE}/missions/${id}/pause`, { method: 'POST' });
  return res.json();
}

export async function resumeMission(id: string = 'active') {
  const res = await fetch(`${API_BASE}/missions/${id}/resume`, { method: 'POST' });
  return res.json();
}

export async function cancelMission(id: string = 'active') {
  const res = await fetch(`${API_BASE}/missions/${id}/cancel`, { method: 'POST' });
  return res.json();
}

export async function triggerEmergencyStop() {
  const res = await fetch(`${API_BASE}/robot/emergency-stop`, { method: 'POST' });
  return res.json();
}

export async function releaseEmergencyStop() {
  const res = await fetch(`${API_BASE}/robot/release-emergency-stop`, { method: 'POST' });
  return res.json();
}

export async function returnToBase() {
  const res = await fetch(`${API_BASE}/robot/return-to-base`, { method: 'POST' });
  return res.json();
}

export async function triggerDemoObstacle() {
  const res = await fetch(`${API_BASE}/simulation/trigger-obstacle`, { method: 'POST' });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  return res.json();
}

export class TelemetryWebSocket {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: TelemetryPacket) => void) | null = null;
  private onStatusChangeCallback: ((connected: boolean) => void) | null = null;
  private reconnectTimer: any = null;
  private isDestroyed = false;

  constructor(
    onMessage: (data: TelemetryPacket) => void,
    onStatusChange: (connected: boolean) => void
  ) {
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;
    this.connect();
  }

  private connect() {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const packet: TelemetryPacket = JSON.parse(event.data);
          if (this.onMessageCallback) this.onMessageCallback(packet);
        } catch (e) {
          console.error("Failed to parse telemetry packet:", e);
        }
      };

      this.ws.onclose = () => {
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  public send(msg: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    }
  }
}
