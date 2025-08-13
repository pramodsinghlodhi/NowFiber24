
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

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

  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!keyFilePath) {
    throw new Error(
      "The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Please create a serviceAccountKey.json and set the variable in your .env file."
    );
  }

  if (!fs.existsSync(path.resolve(keyFilePath))) {
      throw new Error(`Service account key file not found at path: ${keyFilePath}. Please ensure the file exists and the path is correct.`);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(keyFilePath), 'utf8'));

  const newApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  console.log("Firebase Admin SDK initialized successfully.");

  return {
    app: newApp,
    auth: getAuth(newApp),
    db: getFirestore(newApp),
  };
}

// Initialize and export instances
try {
  if (!adminInstance) {
    adminInstance = initializeAdmin();
  }
} catch (error) {
    console.error("CRITICAL: Firebase Admin SDK Initialization Failed:", error);
    // In a real scenario, you might want to prevent the app from starting or have a retry mechanism.
    // For now, we will allow the app to run but auth and db dependent features will fail.
}


// Export the initialized instances, which might be null if initialization failed.
export const adminApp = adminInstance?.app;
export const adminAuth = adminInstance?.auth;
export const adminDb = adminInstance?.db;
