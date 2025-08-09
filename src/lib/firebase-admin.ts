
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

// Import to ensure Genkit is initialized first, which sets up the
// Google Cloud authentication context for the entire application.
import '@/ai/genkit';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

try {
  if (!getApps().length) {
    // The SDK will automatically use the credentials and project ID
    // established by the Genkit googleAI() plugin.
    adminApp = initializeApp();
    console.log("Firebase Admin SDK initialized successfully, reusing Genkit's auth context.");
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
