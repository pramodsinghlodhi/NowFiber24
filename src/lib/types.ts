

export type Project = {
  projectId: string;
  projectName: string;
  location: string;
  assignedTeam: string[];
  startDate: string;
  planExpiry: string;
  status: 'active' | 'completed' | 'on-hold';
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Infrastructure = {
  id: string;
  projectId: string;
  type: 'fiber' | 'core' | 'cable' | 'tube' | 'power' | 'splitter' | 'joint_box' | 'switch' | 'router' | 'ONT' | 'OLT' | 'Pole' | 'Splice Box' | 'Datacenter' | 'Core Switch' | 'ONU' | 'Customer Premise' | 'hub';
  name: string;
  lat: number;
  lng: number;
  ip?: string;
  status: 'online' | 'offline' | 'maintenance' | 'planned' | 'installed';
  quantity?: number | null; // e.g., meters for fiber
  connectedTo?: string;
  connectedBy?: string;
  connectionDate?: string;
  remarks?: string;
  attributes?: {
    assetLabel?: string; 
    fiberCapacity?: '2F' | '4F' | '8F' | '12F' | '24F' | '48F' | '96F';
    tubeColor?: string;
    fiberColor?: string;
    couplerRatio?: '1:2' | '1:4' | '1:8' | '1:16' | '1:32' | '1:64';
    powerLevel?: string;
    port?: number;
    openPorts?: number;
  }
};

export type Connection = {
  id: string;
  projectId: string;
  from: string; // ID of an infrastructure item
  to: string; // ID of an infrastructure item
  status: 'active' | 'inactive';
  remarks?: string;
};

export type Plan = {
  id: string;
  projectId: string;
  customerId: string;
  planName: string;
  activationDate: string;
  expiryDate: string;
  status: 'active' | 'inactive' | 'suspended';
  assignedONT: string;
};

export type User = {
    uid: string; // Firebase Auth UID
    id: string; // Custom login ID (e.g., 'admin', 'tech-001')
    name: string;
    role: 'Admin' | 'Technician';
    isBlocked: boolean;
    avatarUrl?: string;
};

export type Technician = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  role: 'Field Engineer' | 'Splicing Technician';
  contact: string;
  isActive: boolean; // Represents on-duty or off-duty
  status: 'available' | 'on-break' | 'on-task'; // Represents current activity
  tasksAssigned?: string[]; // Array of infrastructure IDs
  path?: [number, number][];
  avatarUrl?: string;
  uid?: string;
};

export type Task = {
  id: string;
  tech_id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  lat: number;
  lng: number;
  completionTimestamp?: any;
  device_id?: string;
};

export type Alert = {
  id: string;
  device_id: string;
  issue: string;
  lat: number;
  lng: number;
  timestamp: any;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
};

export type Referral = {
    id: string;
    tech_id: string;
    customer_name: string;
    phone: string;
    address: string;
    notes: string;
    status: 'Pending' | 'Contacted' | 'Closed';
    timestamp: any;
}

export type Stats = {
  onlineDevices: number;
  activeAlerts: number;
  techniciansOnDuty: number;
  tasksCompletedToday: number;
  myOpenTasks?: number;
}

export type Material = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    quantityInStock: number;
}

export type MaterialAssignment = {
    id: string;
    materialId: string;
    technicianId: string;
    quantityAssigned: number;
    status: 'Requested' | 'Pending' | 'Issued' | 'Returned' | 'Rejected';
    timestamp: any;
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
