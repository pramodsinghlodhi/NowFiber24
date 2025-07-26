

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
  isActive: boolean;
  status: 'available' | 'on-break' | 'on-task';
  path?: [number, number][];
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

export type Material = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    quantityInStock: number;
}

export type MaterialAssignment = {
    id: number;
    materialId: string;
    technicianId: string;
    quantityAssigned: number;
    status: 'Requested' | 'Pending' | 'Issued' | 'Returned' | 'Rejected';
    timestamp: string;
}

export type TechnicianPerformance = {
    techId: string;
    name: string;
    assignedTasks: number;
    completedTasks: number;
    completionRate: number;
}

export type AlertsBySeverity = {
    severity: string;
    count: number;
}

export type AlertsByType = {
    type: string;
    count: number;
}

export type TaskStatusDistribution = {
    status: string;
    count: number;
    fill: string;
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
  { id: 'tech-001', name: 'John Doe', lat: 34.062, lng: -118.248, isActive: true, status: 'on-task', path: [[34.062, -118.248]] },
  { id: 'tech-002', name: 'Jane Smith', lat: 34.045, lng: -118.24, isActive: true, status: 'available', path: [[34.045, -118.24]] },
  { id: 'tech-003', name: 'Mike Ross', lat: 34.055, lng: -118.258, isActive: true, status: 'on-break', path: [[34.055, -118.258]] },
  { id: 'tech-004', name: 'Emily White', lat: 34.055, lng: -118.258, isActive: false, status: 'available' },
];

export const mockTasks: Task[] = [
  { id: 1, tech_id: 'tech-001', title: 'Fix ONU-102 Connectivity', description: 'Customer reported no internet. Check fiber link and ONU status.', status: 'In Progress', lat: 34.058, lng: -118.245 },
  { id: 2, tech_id: 'tech-002', title: 'New Installation at 123 Maple St', description: 'Install new ONU and configure services for a new client.', status: 'Pending', lat: 34.05, lng: -118.235 },
  { id: 3, tech_id: 'tech-001', title: 'Routine Maintenance on SW-01', description: 'Perform software update and check logs.', status: 'Pending', lat: 34.05, lng: -118.24 },
  { id: 4, tech_id: 'tech-003', title: 'Resolve Alert for ONU-104', description: 'Device is offline. Investigate the cause.', status: 'In Progress', lat: 34.048, lng: -118.238 },
  { id: 5, tech_id: 'tech-001', title: 'Completed: Fix Low Signal', description: 'Replaced faulty connector.', status: 'Completed', lat: 34.055, lng: -118.25 },
  { id: 6, tech_id: 'tech-002', title: 'Completed: Customer Upgrade', description: 'Upgraded customer to 1 Gig plan.', status: 'Completed', lat: 34.051, lng: -118.239 },
];

export const mockAlerts: Alert[] = [
  { id: 1, device_id: 'ONU-102', issue: 'Device Offline', lat: 34.058, lng: -118.245, timestamp: '2024-05-23T10:30:00Z', severity: 'Critical' },
  { id: 2, device_id: 'ONU-104', issue: 'Device Offline', lat: 34.048, lng: -118.238, timestamp: '2024-05-23T10:32:00Z', severity: 'Critical' },
  { id: 3, device_id: 'ONU-105', issue: 'Device Offline', lat: 34.0515, lng: -118.257, timestamp: '2024-05-23T10:35:00Z', severity: 'Critical' },
  { id: 4, device_id: 'SW-01', issue: 'High Temperature', lat: 34.05, lng: -118.24, timestamp: '2024-05-23T11:00:00Z', severity: 'High' },
  { id: 5, device_id: 'ONU-101', issue: 'Low Signal Strength', lat: 34.055, lng: -118.25, timestamp: '2024-05-23T11:05:00Z', severity: 'Medium' },
];

