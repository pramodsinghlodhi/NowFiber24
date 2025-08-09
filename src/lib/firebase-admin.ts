
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!getApps().length) {
    if (!serviceAccountPath) {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Using default application credentials. This might fail if not running in a configured GCP environment.");
        adminApp = initializeApp();
    } else {
        try {
            const absolutePath = path.resolve(process.cwd(), serviceAccountPath);
            const serviceAccountFile = fs.readFileSync(absolutePath, 'utf8');
            const serviceAccount = JSON.parse(serviceAccountFile);
            
            console.log("Initializing Firebase Admin SDK with service account...");
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e: any) {
             console.error("Failed to load service account key. Make sure the path is correct and the file is valid JSON.", e.message);
             // Fallback to default credentials to avoid a hard crash, but log the error.
             adminApp = initializeApp();
        }
    }
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
