
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { User, Technician } from '@/lib/types';


export async function POST(request: NextRequest) {
    try {
        const { techId } = await request.json();

        if (!techId) {
            return NextResponse.json({ success: false, message: 'Technician ID is required.' }, { status: 400 });
        }
        
        // Find the user UID from the 'users' collection based on the custom technician ID
        const usersRef = adminDb.collection('users');
        const userQuery = await usersRef.where('id', '==', techId).limit(1).get();

        const batch = adminDb.batch();
        
        // Delete the technician document in Firestore
        const techDocRef = adminDb.collection('technicians').doc(techId);
        batch.delete(techDocRef);

        // If a matching user profile exists, delete it and their auth account
        if (!userQuery.empty) {
            const userDoc = userQuery.docs[0];
            const uid = userDoc.id; // The document ID is the UID
            const userDocRef = adminDb.collection('users').doc(uid);
            batch.delete(userDocRef);

            // Delete from Firebase Authentication, but don't fail if already deleted
            try {
                await adminAuth.deleteUser(uid);
                console.log(`Successfully deleted auth user with UID: ${uid}`);
            } catch(authError: any) {
                 if (authError.code === 'auth/user-not-found') {
                    console.warn(`Auth user with UID: ${uid} not found, but proceeding with Firestore cleanup.`);
                 } else {
                    // For other auth errors, we should stop and report.
                    throw authError;
                 }
            }
        } else {
            console.warn(`No user profile found for techId: ${techId}. Deleting technician document only.`);
        }

        // Commit all batched deletions
        await batch.commit();

        return NextResponse.json({ success: true, message: `Technician ${techId} and associated data have been deleted.` });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        
        let errorMessage = 'An unexpected error occurred while deleting the technician.';
        if (error.code === 'permission-denied') {
            errorMessage = "Permission denied. You don't have the rights to perform this action.";
        }
        
        return NextResponse.json({ success: false, message: errorMessage, error: error.message }, { status: 500 });
    }
}
