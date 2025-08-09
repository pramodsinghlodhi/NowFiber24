
'use server';

import { initializeApp as initializeAdminApp, getApps as getAdminApps, App as AdminApp, ServiceAccount, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import 'dotenv/config';

let adminApp: AdminApp;

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!getAdminApps().length) {
    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            adminApp = initializeAdminApp({
                credential: credential.cert(serviceAccount)
            });
        } catch (e) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
            // Fallback to default initialization if parsing fails
            adminApp = initializeAdminApp();
        }
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Using default initialization.");
        adminApp = initializeAdminApp();
    }
} else {
    adminApp = getAdminApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };
