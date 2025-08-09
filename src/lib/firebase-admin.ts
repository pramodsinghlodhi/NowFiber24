
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This file will now rely on the initialization happening in genkit.ts
// to ensure a single source of truth for credentials.

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    // In a Genkit environment, the app is often initialized by the plugin.
    // If running outside Genkit (e.g. tests), this will initialize.
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);


export { adminApp, adminAuth, adminDb };
