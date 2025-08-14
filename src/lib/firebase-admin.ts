
import * as admin from 'firebase-admin';
import { App, getApps } from 'firebase-admin/app';
import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

if (!getApps().length) {
    // This is the recommended way for server-side code (including Next.js server actions)
    // to authenticate. It will automatically find the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable.
    try {
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized successfully.");
    } catch(error: any) {
        console.error("CRITICAL: Firebase Admin SDK Initialization Failed.", error);
    }
}

adminApp = admin.app();
adminAuth = admin.auth();
adminDb = admin.firestore();


export { adminApp, adminAuth, adminDb };
