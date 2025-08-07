

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

// Securely initialize the Firebase Admin SDK.
// This is the recommended pattern for Next.js API routes.
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

        const usersRef = db.collection('users');
        const userQuery = await usersRef.where('id', '==', techId).limit(1).get();

        if (userQuery.empty) {
            const techDocRef = db.collection('technicians').doc(techId);
            const techDoc = await techDocRef.get();
            if (techDoc.exists) {
                await techDocRef.delete();
            }
            return NextResponse.json({ success: true, message: 'Technician data removed from Firestore. No matching authentication user found.' });
        }
        
        const userDoc = userQuery.docs[0];
        const uid = userDoc.id; // The document ID is the UID

        try {
            await auth.deleteUser(uid);
            console.log(`Successfully deleted auth user with UID: ${uid}`);
        } catch(authError: any) {
             if (authError.code === 'auth/user-not-found') {
                console.warn(`Auth user with UID: ${uid} not found. Proceeding with Firestore cleanup.`);
             } else {
                throw authError;
             }
        }

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
