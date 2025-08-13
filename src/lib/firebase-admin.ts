
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
}

let adminInstance: FirebaseAdmin | null = null;

function initializeAdmin(): FirebaseAdmin {
  if (getApps().length > 0) {
    const existingApp = getApps()[0];
    return {
      app: existingApp,
      auth: getAuth(existingApp),
      db: getFirestore(existingApp),
    };
  }

  // The SDK will automatically find the GOOGLE_APPLICATION_CREDENTIALS environment variable.
  const app = initializeApp();
  
  console.log("Firebase Admin SDK initialized successfully.");

  return {
    app: app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

try {
  if (!adminInstance) {
    adminInstance = initializeAdmin();
  }
} catch (error) {
    console.error("CRITICAL: Firebase Admin SDK Initialization Failed:", error);
}

export const adminApp = adminInstance?.app;
export const adminAuth = adminInstance?.auth;
export const adminDb = adminInstance?.db;
