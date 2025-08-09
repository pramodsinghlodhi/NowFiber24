
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This file now relies on the initialization happening in genkit.ts
// to ensure a single source of truth for credentials. When any server-side
// code imports from '@/ai/genkit' (usually via dev.ts or directly in actions),
// the googleAI() plugin is initialized with application default credentials,
// establishing an authenticated session. Subsequent calls to getAuth() or
// getFirestore() will reuse that session.

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    // This will get the app initialized by Genkit's plugin.
    // It assumes that a file importing `genkit.ts` has already been loaded.
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);


export { adminApp, adminAuth, adminDb };
