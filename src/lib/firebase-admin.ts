
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

// IMPORTANT: This file is now the single source of truth for server-side
// Firebase Admin SDK authentication. It relies on the GOOGLE_APPLICATION_CREDENTIALS
// environment variable pointing to the serviceAccountKey.json file.

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

try {
  if (!getApps().length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // The SDK will automatically use the project ID from the service account.
        adminApp = initializeApp();
        console.log("Firebase Admin SDK initialized successfully using service account.");
    } else {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS is not set. Firebase Admin SDK is not initialized.");
        // Throwing an error or handling the uninitialized state in dependent functions
        throw new Error("Firebase Admin SDK could not be initialized. Service account credentials are missing.");
    }
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

} catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    // This error is critical for server-side operations.
    // We'll let the dependent functions handle the uninitialized state.
}

export { adminApp, adminAuth, adminDb };
