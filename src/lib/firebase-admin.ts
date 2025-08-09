
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

if (!getApps().length) {
    console.log("Initializing Firebase Admin SDK...");
    try {
        if (process.env.FIREBASE_CONFIG) {
            console.log("Found FIREBASE_CONFIG. Initializing with default credentials.");
            adminApp = initializeApp();
        } else if (fs.existsSync(serviceAccountPath)) {
            console.log("Found serviceAccountKey.json. Initializing with service account.");
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } else {
            console.warn("Could not find FIREBASE_CONFIG env var or serviceAccountKey.json. Attempting to initialize with default app credentials. This might fail in some environments.");
            adminApp = initializeApp();
        }
    } catch (e: any) {
        console.error("CRITICAL: Firebase Admin SDK initialization failed.", e);
        // We throw an error to prevent the app from running in a broken state.
        throw new Error(`Firebase Admin SDK could not be initialized. Error: ${e.message}`);
    }
} else {
    adminApp = getApps()[0];
    console.log("Firebase Admin SDK already initialized.");
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