export let mockReferrals: Referral[] = [
    {id: 1, tech_id: 'tech-001', customer_name: 'Stark Industries', phone: '555-123-4567', address: '10880 Malibu Point', notes: 'Interested in gigabit enterprise plan.', status: 'Contacted', timestamp: '2024-05-22T14:00:00Z'},
    {id: 2, tech_id: 'tech-002', customer_name: 'Wayne Enterprises', phone: '555-987-6543', address: '1007 Mountain Drive', notes: 'Requires high-security connection for a new R&D facility.', status: 'Pending', timestamp: '2024-05-21T09:30:00Z'},
];

export const mockMaterials: Material[] = [
    { id: 'fiber-24', name: '24-count Fiber Optic Cable', description: 'Per meter', imageUrl: 'https://placehold.co/100x100.png', quantityInStock: 500 },
    { id: 'conn-sc-apc', name: 'SC/APC Connector', description: 'Single unit', imageUrl: 'https://placehold.co/100x100.png', quantityInStock: 250 },
    { id: 'splice-sleeve', name: 'Splicing Sleeve', description: 'Pack of 12', imageUrl: 'https://placehold.co/100x100.png', quantityInStock: 100 },
    { id: 'splicer-fujikura', name: 'Fujikura 90S+ Splicer', description: 'Field fusion splicer kit', imageUrl: 'https://placehold.co/100x100.png', quantityInStock: 5 },
];

export let mockAssignments: MaterialAssignment[] = [
    { id: 1, materialId: 'splicer-fujikura', technicianId: 'tech-001', quantityAssigned: 1, status: 'Issued', timestamp: '2024-05-23T08:00:00Z'},
    { id: 2, materialId: 'conn-sc-apc', technicianId: 'tech-001', quantityAssigned: 10, status: 'Issued', timestamp: '2024-05-23T08:00:00Z'},
    { id: 3, materialId: 'fiber-24', technicianId: 'tech-002', quantityAssigned: 50, status: 'Pending', timestamp: '2024-05-24T09:00:00Z'},
];

// MOCK REPORTING DATA
export const mockTechnicianPerformance: TechnicianPerformance[] = mockTechnicians.map(tech => {
    const assignedTasks = mockTasks.filter(t => t.tech_id === tech.id);
    const completedTasks = assignedTasks.filter(t => t.status === 'Completed');
    const completionRate = assignedTasks.length > 0 ? (completedTasks.length / completedTasks.length) * 100 : 0;
    return {
        techId: tech.id,
        name: tech.name,
        assignedTasks: assignedTasks.length,
        completedTasks: completedTasks.length,
        completionRate: Math.round(completionRate)
    };
});

export const mockAlertsBySeverity: AlertsBySeverity[] = [
    { severity: 'Critical', count: mockAlerts.filter(a => a.severity === 'Critical').length },
    { severity: 'High', count: mockAlerts.filter(a => a.severity === 'High').length },
    { severity: 'Medium', count: mockAlerts.filter(a => a.severity === 'Medium').length },
    { severity: 'Low', count: mockAlerts.filter(a => a.severity === 'Low').length },
];

export const mockAlertsByType: AlertsByType[] = mockAlerts.reduce((acc, alert) => {
    const existingType = acc.find(item => item.type === alert.issue);
    if (existingType) {
        existingType.count++;
    } else {
        acc.push({ type: alert.issue, count: 1 });
    }
    return acc;
}, [] as AlertsByType[]);


export const mockTaskStatusDistribution: TaskStatusDistribution[] = [
    { status: 'Completed', count: mockTasks.filter(t => t.status === 'Completed').length, fill: 'var(--color-completed)' },
    { status: 'In Progress', count: mockTasks.filter(t => t.status === 'In Progress').length, fill: 'var(--color-in-progress)' },
    { status: 'Pending', count: mockTasks.filter(t => t.status === 'Pending').length, fill: 'var(--color-pending)' },
];
