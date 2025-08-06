

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { User, Technician } from '@/lib/types';


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
    // TODO: Add robust authentication check to ensure only admins can call this.
    const { isEditing, techData, userData, oldTechId } = await request.json();

    if (isEditing) {
        // --- EDIT LOGIC ---
        try {
            if (!oldTechId) {
                return NextResponse.json({ success: false, message: 'Original technician ID is required for editing.'}, { status: 400 });
            }

            // The technician's ID (`oldTechId`) is immutable. We use it to find the user's UID.
            const usersRef = db.collection('users');
            const userQuery = await usersRef.where('id', '==', oldTechId).limit(1).get();
            
            if (userQuery.empty) {
                return NextResponse.json({ success: false, message: 'Original user profile not found.'}, { status: 404 });
            }
            const userDoc = userQuery.docs[0];
            const uid = userDoc.id; // The document ID is the UID

            // Update Auth user
            await auth.updateUser(uid, {
                displayName: userData.name,
                photoURL: userData.avatarUrl,
            });

            // Update Firestore docs in a batch
            const batch = db.batch();
            const techDocRef = db.collection('technicians').doc(oldTechId);
            const userDocRef = db.collection('users').doc(uid);
            
            // Only update the fields that can be changed
            const techUpdateData: Partial<Technician> = {
                name: techData.name,
                role: techData.role,
                contact: techData.contact,
                avatarUrl: techData.avatarUrl
            };
            
            const userUpdateData: Partial<User> = {
                name: userData.name,
                avatarUrl: userData.avatarUrl
            };

            batch.update(techDocRef, techUpdateData);
            batch.update(userDocRef, userUpdateData);

            await batch.commit();

            return NextResponse.json({ success: true, title: "Technician Updated", message: `${techData.name}'s details have been updated.` });

        } catch (error: any) {
            console.error("Error updating technician:", error);
            return NextResponse.json({ success: false, message: "Could not update technician.", error: error.message }, { status: 500 });
        }

    } else {
        // --- ADD LOGIC ---
        if (!userData.password) {
            return NextResponse.json({ success: false, message: 'Password is required for new users.'}, { status: 400 });
        }
        
        const email = `${userData.id}@fibervision.com`;
        let newAuthUser;

        try {
            // 1. Create Firebase Auth user
            newAuthUser = await auth.createUser({
                email,
                password: userData.password,
                displayName: userData.name,
                photoURL: userData.avatarUrl,
            });
            
            // Set custom claim for role-based access
            await auth.setCustomUserClaims(newAuthUser.uid, { role: 'Technician' });

            // 2. Create user and technician documents in Firestore using a BATCH
            const batch = db.batch();
            
            const userDocRef = db.collection('users').doc(newAuthUser.uid);
            const finalUserData: User = { 
                uid: newAuthUser.uid,
                id: userData.id, 
                name: userData.name,
                role: 'Technician',
                isBlocked: false,
                avatarUrl: userData.avatarUrl,
            };
            batch.set(userDocRef, finalUserData);
            
            const techDocRef = db.collection('technicians').doc(techData.id);
            // Ensure all required fields are present for a new technician
            const finalTechData: Technician = {
                id: techData.id,
                name: techData.name,
                role: techData.role,
                contact: techData.contact,
                avatarUrl: techData.avatarUrl,
                lat: techData.lat || 34.0522, // Default LA coordinates
                lng: techData.lng || -118.2437,
                isActive: false, // Default to inactive
                status: 'available', // Default to available
                path: [], // Default to empty path
            };
            batch.set(techDocRef, finalTechData);

            await batch.commit();

            return NextResponse.json({ success: true, title: "Technician Added", message: `${userData.name} has been added to the team.` });

        } catch (error: any) {
            console.error("Error adding new technician:", error);
            
            // If auth user was created but firestore failed, roll back by deleting the auth user
            if (newAuthUser) {
                await auth.deleteUser(newAuthUser.uid);
                console.log("Rolled back auth user creation due to Firestore error.");
            }

            let message = "Could not add new technician.";
            if (error.code === 'auth/email-already-exists') {
                message = "This Technician ID is already in use.";
            } else if (error.code === 'auth/weak-password') {
                message = "The password must be at least 6 characters long."
            }
            
            return NextResponse.json({ success: false, message, error: error.message }, { status: 500 });
        }
    }
}
