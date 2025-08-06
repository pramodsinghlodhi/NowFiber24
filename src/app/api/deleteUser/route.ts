

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
    initializeApp({
        credential: credential.applicationDefault(),
    });
}

const auth = getAuth();
const db = getFirestore();

export async function POST(request: NextRequest) {
    try {
        // TODO: Verify if the request comes from an authenticated admin user
        const { techId } = await request.json();

        if (!techId) {
            return NextResponse.json({ success: false, message: 'Technician ID is required.' }, { status: 400 });
        }

        // 1. Find user by custom ID field in Firestore to get the UID
        const usersRef = db.collection('users');
        const userQuery = await usersRef.where('id', '==', techId).limit(1).get();

        if (userQuery.empty) {
            // If no user profile, still try to clean up the technician doc as a fallback.
            console.log(`No user document found for techId ${techId}. Cleaning up technician document.`);
            const techDocRef = db.collection('technicians').doc(techId);
            const techDoc = await techDocRef.get();
            if (techDoc.exists) {
                await techDocRef.delete();
            }
            return NextResponse.json({ success: true, message: 'Technician data removed from Firestore. No matching authentication user found.' });
        }
        
        const userDoc = userQuery.docs[0];
        const uid = userDoc.id; // The document ID is the UID

        // 2. Delete user from Firebase Authentication
        try {
            await auth.deleteUser(uid);
            console.log(`Successfully deleted auth user with UID: ${uid}`);
        } catch(authError: any) {
             if (authError.code === 'auth/user-not-found') {
                console.warn(`Auth user with UID: ${uid} not found. Proceeding with Firestore cleanup.`);
             } else {
                throw authError; // Re-throw other auth errors
             }
        }

        // 3. Delete user and technician documents from Firestore in a batch
        const batch = db.batch();
        const userDocRef = db.collection('users').doc(uid);
        const techDocRef = db.collection('technicians').doc(techId);

        batch.delete(userDocRef);
        batch.delete(techDocRef);

        await batch.commit();
        console.log(`Successfully deleted Firestore documents for techId: ${techId}`);

        return NextResponse.json({ success: true, message: `Technician ${techId} and associated user data have been deleted.` });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        
        let errorMessage = 'An unexpected error occurred while deleting the technician.';
        if (error.code === 'permission-denied') {
            errorMessage = "Permission denied. You don't have the rights to perform this action.";
        }
        
        return NextResponse.json({ success: false, message: errorMessage, error: error.message }, { status: 500 });
    }
}
