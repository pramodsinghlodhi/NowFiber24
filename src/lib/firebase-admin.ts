
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
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      if (process.env.VERCEL) {
        console.log("Running on Vercel, using environment variable for service account.");
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
         adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        throw new Error("serviceAccountKey.json not found and not on Vercel. Please follow the README for setup instructions.");
      }
    } else {
      console.log("Using local serviceAccountKey.json for Firebase Admin SDK.");
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

} catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    // We don't want to throw here as it might break parts of the app that don't need admin sdk,
    // but we need to be aware of the failure. The API routes that depend on this will fail gracefully.
}


export { adminApp, adminAuth, adminDb };
