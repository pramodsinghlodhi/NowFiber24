
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    try {
        // When running on App Hosting, the FIREBASE_CONFIG env var is automatically set.
        // This is the recommended way to initialize.
        if (process.env.FIREBASE_CONFIG) {
            console.log("Initializing Firebase Admin with FIREBASE_CONFIG...");
            adminApp = initializeApp();
        } else {
             // For local development, fall back to a service account file.
            console.log("Initializing Firebase Admin with service account...");
            const serviceAccount = require('../../serviceAccountKey.json');
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        }
    } catch (e: any) {
        console.error("Critical error initializing Firebase Admin SDK:", e);
        // If there's an error (e.g., file not found, bad config), we might end up here.
        // It's better to let the app crash loudly than to have undefined services.
        throw new Error("Failed to initialize Firebase Admin SDK. Please check your configuration.");
    }
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
