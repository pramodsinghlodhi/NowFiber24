
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { techId } = await request.json();

        if (!techId) {
            return NextResponse.json({ success: false, message: 'Technician ID is required.' }, { status: 400 });
        }
        
        // Find the user document in Firestore to get the UID for the Auth deletion
        const usersRef = adminDb.collection('users');
        const userQuerySnapshot = await usersRef.where('id', '==', techId).limit(1).get();

        if (userQuerySnapshot.empty) {
            // If there's no user profile, we can still try to clean up the technician document
            // This makes the function more resilient.
            const techDocRef = adminDb.collection('technicians').doc(techId);
            const techDoc = await techDocRef.get();
            if (techDoc.exists) {
                await techDocRef.delete();
                return NextResponse.json({ success: true, message: `Technician document ${techId} deleted. No corresponding user profile was found.` });
            } else {
                 return NextResponse.json({ success: false, message: 'Technician and user profile not found.' }, { status: 404 });
            }
        }
        
        const userDoc = userQuerySnapshot.docs[0];
        const uid = userDoc.id; // The user document's ID is the Firebase Auth UID

        // 1. Delete Firebase Auth user
        // It's safer to delete the auth user first. If this fails, we don't proceed.
        try {
            await adminAuth.deleteUser(uid);
            console.log(`Successfully deleted auth user with UID: ${uid}`);
        } catch(authError: any) {
             if (authError.code === 'auth/user-not-found') {
                console.warn(`Auth user with UID: ${uid} was not found. Proceeding with Firestore cleanup.`);
             } else {
                // For any other auth error, we should stop and report it.
                throw authError;
             }
        }

        // 2. Delete Firestore documents in an atomic batch
        const batch = adminDb.batch();
        
        const userDocRef = adminDb.collection('users').doc(uid);
        batch.delete(userDocRef);

        const techDocRef = adminDb.collection('technicians').doc(techId);
        batch.delete(techDocRef);

        // Commit all batched deletions
        await batch.commit();

        return NextResponse.json({ success: true, message: `Technician ${techId} and associated data have been deleted successfully.` });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        
        let errorMessage = 'An unexpected error occurred while deleting the technician.';
        if (error.code === 'permission-denied') {
            errorMessage = "Permission denied. You don't have the rights to perform this action.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return NextResponse.json({ success: false, message: errorMessage, error: error.message }, { status: 500 });
    }
}
