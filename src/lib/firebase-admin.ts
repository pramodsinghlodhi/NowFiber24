
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

try {
  if (!getApps().length) {
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (!keyFilePath) {
      throw new Error("The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Please create a serviceAccountKey.json and set the variable in your .env file.");
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(path.resolve(keyFilePath), 'utf8'));

    adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
    console.log("Firebase Admin SDK initialized successfully with explicit credentials.");
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

} catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.message);
}

export { adminApp, adminAuth, adminDb };
