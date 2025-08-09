
'use server';

import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: AdminApp;

if (!getAdminApps().length) {
    // When running on App Hosting, the FIREBASE_CONFIG env var is automatically set
    // This is the recommended way to initialize
    if (process.env.FIREBASE_CONFIG) {
        adminApp = initializeAdminApp();
    } else {
        // For local development, you might use a service account file
        // This path should be configured in your local environment
        try {
            const serviceAccount = require('../../serviceAccountKey.json');
             adminApp = initializeAdminApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Could not initialize Firebase Admin SDK. Ensure you have a serviceAccountKey.json file in your root directory for local development, or that FIREBASE_CONFIG is set in your environment.", e);
            // Provide a dummy app to prevent the entire app from crashing during build
            adminApp = initializeAdminApp({ projectId: "stub-project-id-for-build" });
        }
    }
} else {
    adminApp = getAdminApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
