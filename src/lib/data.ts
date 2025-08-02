
// This file is deprecated. All data is now fetched from Firebase.
// It is kept for reference during the transition period.

import { User } from './types';

// This data is no longer used by the application but is kept as a reference
// for the required data structure when populating your Firestore database.
export const referenceUsers: User[] = [
    { id: 'admin', name: 'Admin User', role: 'Admin', password: 'admin', isBlocked: false, avatarUrl: `https://i.pravatar.cc/150?u=admin` },
    { id: 'tech-001', name: 'John Doe', role: 'Technician', password: 'password', isBlocked: false, contact: '+919876543210', avatarUrl: `https://i.pravatar.cc/150?u=tech-001` },
    { id: 'tech-002', name: 'Jane Smith', role: 'Technician', password: 'password', isBlocked: false, contact: '+919876543211', avatarUrl: `https://i.pravatar.cc/150?u=tech-002` },
    { id: 'tech-003', name: 'Mike Ross', role: 'Technician', password: 'password', isBlocked: true, contact: '+919876543212', avatarUrl: `https://i.pravatar.cc/150?u=tech-003` },
];
