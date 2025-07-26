

export type Notification = {
    id: number;
    type: 'New Alert' | 'Task Assigned' | 'Material Approved' | 'System';
    message: string;
    read: boolean;
    timestamp: string;
    href?: string;
}

export const mockNotifications: Notification[] = [
    {
        id: 1,
        type: 'New Alert',
        message: 'Critical alert: ONU-102 is offline.',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        href: '/alerts'
    },
    {
        id: 2,
        type: 'Task Assigned',
        message: 'You have been assigned a new task: Fix ONU-102 Connectivity.',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
        href: '/tasks'
    },
    {
        id: 3,
        type: 'Material Approved',
        message: 'Your request for 10x SC/APC Connectors has been approved.',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        href: '/materials'
    },
    {
        id: 4,
        type: 'System',
        message: 'System maintenance is scheduled for Sunday at 2 AM.',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        href: '/settings'
    }
]
