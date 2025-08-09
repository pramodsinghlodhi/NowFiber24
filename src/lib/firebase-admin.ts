
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

try {
  if (!getApps().length) {
    // The SDK will automatically use the service account file specified
    // by the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    // For local development, this variable should be set in a .env file.
    // For production, this should be set as a secret in your hosting environment.
    adminApp = initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
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
