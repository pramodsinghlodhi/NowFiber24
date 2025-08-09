
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { User, Technician } from '@/lib/types';

export async function POST(request: NextRequest) {
    const { isEditing, techData, userData, oldTechId } = await request.json();
    
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Logic for UPDATING an existing technician
    if (isEditing) {
        try {
            if (!oldTechId) {
                return NextResponse.json({ success: false, message: 'Original technician ID is required for editing.'}, { status: 400 });
            }

            const usersRef = adminDb.collection('users');
            const userQuery = await usersRef.where('id', '==', oldTechId).limit(1).get();
            
            if (userQuery.empty) {
                return NextResponse.json({ success: false, message: 'Original user profile not found.'}, { status: 404 });
            }
            const userDoc = userQuery.docs[0];
            const uid = userDoc.id; // The document ID is the UID

            // Update Firebase Auth user
            await adminAuth.updateUser(uid, {
                displayName: userData.name,
                photoURL: userData.avatarUrl,
            });

            // Update Firestore documents in a batch
            const batch = adminDb.batch();
            const techDocRef = adminDb.collection('technicians').doc(oldTechId);
            const userDocRef = adminDb.collection('users').doc(uid);
            
            const techUpdateData: Partial<Technician> = {
                name: techData.name,
                role: techData.role,
                contact: techData.contact,
                avatarUrl: techData.avatarUrl
            };
            
            const userUpdateData: Partial<User> = {
                name: userData.name,
                avatarUrl: userData.avatarUrl,
            };

            batch.update(techDocRef, techUpdateData);
            batch.update(userDocRef, userUpdateData);

            await batch.commit();

            return NextResponse.json({ success: true, title: "Technician Updated", message: `${techData.name}'s details have been updated.` });

        } catch (error: any) {
            console.error("Error updating technician:", error);
            return NextResponse.json({ success: false, message: "Could not update technician.", error: error.message }, { status: 500 });
        }

    // Logic for ADDING a new technician
    } else {
        if (!userData.password) {
            return NextResponse.json({ success: false, message: 'Password is required for new users.'}, { status: 400 });
        }
        
        let newAuthUser;

        try {
            // 1. Create the user in Firebase Auth
            newAuthUser = await adminAuth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.name,
                photoURL: userData.avatarUrl,
            });
            
            // 2. Set custom claims for role-based access control
            await adminAuth.setCustomUserClaims(newAuthUser.uid, { role: 'Technician', userId: userData.id });

            // 3. Create the corresponding documents in Firestore
            const batch = adminDb.batch();
            
            // User profile document
            const userDocRef = adminDb.collection('users').doc(newAuthUser.uid);
            const finalUserData: User = { 
                uid: newAuthUser.uid,
                id: userData.id, 
                name: userData.name,
                role: 'Technician',
                email: userData.email,
                isBlocked: false,
                avatarUrl: userData.avatarUrl,
            };
            batch.set(userDocRef, finalUserData);
            
            // Technician data document
            const techDocRef = adminDb.collection('technicians').doc(techData.id);
            const finalTechData: Technician = {
                id: techData.id,
                name: techData.name,
                role: techData.role,
                contact: techData.contact,
                avatarUrl: techData.avatarUrl,
                lat: techData.lat || 34.0522, // Default to a reasonable location
                lng: techData.lng || -118.2437,
                isActive: false, // Default to inactive
                status: 'available',
                path: [],
            };
            batch.set(techDocRef, finalTechData);

            await batch.commit();

            return NextResponse.json({ success: true, title: "Technician Added", message: `${userData.name} has been added to the team.` });

        } catch (error: any) {
            console.error("Error adding new technician:", error);
            
            // If something fails after creating the auth user, roll back the user creation
            if (newAuthUser) {
                await adminAuth.deleteUser(newAuthUser.uid);
                console.log("Rolled back auth user creation due to Firestore error.");
            }

            let message = "Could not add new technician.";
            if (error.code === 'auth/email-already-exists') {
                message = "This email address is already in use.";
            } else if (error.code === 'auth/invalid-email') {
                message = "The email address is not valid.";
            } else if (error.code === 'auth/weak-password') {
                message = "The password must be at least 6 characters long."
            }
            
            return NextResponse.json({ success: false, message, error: error.message }, { status: 500 });
        }
    }
}
