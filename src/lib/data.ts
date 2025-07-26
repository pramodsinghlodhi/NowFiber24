

export type Device = {
  id: string;
  type: 'Datacenter' | 'Core Switch' | 'OLT' | 'ONU' | 'Switch' | 'Pole' | 'Splice Box' | 'Customer Premise';
  lat: number;
  lng: number;
  ip?: string;
  status: 'online' | 'offline' | 'maintenance' | 'planned';
  attributes?: {
    assetLabel?: string; // Company label for the asset
    fiberCapacity?: '2F' | '4F' | '8F' | '12F' | '24F' | '48F' | '96F';
    tubeColor?: string;
    fiberColor?: string;
    couplerRatio?: '1:2' | '1:4' | '1:8' | '1:16' | '1:32' | '1:64';
    powerLevel?: string; // e.g., "-25 dBm"
  }
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

export type Referral = {
    id: number;
    tech_id: string;
    customer_name: string;
    phone: string;
    address: string;
    notes: string;
    status: 'Pending' | 'Contacted' | 'Closed';
    timestamp: string;
}

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
  { id: 'DC-LA1', type: 'Datacenter', lat: 34.0522, lng: -118.2437, ip: '192.168.1.1', status: 'online', attributes: { assetLabel: 'LA1-DC-01' } },
  { id: 'CSW-LA1-01', type: 'Core Switch', lat: 34.0525, lng: -118.2440, ip: '192.168.1.2', status: 'online', attributes: { assetLabel: 'LA1-CSW-01' } },
  { id: 'OLT-01', type: 'OLT', lat: 34.0530, lng: -118.2450, ip: '192.168.2.1', status: 'online', attributes: { assetLabel: 'LA1-OLT-01', powerLevel: '-10 dBm' } },
  { id: 'SPL-01', type: 'Splice Box', lat: 34.0555, lng: -118.2480, status: 'online', attributes: { assetLabel: 'SB-J-101', couplerRatio: '1:8' } },
  { id: 'ONU-101', type: 'ONU', lat: 34.055, lng: -118.25, ip: '10.0.1.101', status: 'online', attributes: { assetLabel: 'CID-23884', powerLevel: '-22 dBm' } },
  { id: 'ONU-102', type: 'ONU', lat: 34.058, lng: -118.245, ip: '10.0.1.102', status: 'offline', attributes: { assetLabel: 'CID-24109', powerLevel: '-inf' } },
  { id: 'SW-01', type: 'Switch', lat: 34.05, lng: -118.24, ip: '192.168.1.10', status: 'online', attributes: { assetLabel: 'LA1-SW-55' } },
  { id: 'ONU-103', type: 'ONU', lat: 34.06, lng: -118.255, ip: '10.0.1.103', status: 'maintenance', attributes: { assetLabel: 'CID-25001' } },
  { id: 'ONU-104', type: 'ONU', lat: 34.048, lng: -118.238, ip: '10.0.1.104', status: 'offline', attributes: { assetLabel: 'CID-25134' } },
  { id: 'Pole-23', type: 'Pole', lat: 34.053, lng: -118.248, status: 'online', attributes: { assetLabel: 'P-5829A' } },
  { id: 'Pole-24', type: 'Pole', lat: 34.059, lng: -118.252, status: 'online', attributes: { assetLabel: 'P-5830B' } },
  { id: 'ONU-105', type: 'ONU', lat: 34.0515, lng: -118.257, ip: '10.0.1.105', status: 'offline', attributes: { assetLabel: 'CID-25210' } },
];

export let mockTechnicians: Technician[] = [
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

export let mockReferrals: Referral[] = [
    {id: 1, tech_id: 'tech-001', customer_name: 'Stark Industries', phone: '555-123-4567', address: '10880 Malibu Point', notes: 'Interested in gigabit enterprise plan.', status: 'Contacted', timestamp: '2024-05-22T14:00:00Z'},
    {id: 2, tech_id: 'tech-002', customer_name: 'Wayne Enterprises', phone: '555-987-6543', address: '1007 Mountain Drive', notes: 'Requires high-security connection for a new R&D facility.', status: 'Pending', timestamp: '2024-05-21T09:30:00Z'},
];
