
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This file now relies on the initialization happening in genkit.ts
// to ensure a single source of truth for credentials. When any server-side
// code imports from './genkit', the googleAI() plugin is initialized with
// application default credentials, establishing an authenticated session.
// Subsequent calls to getAuth() or getFirestore() will reuse that session.

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    // Genkit's plugin initialization handles the app initialization.
    // This call will get the app initialized by Genkit.
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);


export { adminApp, adminAuth, adminDb };
