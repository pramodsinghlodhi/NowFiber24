
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
  console.log("Initializing Firebase Admin SDK...");
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
  console.log("Firebase Admin SDK already initialized.");
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
