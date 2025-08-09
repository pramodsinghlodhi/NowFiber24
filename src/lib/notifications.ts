

import { Notification as NotificationType } from '@/lib/types';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { User } from './types';

// This file is now primarily for utility functions related to notifications.
// The mock data is no longer the primary source.

export const createNotification = async (notification: Omit<NotificationType, 'id'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, `users/${notification.userId}/notifications`), {
            ...notification,
            read: false,
            timestamp: new Date(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating notification: ", error);
        throw new Error("Could not create notification.");
    }
}

export const createBroadcast = async (notification: Omit<NotificationType, 'id' | 'userId'>) => {
    try {
        // Fetch all users to send them a notification
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userDocs = usersSnapshot.docs;

        const promises = userDocs.map(userDoc => {
            const userId = userDoc.id; // UID
            return addDoc(collection(db, `users/${userId}/notifications`), {
                ...notification,
                read: false,
                timestamp: new Date(),
            });
        });

        await Promise.all(promises);
        console.log(`Broadcast sent to ${userDocs.length} users.`);

    } catch (error) {
        console.error("Error creating broadcast: ", error);
        throw new Error("Could not create broadcast.");
    }
}


export const getTechnicianUserByTechId = async (techId: string): Promise<User | null> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("id", "==", techId), where("role", "==", "Technician"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log(`No technician user found for techId: ${techId}`);
        return null;
    }
    
    // There should only be one
    const userDoc = querySnapshot.docs[0];
    return { uid: userDoc.id, ...userDoc.data(), email: userDoc.data().email } as User;
}

// Mock data can be kept for testing or as a fallback, but is no longer used by the header.
export const mockNotifications: NotificationType[] = [
    {
        id: '1',
        userId: 'mock-user',
        type: 'New Alert',
        title: 'Critical Alert',
        message: 'Critical alert: ONU-102 is offline.',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        href: '/alerts'
    },
];
