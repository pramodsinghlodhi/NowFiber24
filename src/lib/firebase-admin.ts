
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

try {
  if (!getApps().length) {
    // The SDK will automatically find the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // so no need to pass in a credential object.
    initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
  }
  
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

} catch (error: any) {
  console.error("CRITICAL: Firebase Admin SDK Initialization Failed:", error);
  // Do not rethrow, to prevent server crashes, but log the critical error.
  // The API routes that depend on this will fail, but the rest of the app might work.
}

export { adminApp, adminAuth, adminDb };
