
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// IMPORTANT: This file relies on the initialization performed by `src/ai/genkit.ts`.
// By ensuring Genkit initializes first (by being imported in `src/ai/dev.ts`), 
// the Firebase Admin SDK automatically uses the same authentication context, 
// preventing credential conflicts.

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    // The app will be initialized by Genkit's plugin, so we can just call initializeApp()
    // without any credentials. It will use the already-established context.
    adminApp = initializeApp();
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
