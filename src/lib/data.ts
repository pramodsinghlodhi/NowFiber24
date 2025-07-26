export type Device = {
  id: string;
  type: 'OLT' | 'ONU' | 'Switch' | 'Pole';
  lat: number;
  lng: number;
  ip: string;
  status: 'online' | 'offline' | 'maintenance';
};

export type User = {
    id: string;
    name: string;
    role: 'Admin' | 'Technician';
    password?: string;
};

export type Technician = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  onDuty: boolean;
  status: 'available' | 'on-break' | 'on-task';
};

export type Task = {
  id: number;
  tech_id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  lat: number;
  lng: number;
};

export type Alert = {
  id: number;
  device_id: string;
  issue: string;
  lat: number;
  lng: number;
  timestamp: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
};

export type Stats = {
  onlineDevices: number;
  activeAlerts: number;
  techniciansOnDuty: number;
  tasksCompletedToday: number;
}

export const mockUsers: User[] = [
    { id: 'admin', name: 'Admin User', role: 'Admin', password: 'admin' },
    { id: 'tech-001', name: 'John Doe', role: 'Technician', password: 'password' },
    { id: 'tech-002', name: 'Jane Smith', role: 'Technician', password: 'password' },
    { id: 'tech-003', name: 'Mike Ross', role: 'Technician', password: 'password' },
];

export const mockStats: Stats = {
  onlineDevices: 487,
  activeAlerts: 3,
  techniciansOnDuty: 8,
  tasksCompletedToday: 12,
};

export const mockDevices: Device[] = [
  { id: 'OLT-01', type: 'OLT', lat: 34.0522, lng: -118.2437, ip: '192.168.1.1', status: 'online' },
  { id: 'ONU-101', type: 'ONU', lat: 34.055, lng: -118.25, ip: '10.0.1.101', status: 'online' },
  { id: 'ONU-102', type: 'ONU', lat: 34.058, lng: -118.245, ip: '10.0.1.102', status: 'offline' },
  { id: 'SW-01', type: 'Switch', lat: 34.05, lng: -118.24, ip: '192.168.1.10', status: 'online' },
  { id: 'ONU-103', type: 'ONU', lat: 34.06, lng: -118.255, ip: '10.0.1.103', status: 'maintenance' },
  { id: 'ONU-104', type: 'ONU', lat: 34.048, lng: -118.238, ip: '10.0.1.104', status: 'offline' },
  { id: 'Pole-23', type: 'Pole', lat: 34.053, lng: -118.248, ip: '', status: 'online'},
  { id: 'Pole-24', type: 'Pole', lat: 34.059, lng: -118.252, ip: '', status: 'online'},
  { id: 'ONU-105', type: 'ONU', lat: 34.0515, lng: -118.257, ip: '10.0.1.105', status: 'offline' },
];

export const mockTechnicians: Technician[] = [
  { id: 'tech-001', name: 'John Doe', lat: 34.062, lng: -118.248, onDuty: true, status: 'on-task' },
  { id: 'tech-002', name: 'Jane Smith', lat: 34.045, lng: -118.24, onDuty: true, status: 'available' },
  { id: 'tech-003', name: 'Mike Ross', lat: 34.055, lng: -118.258, onDuty: true, status: 'on-break' },
  { id: 'tech-004', name: 'Emily White', lat: 34.055, lng: -118.258, onDuty: false, status: 'available' },
];

export const mockTasks: Task[] = [
  { id: 1, tech_id: 'tech-001', title: 'Fix ONU-102 Connectivity', description: 'Customer reported no internet. Check fiber link and ONU status.', status: 'In Progress', lat: 34.058, lng: -118.245 },
  { id: 2, tech_id: 'tech-002', title: 'New Installation at 123 Maple St', description: 'Install new ONU and configure services for a new client.', status: 'Pending', lat: 34.05, lng: -118.235 },
  { id: 3, tech_id: 'tech-001', title: 'Routine Maintenance on SW-01', description: 'Perform software update and check logs.', status: 'Pending', lat: 34.05, lng: -118.24 },
  { id: 4, tech_id: 'tech-003', title: 'Resolve Alert for ONU-104', description: 'Device is offline. Investigate the cause.', status: 'In Progress', lat: 34.048, lng: -118.238 },
];

export const mockAlerts: Alert[] = [
  { id: 1, device_id: 'ONU-102', issue: 'Device Offline', lat: 34.058, lng: -118.245, timestamp: '2024-05-23T10:30:00Z', severity: 'Critical' },
  { id: 2, device_id: 'ONU-104', issue: 'High Latency', lat: 34.048, lng: -118.238, timestamp: '2024-05-23T10:32:00Z', severity: 'High' },
  { id: 3, device_id: 'ONU-105', issue: 'Device Offline', lat: 34.0515, lng: -118.257, timestamp: '2024-05-23T10:35:00Z', severity: 'Critical' },
];
