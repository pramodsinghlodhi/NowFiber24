
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { techId } = await request.json();

        if (!techId) {
            return NextResponse.json({ success: false, message: 'Technician ID is required.' }, { status: 400 });
        }
        
        const usersRef = adminDb.collection('users');
        const userQuery = await usersRef.where('id', '==', techId).limit(1).get();

        if (userQuery.empty) {
            // If no user found in 'users' collection, maybe it exists in auth but not firestore, or just in technicians collection.
            // We should still try to delete the technician document.
            const techDocRef = adminDb.collection('technicians').doc(techId);
            const techDoc = await techDocRef.get();
            if (techDoc.exists) {
                await techDocRef.delete();
                 return NextResponse.json({ success: true, message: 'Technician data removed from Firestore. No matching authentication user found.' });
            }
            return NextResponse.json({ success: false, message: 'Technician not found.' }, { status: 404 });
        }
        
        const userDoc = userQuery.docs[0];
        const uid = userDoc.id; // The document ID is the UID

        // Delete from Firebase Authentication
        try {
            await adminAuth.deleteUser(uid);
            console.log(`Successfully deleted auth user with UID: ${uid}`);
        } catch(authError: any) {
             if (authError.code === 'auth/user-not-found') {
                console.warn(`Auth user with UID: ${uid} not found. Proceeding with Firestore cleanup.`);
             } else {
                // For other auth errors, we should stop and report.
                throw authError;
             }
        }

        // Delete from Firestore using a batch
        const batch = adminDb.batch();
        const userDocRef = adminDb.collection('users').doc(uid);
        const techDocRef = adminDb.collection('technicians').doc(techId);

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
