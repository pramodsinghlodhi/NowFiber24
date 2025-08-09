
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

// This logic now explicitly initializes the Admin SDK using service account credentials.
// This is the most robust authentication method for server environments.
if (!getApps().length) {
    // When running on Google Cloud infrastructure (like Cloud Run, App Engine),
    // the service account is automatically available.
    // For local development, you must set the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable to point to your service account key file.
    const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey) as ServiceAccount;
             adminApp = initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (e) {
            // This might happen if the env var is not a valid JSON object.
            // Fallback to default credentials.
            console.warn("Could not parse GOOGLE_APPLICATION_CREDENTIALS. Falling back to default credentials.");
            adminApp = initializeApp();
        }
    } else {
        // If the env var is not set, initialize with Application Default Credentials.
        // This is suitable for production environments on Google Cloud.
        adminApp = initializeApp();
    }
} else {
    adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
