
import { getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: This file RELIES on the Genkit initialization in `src/ai/genkit.ts`
// to have already run and established an authenticated context. This file does NOT
// initialize the app itself to avoid credential conflicts.

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    throw new Error("Firebase Admin SDK not initialized. Ensure Genkit is configured and initialized before this module is loaded.");
}

adminApp = getApps()[0];
adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
