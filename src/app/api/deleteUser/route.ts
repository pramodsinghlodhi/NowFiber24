
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

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
        const { techId } = await request.json();

        if (!techId) {
            return NextResponse.json({ success: false, message: 'Technician ID is required.' }, { status: 400 });
        }

        // 1. Find user by custom ID field in Firestore to get the UID
        const usersRef = db.collection('users');
        const userQuery = await usersRef.where('id', '==', techId).limit(1).get();

        if (userQuery.empty) {
            // If no user profile, just try to clean up technician doc.
            console.log(`No user document found for techId ${techId}. Cleaning up technician document.`);
            const techDocRef = db.collection('technicians').doc(techId);
            await techDocRef.delete();
            return NextResponse.json({ success: true, message: 'Technician data removed from Firestore. No matching auth user found.' });
        }
        
        const userDoc = userQuery.docs[0];
        const uid = userDoc.id; // The document ID is the UID

        // 2. Delete user from Firebase Authentication
        await auth.deleteUser(uid);
        console.log(`Successfully deleted auth user with UID: ${uid}`);

        // 3. Delete user and technician documents from Firestore in a batch
        const batch = db.batch();
        const userDocRef = db.collection('users').doc(uid);
        const techDocRef = db.collection('technicians').doc(techId);

        batch.delete(userDocRef);
        batch.delete(techDocRef);

        await batch.commit();
        console.log(`Successfully deleted Firestore documents for techId: ${techId}`);

        return NextResponse.json({ success: true, message: `Technician ${techId} and associated auth user have been deleted.` });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/user-not-found') {
             errorMessage = 'User not found in Firebase Authentication, but an error occurred during cleanup.';
        }
        
        return NextResponse.json({ success: false, message: errorMessage, error: error.message }, { status: 500 });
    }
}
